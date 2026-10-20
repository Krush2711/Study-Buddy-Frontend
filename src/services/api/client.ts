import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { LoginResponse } from './types'
import type { ApiErrorShape, SessionUser } from './types'

/* --------------------------- Configuration ----------------------------- */

/**
 * Hosted StudyBuddy API. In development the Vite proxy forwards `/api` here so
 * the browser never makes a cross-origin request; a production build talks to
 * the hosted origin directly (the API must allow the app's origin via CORS).
 */
export const REMOTE_API_ORIGIN = (
  // import.meta.env.VITE_API_ORIGIN ?? 'https://krushnas2.studybuddy.blitz.cloud'
  import.meta.env.VITE_API_ORIGIN ?? 'https://krushnas.studybuddy.blitz.cloud/'
).replace(/\/+$/, '')

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '/api' : `${REMOTE_API_ORIGIN}/api`)
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL ?? '/ai'
const GOOGLE_AUTH_URL =
  import.meta.env.VITE_GOOGLE_AUTH_URL ?? `${REMOTE_API_ORIGIN}/api/login-google`
/**
 * In development this exchange goes through the Vite proxy so the request is
 * same-origin: the local Kestrel instance registers no CORS policy for the
 * dev server's origin, and a direct cross-origin fetch with credentials would
 * be blocked by the browser. Cookies are host-scoped (`localhost`, any port),
 * so the auth cookie set during the popup hop is still presented to the proxy.
 */
const GOOGLE_EXCHANGE_URL = import.meta.env.DEV
  ? '/api/auth/google-response'
  : `${REMOTE_API_ORIGIN}/api/auth/google-response`

const REQUEST_TIMEOUT_MS = 30_000
/** Document ingestion runs OCR + Gemini synchronously; the server allows 10 min. */
const INGEST_TIMEOUT_MS = 10 * 60 * 1000
/** Notes / summary / mindmap generation goes out to Gemini. */
const AI_TIMEOUT_MS = 5 * 60 * 1000

export const storageKeys = {
  token: 'studybuddy.token',
  user: 'studybuddy.user',
  refreshToken: 'studybuddy.refreshToken',
} as const

export const config = {
  apiBaseUrl: API_BASE_URL,
  aiBaseUrl: AI_BASE_URL,
  googleAuthUrl: GOOGLE_AUTH_URL,
  remoteOrigin: REMOTE_API_ORIGIN,
}

/* ------------------------------ Errors --------------------------------- */

/**
 * Raised when the UI reaches for a capability the backend does not implement.
 * Carries the endpoint the UI is waiting on so placeholders can name it.
 */
export class EndpointUnavailableError extends Error {
  readonly needed: string
  readonly capability: string

  constructor(capability: string, needed: string, detail?: string) {
    super(detail ?? `${capability} is not implemented by the backend yet.`)
    this.name = 'EndpointUnavailableError'
    this.capability = capability
    this.needed = needed
  }
}

/** Type guard used by pages to swap in an integration placeholder. */
export function isUnavailable(error: unknown): error is EndpointUnavailableError {
  return error instanceof EndpointUnavailableError
}

/**
 * Normalizes the three failure shapes this stack produces:
 *  1. GlobalExceptionMiddleware -> { success: false, statusCode, message }
 *  2. [ApiController] model validation -> ValidationProblemDetails { errors }
 *  3. Proxy/network failures, 401/403 with empty bodies, 404 from Kestrel
 */
export function toApiError(error: unknown): ApiErrorShape {
  if (error instanceof EndpointUnavailableError) {
    return { status: 501, message: error.message, unavailable: true }
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>
    const status = axiosError.response?.status ?? 0
    const data = axiosError.response?.data

    if (!axiosError.response) {
      const offline =
        axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT'
      return {
        status: 0,
        message: offline
          ? 'The request timed out. The server may still be processing — try again in a moment.'
          : 'Cannot reach the StudyBuddy API. Check that the backend is running and the proxy target is correct.',
      }
    }

    // Shape 2: model validation
    const rawErrors = (data as { errors?: unknown } | undefined)?.errors

    if (
      rawErrors &&
      typeof rawErrors === 'object' &&
      !Array.isArray(rawErrors)
    ) {
      const errors = rawErrors as Record<string, string[]>
      const flat = Object.values(errors).flat().filter(Boolean)

      return {
        status,
        message: flat[0] ?? 'Some fields need attention.',
        fieldErrors: errors,
      }
    }

    // Shape 1: exception-envelope (server spells it `message`)
    const envelopeMessage =
      data && typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : undefined

    if (envelopeMessage) {
      return { status, message: envelopeMessage }
    }

    // Plain string body
    if (typeof data === 'string' && data.trim() && data.length < 300) {
      return { status, message: data }
    }

    return { status, message: defaultMessageForStatus(status) }
  }

  if (error instanceof Error) {
    return { status: 0, message: error.message }
  }

  return { status: 0, message: 'Something went wrong.' }
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'The request was rejected. Check the submitted values.'
    case 401:
      return 'Your session expired. Please sign in again.'
    case 403:
      return 'You do not have access to this resource.'
    case 404:
      return 'That record could not be found.'
    case 409:
      return 'That action conflicts with data that already exists.'
    case 429:
      return 'Too many requests. Wait a moment and try again.'
    case 500:
    case 502:
    case 503:
      return 'The StudyBuddy API reported a server error.'
    default:
      return `Request failed with status ${status}.`
  }
}

