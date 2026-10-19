import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/ui/Logo'

/** Full-screen brand loader shown while the stored session is revalidated. */
function SessionGate() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas">
      <Logo size={34} />
      <div className="flex items-center gap-2 text-[0.875rem] text-ink-2">
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        Restoring your session…
      </div>
    </div>
  )
}

/**
 * Requires a token. Unauthenticated visitors are sent to /login with the path
 * they wanted, so they land back where they intended after signing in.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <SessionGate />

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }

  return <>{children}</>
}

/**
 * Keeps signed-in users out of /login and /signup, but only once we know the
 * session is valid — otherwise the redirect would flash on every page load.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <SessionGate />

  if (isAuthenticated) {
    const params = new URLSearchParams(location.search)
    const redirect = params.get('redirect')
    // Only accept in-app paths — never a full URL, which would be an open redirect.
    const safe = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
    return <Navigate to={safe ? redirect : '/app'} replace />
  }

  return <>{children}</>
}

/** Safe post-login destination, shared by the login form and the guard. */
export function safeRedirect(target: string | null | undefined, fallback = '/app'): string {
  if (!target) return fallback
  if (!target.startsWith('/') || target.startsWith('//')) return fallback
  return target
}
