import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setAdminApiKey } from '../services/api/client'

/**
 * The admin API key lives here and nowhere else.
 *
 * Deliberate omissions: no localStorage, no sessionStorage, no VITE_ env var, no
 * cookie. Each of those would make the key readable by any script on the page or
 * by anyone who loads the bundle. It is memory-only, so a tab refresh requires
 * re-entry — that is the intended trade-off.
 *
 * This does not make the admin area secure; AdminApiKeyAuthenticationHandler is
 * what authorizes requests. Hiding /admin provides no protection.
 */
interface AdminKeyContextValue {
  key: string | null
  isUnlocked: boolean
  setKey: (key: string) => void
  clear: () => void
}

const AdminKeyContext = createContext<AdminKeyContextValue | null>(null)

export function AdminKeyProvider({ children }: { children: ReactNode }) {
  const [key, setKeyState] = useState<string | null>(null)

  const setKey = useCallback((next: string) => {
    const trimmed = next.trim()
    setAdminApiKey(trimmed || null)
    setKeyState(trimmed || null)
  }, [])

  const clear = useCallback(() => {
    setAdminApiKey(null)
    setKeyState(null)
  }, [])

  const value = useMemo(
    () => ({ key, isUnlocked: Boolean(key), setKey, clear }),
    [key, setKey, clear],
  )

  return <AdminKeyContext.Provider value={value}>{children}</AdminKeyContext.Provider>
}

export function useAdminKey(): AdminKeyContextValue {
  const context = useContext(AdminKeyContext)
  if (!context) throw new Error('useAdminKey must be used inside <AdminKeyProvider>')
  return context
}