/* ------------------------------ Session -------------------------------- */

export const sessionStore = {
  getToken(): string | null {
    try {
      return localStorage.getItem(storageKeys.token)
    } catch {
      return null
    }
  },
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(storageKeys.refreshToken)
    } catch {
      return null
    }
  },
  getUser(): SessionUser | null {
    try {
      const raw = localStorage.getItem(storageKeys.user)
      if (!raw) return null
      const parsed = JSON.parse(raw) as SessionUser
      if (!parsed?.id || !parsed?.email) return null
      return parsed
    } catch {
      return null
    }
  },
  save(token: string, user: SessionUser, refreshToken?: string): void {
    try {
      localStorage.setItem(storageKeys.token, token)
      localStorage.setItem(storageKeys.user, JSON.stringify(user))
      if (refreshToken) {
        localStorage.setItem(storageKeys.refreshToken, refreshToken)
      }
    } catch {
      /* storage disabled — the session still works for this tab */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(storageKeys.token)
      localStorage.removeItem(storageKeys.user)
      localStorage.removeItem(storageKeys.refreshToken)
    } catch {
      /* no-op */
    }
  },
}

/**
 * Session expiry is broadcast so the app can route to /login with a return path
 * from anywhere, including inside async calls. Avoids importing the router here.
 */
type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

/**
 * The admin API key is held only in memory for the lifetime of the tab (see
 * AdminKeyContext). It is deliberately not persisted: no localStorage, no
 * sessionStorage, no build-time env var. Any of those would expose it to XSS or
 * to anyone reading the bundle.
 */
let adminApiKey: string | null = null

export function setAdminApiKey(key: string | null): void {
  adminApiKey = key
}

export function hasAdminApiKey(): boolean {
  return Boolean(adminApiKey)
}

/* ------------------------------ Clients -------------------------------- */

/* --------------------------- Token renewal ----------------------------- */

/**
 * Access tokens are short-lived (15 minutes), so the client renews them
 * instead of waiting for a 401 that would surface as a spurious logout.
 *
 * Two triggers, both feeding the same single-flight promise:
 *  - proactive: a request is about to go out with a token close to expiry
 *  - reactive: the server already answered 401
 *
 * One refresh at a time is essential — a page that fires six requests must
 * not start six rotations, because rotation invalidates the previous token
 * and the extra rotations would then look like token replay.
 */
const REFRESH_ENDPOINT = `${API_BASE_URL}/refresh`

/** Renew this long before the token actually expires. */
const REFRESH_SKEW_MS = 60_000

let refreshInFlight: Promise<boolean> | null = null
let refreshTimer: number | null = null

interface JwtPayload {
  exp?: number
}

/** Reads `exp` without verifying the signature — the server is the authority. */
function readTokenExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    )

    const decoded = JSON.parse(atob(padded)) as JwtPayload

    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

function isExpiringSoon(token: string): boolean {
  const expiresAt = readTokenExpiryMs(token)

  // An unreadable token is treated as fine: the 401 path still covers it.
  if (expiresAt === null) return false

  return expiresAt - Date.now() <= REFRESH_SKEW_MS
}

/** Schedules a refresh for a moment before the token dies. */
function scheduleRefresh(token: string): void {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer)
    refreshTimer = null
  }

  const expiresAt = readTokenExpiryMs(token)
  if (expiresAt === null) return

  const delay = Math.max(1_000, expiresAt - Date.now() - REFRESH_SKEW_MS)
  refreshTimer = window.setTimeout(() => void refreshSession(), delay)
}

/**
 * Exchanges the stored refresh token for a new pair. Resolves true on success.
 * Concurrent callers share one in-flight request.
 */
