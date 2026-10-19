import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../services/api/auth'
import { usersApi } from '../services/api/users'
import {
  sessionStore,
  setUnauthorizedHandler,
  toApiError,
} from '../services/api/client'
import type { ApiErrorShape, SessionUser, UserProfile } from '../services/api/types'

interface AuthContextValue {
  user: SessionUser | null
  profile: UserProfile | null
  token: string | null
  /** True while the stored session is being revalidated on first load. */
  initializing: boolean
  profileLoading: boolean
  profileError: ApiErrorShape | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  /**
   * Completes a session from an externally-obtained token (the OAuth redirect).
   * Token is handed in already validated by the caller's URL parsing.
   */
  adoptSession: (token: string, user: SessionUser) => void
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  /** Called by the profile page after a successful PUT. */
  applyProfileUpdate: (profile: UserProfile) => void
  /** Set when the server rejects our token mid-session. */
  sessionExpired: boolean
  clearSessionExpired: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => sessionStore.getUser())
  const [token, setToken] = useState<string | null>(() => sessionStore.getToken())
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [initializing, setInitializing] = useState<boolean>(
    () => Boolean(sessionStore.getToken()),
  )
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<ApiErrorShape | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Guards against double-fetching the profile in StrictMode.
  const profileFetchedFor = useRef<string | null>(null)

  const logout = useCallback(() => {
    sessionStore.clear()
    setUser(null)
    setToken(null)
    setProfile(null)
    setProfileError(null)
    profileFetchedFor.current = null
  }, [])

  /**
   * The axios interceptor cannot navigate, so it signals here. The app shell
   * reacts by routing to /login with a "session expired" notice.
   */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSessionExpired(true)
      logout()
    })
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const loadProfile = useCallback(async () => {
    setProfileLoading(true)
    setProfileError(null)
    try {
      const me = await usersApi.getMe()
      setProfile(me)
      // Keep the locally cached identity in sync with the server's copy.
      const next: SessionUser = { id: me.id, fullName: me.fullName, email: me.email }
      setUser(next)
      const currentToken = sessionStore.getToken()
      if (currentToken) sessionStore.save(currentToken, next)
    } catch (error) {
      setProfileError(toApiError(error))
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // On first mount with a token, confirm it is still valid against the API.
  useEffect(() => {
    let cancelled = false
    const storedToken = sessionStore.getToken()

    if (!storedToken) {
      setInitializing(false)
      return
    }

    if (profileFetchedFor.current === storedToken) {
      setInitializing(false)
      return
    }
    profileFetchedFor.current = storedToken

    void (async () => {
      try {
        const me = await usersApi.getMe()
        if (cancelled) return
        setProfile(me)
        setUser({ id: me.id, fullName: me.fullName, email: me.email })
      } catch (error) {
        if (cancelled) return
        const apiError = toApiError(error)
        // 401 is handled by the interceptor (session cleared + notice shown).
        // Anything else is a transient failure — keep the session, surface it.
        if (apiError.status !== 401) setProfileError(apiError)
        if (apiError.status === 401) logout()
      } finally {
        if (!cancelled) setInitializing(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    const sessionUser: SessionUser = {
      id: response.id,
      fullName: response.fullName,
      email: response.email,
    }
    sessionStore.save(response.token, sessionUser)
    setToken(response.token)
    setUser(sessionUser)
    setSessionExpired(false)
    profileFetchedFor.current = response.token
  }, [])

  /**
   * Registration returns no token (RegisterResponseDto has no Token property),
   * so this deliberately does not sign the user in. The caller routes to /login.
   */
  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      await authApi.register({ fullName, email, password })
    },
    [],
  )

  const adoptSession = useCallback((nextToken: string, nextUser: SessionUser) => {
    sessionStore.save(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
    setSessionExpired(false)
    profileFetchedFor.current = nextToken
  }, [])

  const applyProfileUpdate = useCallback((next: UserProfile) => {
    setProfile(next)
    const sessionUser: SessionUser = {
      id: next.id,
      fullName: next.fullName,
      email: next.email,
    }
    setUser(sessionUser)
    const currentToken = sessionStore.getToken()
    if (currentToken) sessionStore.save(currentToken, sessionUser)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      token,
      initializing,
      profileLoading,
      profileError,
      isAuthenticated: Boolean(token),
      login,
      register,
      adoptSession,
      logout,
      refreshProfile: loadProfile,
      applyProfileUpdate,
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false),
    }),
    [
      user,
      profile,
      token,
      initializing,
      profileLoading,
      profileError,
      login,
      register,
      adoptSession,
      logout,
      loadProfile,
      applyProfileUpdate,
      sessionExpired,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
