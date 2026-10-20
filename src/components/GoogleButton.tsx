import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Loader2, X } from 'lucide-react'
import { config } from '../services/api/client'
import { authApi } from '../services/api/auth'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from './ui/Button'
import { Modal } from './ui/Overlay'

/**
 * Google sign-in.
 *
 * Flow:
 *  1. Open GET /api/login-google in a popup and let Google run its challenge.
 *  2. Google redirects the popup to /api/auth/google-response, which sets an
 *     auth cookie and returns the login payload as JSON.
 *  3. The opener polls the same endpoint with `credentials: 'include'` until the
 *     cookie exists, then adopts the returned token and closes the popup.
 *
 * The exchange is cross-origin, so the hosted API must allow this origin with
 * Access-Control-Allow-Credentials. If it does not, we say so instead of
 * pretending sign-in is unavailable for another reason.
 */
const POLL_INTERVAL_MS = 1200
const POLL_TIMEOUT_MS = 3 * 60 * 1000

export function GoogleButton({ disabled }: { disabled?: boolean }) {
  const { adoptSession } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [pending, setPending] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const cancelledRef = useRef(false)

  const stop = useCallback(() => {
    cancelledRef.current = true
    setPending(false)
    popupRef.current?.close()
    popupRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      popupRef.current?.close()
    }
  }, [])

  const start = useCallback(() => {
    cancelledRef.current = false
    setPending(true)
    setBlocked(false)

    const popup = window.open(
      config.googleAuthUrl,
      'studybuddy-google',
      'width=520,height=660,menubar=no,toolbar=no',
    )

    if (!popup) {
      setPending(false)
      setBlocked(true)
      return
    }
    popupRef.current = popup

    const startedAt = Date.now()
    /** When the user closed the popup before a session appeared. */
    let closedAt: number | null = null

    const poll = async () => {
      if (cancelledRef.current) return

      try {
        const session = await authApi.exchangeGoogle()
        if (cancelledRef.current) return
        adoptSession(
          session.token,
          {
            id: session.id,
            fullName: session.fullName,
            email: session.email,
          },
          session.refreshToken,
        )
        toast.success('Signed in with Google', `Welcome, ${session.fullName}.`)
        popup.close()
        popupRef.current = null
        setPending(false)
        navigate('/app', { replace: true })
        return
      } catch (error) {
        if (cancelledRef.current) return

        const status = (error as { status?: number }).status
        const isNotReady = status === 400 || status === 401 || status === 403

        if (!isNotReady) {
          // A network/CORS failure will not fix itself by polling.
          setPending(false)
          popup.close()
          popupRef.current = null
          toast.error(
            'Google sign-in could not complete',
            error instanceof Error ? error.message : 'The exchange request failed.',
          )
          return
        }

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setPending(false)
          popup.close()
          popupRef.current = null
          toast.error(
            'Google sign-in timed out',
            'Finish signing in with Google, then try again.',
          )
          return
        }

        // A closed popup still gets a short grace period for the final poll,
        // then we stop instead of polling a dead flow for minutes.
        if (popup.closed) {
          closedAt ??= Date.now()
          if (Date.now() - closedAt > 4000) {
            setPending(false)
            popupRef.current = null
            toast.error(
              'Google sign-in was not completed',
              'The Google window closed before a session was created. Try again.',
            )
            return
          }
        }

        window.setTimeout(() => void poll(), POLL_INTERVAL_MS)
      }
    }

    // First attempt waits until the popup has had time to reach Google.
    window.setTimeout(() => void poll(), POLL_INTERVAL_MS)
  }, [adoptSession, navigate, toast])

  return (
    <>
      <Button
        variant="secondary"
        block
        disabled={disabled || pending}
        onClick={start}
        iconLeft={
          pending ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.2h6.5c-.1 1.1-.8 2.7-2.3 3.8l3.6 2.8c2.1-1.9 3.7-4.8 3.7-8.6Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 5.9-1.1 7.8-2.9l-3.6-2.8c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.9-5l-3.7 2.9C3.3 21.3 7.3 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.1 14.5c-.2-.7-.4-1.5-.4-2.5s.1-1.7.4-2.5L1.4 6.6C.5 8.2 0 10 0 12s.5 3.8 1.4 5.4l3.7-2.9Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.8c1.8 0 3 .8 3.7 1.4l2.7-2.6C16.9 1.8 14.2.7 12 .7 7.3.7 3.3 3.4 1.4 6.6l3.7 2.9c1-2.9 3.7-4.7 6.9-4.7Z"
              />
            </svg>
          )
        }
      >
        {pending ? 'Waiting for Google…' : 'Continue with Google'}
      </Button>

      {pending ? (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-[0.625rem] bg-[var(--surface-2)] px-3 py-2.5 text-[0.8125rem] leading-relaxed text-ink-2"
        >
          <Loader2
            size={14}
            className="mt-0.5 shrink-0 animate-spin text-brand"
            aria-hidden="true"
          />
          <span>
            Finish signing in in the Google window. If it did not open, allow
            pop-ups for this site and try again.
          </span>
          <button
            type="button"
            onClick={stop}
            aria-label="Cancel Google sign-in"
            className="ml-auto rounded-md p-1 text-ink-3 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <Modal
        open={blocked}
        onClose={() => setBlocked(false)}
        title="The Google window was blocked"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBlocked(false)}>
              Use email instead
            </Button>
            <Button variant="primary" onClick={start}>
              Try again
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[0.875rem] leading-relaxed text-ink-2">
          <p>
            Your browser blocked the sign-in window, so the session could not be
            completed. Allow pop-ups for StudyBuddy, then try again.
          </p>
          <p className="flex items-start gap-2 text-[0.8125rem] text-ink-3">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            You can also open{' '}
            <a
              href={config.googleAuthUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand hover:underline"
            >
              the Google sign-in page
            </a>{' '}
            in a new tab, then press “Try again” once you have finished there.
          </p>
        </div>
      </Modal>
    </>
  )
}

/** Divider used above/below the OAuth option. */
export function OrDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-[var(--line)]" />
      <span className="text-[0.75rem] uppercase tracking-[0.08em] text-ink-3">{label}</span>
      <span className="h-px flex-1 bg-[var(--line)]" />
    </div>
  )
}