export function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  const refreshToken = sessionStore.getRefreshToken()

  if (!refreshToken) {
    return Promise.resolve(false)
  }

  refreshInFlight = (async () => {
    try {
      // Deliberately a bare axios call: going through `api` would re-enter
      // this interceptor and a failed refresh would recurse.
      const { data } = await axios.post<LoginResponse>(
        REFRESH_ENDPOINT,
        { refreshToken },
        { timeout: REQUEST_TIMEOUT_MS, headers: { Accept: 'application/json' } },
      )

      if (!data?.token) return false

      const current = sessionStore.getUser()
      const user: SessionUser = current ?? {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
      }

      sessionStore.save(data.token, user, data.refreshToken)
      scheduleRefresh(data.token)

      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

/**
 * Called once a session is established (login, Google, restored session) so
 * renewal runs on a timer rather than only when something happens to fail.
 */
export function startSessionKeepAlive(): void {
  const token = sessionStore.getToken()
  if (token) scheduleRefresh(token)
}

export function stopSessionKeepAlive(): void {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

/* -------------------- Authorization on a live token -------------------- */

/**
 * Installed by AuthContext. The interceptor below cannot navigate, and it must
 * not silently drop a session that a refresh could have saved.
 */
type SessionRefreshedHandler = () => void
let onSessionRefreshed: SessionRefreshedHandler | null = null

export function setSessionRefreshedHandler(
  handler: SessionRefreshedHandler | null,
): void {
  onSessionRefreshed = handler
}

function createClient(baseURL: string, timeout: number): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout,
    withCredentials: false,
    headers: { Accept: 'application/json' },
  })

  instance.interceptors.request.use(async (request) => {
    const token = sessionStore.getToken()

    // Renew before the call rather than letting it fail: a request that is
    // about to be rejected is cheaper to fix than to retry.
    if (token && isExpiringSoon(token)) {
      const refreshed = await refreshSession()
      if (refreshed) {
        onSessionRefreshed?.()
        const next = sessionStore.getToken()
        if (next) request.headers.set('Authorization', `Bearer ${next}`)
        return request
      }
    }

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        return Promise.reject(error)
      }

      const axiosError = error as AxiosError<unknown>
      const original = axiosError.config as
        | (InternalAxiosRequestConfig & { _retriedAfterRefresh?: boolean })
        | undefined

      const isAuthAttempt = /\/login$|\/auth$|\/refresh$|\/logout$/.test(
        original?.url ?? '',
      )
      const hadToken = Boolean(sessionStore.getToken())

      // A failed login also returns 401 and must NOT clear a live session.
      if (!hadToken || isAuthAttempt) {
        return Promise.reject(error)
      }

      // Already renewed once for this request — the session is genuinely gone.
      if (original?._retriedAfterRefresh) {
        sessionStore.clear()
        stopSessionKeepAlive()
        onUnauthorized?.()
        return Promise.reject(error)
      }

      const refreshed = await refreshSession()

      if (!refreshed || !original) {
        sessionStore.clear()
        stopSessionKeepAlive()
        onUnauthorized?.()
        return Promise.reject(error)
      }

      onSessionRefreshed?.()

      const next = sessionStore.getToken()
      if (next) {
        original.headers.set('Authorization', `Bearer ${next}`)
      }
      original._retriedAfterRefresh = true

      return instance.request(original)
    },
  )

  return instance
}

/** JWT-bearing client for the ASP.NET Core API. */
export const api: AxiosInstance = createClient(API_BASE_URL, REQUEST_TIMEOUT_MS)

/** Longer-timeout variant for multipart ingestion. */
export const ingestClient: AxiosInstance = createClient(
  API_BASE_URL,
  INGEST_TIMEOUT_MS,
)

/**
 * FastAPI client. Routed through the Vite proxy in dev because the AI service
 * registers no CORSMiddleware; see vite.config.ts.
 */
export const ai: AxiosInstance = createClient(AI_BASE_URL, AI_TIMEOUT_MS)

/**
 * Admin client. Sends X-Admin-Api-Key from the in-memory key only.
 * Authorization is enforced server-side by AdminApiKeyAuthenticationHandler —
 * hiding the route in the UI is not a security control.
 */
export const adminApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
})

adminApi.interceptors.request.use((request) => {
  // The admin API accepts either an admin JWT or the API key. Send whichever
  // credential this tab holds; the server decides whether it is privileged.
  const token = sessionStore.getToken()
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
  if (adminApiKey) {
    request.headers.set('X-Admin-Api-Key', adminApiKey)
  }
  return request
})

/**
 * Verifies an admin credential by hitting a protected admin endpoint.
 * Pass a key to test X-Admin-Api-Key, or null to test the current JWT.
 */
export async function verifyAdminKey(candidate: string | null): Promise<void> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (candidate) {
    headers['X-Admin-Api-Key'] = candidate
  } else {
    const token = sessionStore.getToken()
    if (!token) throw new Error('Sign in as an administrator first.')
    headers.Authorization = `Bearer ${token}`
  }

  await axios.get(`${API_BASE_URL}/admin/users`, {
    timeout: REQUEST_TIMEOUT_MS,
    headers,
  })
}

/* --------------------------- Google exchange --------------------------- */

/**
 * Completes the Google round trip.
 *
 * GET /api/login-google is opened as a top-level navigation (or a popup). After
 * Google redirects to /api/auth/google-response, the API returns the login
 * payload as JSON instead of redirecting back into the SPA. The auth cookie set
 * during that hop is what authorises this call, so it MUST be sent with
 * credentials: 'include' — and the hosted API must allow this origin with
 * Access-Control-Allow-Credentials.
 */
export async function exchangeGoogleSession(): Promise<LoginResponse> {
  let response: Response
  try {
    response = await fetch(GOOGLE_EXCHANGE_URL, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new Error(
      'Could not reach the Google sign-in exchange. The hosted API may not allow this origin (CORS with credentials).',
    )
  }

  if (!response.ok) {
    let message = defaultMessageForStatus(response.status)
    try {
      const body = (await response.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      /* non-JSON error body */
    }
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  const payload = (await response.json()) as LoginResponse
  if (!payload?.token) {
    throw new Error('Google sign-in did not return a session token.')
  }
  return payload
}
