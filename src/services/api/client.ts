import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiErrorShape, SessionUser } from './types'

/* --------------------------- Configuration ----------------------------- */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL ?? '/ai'
const GOOGLE_AUTH_URL = import.meta.env.VITE_GOOGLE_AUTH_URL ?? '/api/login-google'

const REQUEST_TIMEOUT_MS = 30_000
/** Document ingestion runs OCR + Gemini synchronously; the server allows 10 min. */
const INGEST_TIMEOUT_MS = 10 * 60 * 1000
/** Notes / summary / mindmap generation goes out to Gemini. */
const AI_TIMEOUT_MS = 5 * 60 * 1000

export const storageKeys = {
  token: 'studybuddy.token',
  user: 'studybuddy.user',
} as const

export const config = {
  apiBaseUrl: API_BASE_URL,
  aiBaseUrl: AI_BASE_URL,
  googleAuthUrl: GOOGLE_AUTH_URL,
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
if (
  typeof data === 'string' &&
  data.trim().length > 0 &&
  data.length < 300
) {
  return { status, message: data }
}    if (typeof data === 'string' && data.trim() && data.length < 300) {
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
  save(token: string, user: SessionUser): void {
    try {
      localStorage.setItem(storageKeys.token, token)
      localStorage.setItem(storageKeys.user, JSON.stringify(user))
    } catch {
      /* storage disabled — the session still works for this tab */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(storageKeys.token)
      localStorage.removeItem(storageKeys.user)
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

function attachAuthHeader(
  request: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const token = sessionStore.getToken()
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
  return request
}

function createClient(baseURL: string, timeout: number): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout,
    withCredentials: false,
    headers: { Accept: 'application/json' },
  })

  instance.interceptors.request.use(attachAuthHeader)

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Only a token-bearing request means the session is dead. A failed
        // login also returns 401 and must NOT clear an existing session.
        const hadToken = Boolean(sessionStore.getToken())
        const isAuthAttempt = /\/login$|\/auth$/.test(
          error.config?.url ?? '',
        )
        if (hadToken && !isAuthAttempt) {
          sessionStore.clear()
          onUnauthorized?.()
        }
      }
      return Promise.reject(error)
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
  if (adminApiKey) {
    request.headers.set('X-Admin-Api-Key', adminApiKey)
  }
  return request
})

/** Verifies a candidate admin key by hitting a protected endpoint. */
export async function verifyAdminKey(candidate: string): Promise<void> {
  await axios.get(`${API_BASE_URL}/admin/users`, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'X-Admin-Api-Key': candidate,
    },
  })
}
