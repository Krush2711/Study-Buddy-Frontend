import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react'
import { AuthLayout } from '../layouts/AuthLayout'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { SessionUser } from '../services/api/types'

type State =
  | { phase: 'working' }
  | { phase: 'success'; name: string }
  | { phase: 'failure'; reason: string }

/**
 * Landing route for the Google OAuth round trip.
 *
 * The backend half is not finished (see GoogleButton): GoogleResponse currently
 * returns LoginResponseDto as JSON instead of redirecting here. This page is the
 * contract the frontend expects — when the server redirects to
 *   /auth/callback#token=…&id=…&fullName=…&email=…
 * the session completes with no further changes.
 *
 * A token in a URL fragment is preferred over a query string because fragments
 * are not sent to servers or written to access logs. The value is read once, then
 * the fragment is stripped from the address bar.
 */
export default function AuthCallbackPage() {
  useDocumentTitle('Completing sign-in')

  const { adoptSession, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [state, setState] = useState<State>({ phase: 'working' })
  // Runs once even under StrictMode's double effect invocation.
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const raw = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash
    const params = new URLSearchParams(raw)

    // Scrub the token out of the address bar immediately, success or not.
    if (raw) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      )
    }

    const token = params.get('token')
    const id = params.get('id')
    const email = params.get('email')
    const fullName = params.get('fullName')

    if (!token || !id || !email) {
      setState({
        phase: 'failure',
        reason: isAuthenticated
          ? 'No sign-in details were returned. You are still signed in with your existing session.'
          : 'No sign-in details were returned by the authentication provider.',
      })
      return
    }

    const user: SessionUser = {
      id,
      email,
      fullName: fullName ?? email.split('@')[0],
    }

    adoptSession(token, user)
    setState({ phase: 'success', name: user.fullName })
    toast.success('Signed in with Google', `Welcome, ${user.fullName}.`)

    // Brief confirmation, then continue — long enough to read, short enough
    // not to feel like a stuck screen.
    const timer = window.setTimeout(() => navigate('/app', { replace: true }), 900)
    return () => window.clearTimeout(timer)
  }, [adoptSession, isAuthenticated, navigate, toast])

  return (
    <AuthLayout
      title={
        state.phase === 'failure'
          ? 'Could not finish Google sign-in'
          : 'Signing you in'
      }
      subtitle={
        state.phase === 'failure'
          ? 'Nothing was changed on your account.'
          : 'One moment — we are opening your dashboard.'
      }
      footer={
        <p className="text-[0.8125rem] text-ink-3">
          Prefer email?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Sign in with a password
          </Link>
        </p>
      }
    >
      <div className="card p-5">
        {state.phase === 'working' ? (
          <div className="flex items-center gap-3 text-[0.875rem] text-ink-2">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            Exchanging credentials…
          </div>
        ) : state.phase === 'success' ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-[var(--success)]" aria-hidden="true" />
            <div>
              <p className="text-[0.9375rem] font-medium text-ink">
                Signed in as {state.name}
              </p>
              <p className="text-[0.8125rem] text-ink-2">Redirecting to your dashboard…</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <ShieldAlert
              size={20}
              className="mt-0.5 shrink-0 text-[var(--warning)]"
              aria-hidden="true"
            />
            <div>
              <p className="text-[0.9375rem] font-medium text-ink">Sign-in incomplete</p>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-2">
                {state.reason}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Sign in with email
                  </Button>
                </Link>
                {isAuthenticated ? (
                  <Link to="/app">
                    <Button variant="secondary" size="sm">
                      Go to dashboard
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-[0.75rem] leading-relaxed text-ink-3">
        Google sign-in requires the API to redirect here with the token. Until that
        redirect is added, this screen will report that no details were returned.
      </p>
    </AuthLayout>
  )
}
