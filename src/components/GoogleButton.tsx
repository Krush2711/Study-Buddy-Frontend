import { useState } from 'react'
import { Info } from 'lucide-react'
import { config } from '../services/api/client'
import { Button } from './ui/Button'
import { Modal } from './ui/Overlay'
/**
 * Google sign-in.
 *
 * The backend flow is real: GET /api/login-google challenges the Google scheme,
 * and AuthController.GoogleResponse exchanges the cookie for a LoginResponseDto.
 * What is missing is the last hop — GoogleResponse returns that JSON directly in
 * the browser instead of redirecting back to this app with the token, so the
 * frontend cannot establish a session from it.
 *
 * Rather than hide the button or fake a successful login, the button starts the
 * real flow and warns beforehand what the user will see. The AuthCallbackPage
 * handles the app-side half the moment the backend adds the redirect.
 */
const OAUTH_FLOW_INCOMPLETE = true

export function GoogleButton({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="secondary"
        block
        disabled={disabled}
        onClick={() => {
          if (OAUTH_FLOW_INCOMPLETE) {
            setOpen(true)
            return
          }
          window.location.assign(config.googleAuthUrl)
        }}
        iconLeft={
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
        }
      >
        Continue with Google
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Google sign-in is not finished on the backend"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Use email instead
            </Button>
            <Button
              variant="primary"
              onClick={() => window.location.assign(config.googleAuthUrl)}
            >
              Continue to Google anyway
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[0.875rem] leading-relaxed text-ink-2">
          <p>
            The Google handshake itself works, but the API returns the login result as
            raw JSON in the browser tab instead of redirecting back to StudyBuddy with a
            token. That means the session cannot be completed from here yet.
          </p>
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <p className="text-micro text-ink-3">Needed on the server</p>
            <code className="mt-1 block break-words font-mono text-[0.8125rem] text-ink-2">
              AuthController.GoogleResponse → redirect to
              /auth/callback#token=…&amp;id=…&amp;fullName=…&amp;email=…
            </code>
          </div>
          <p className="flex items-start gap-2 text-[0.8125rem] text-ink-3">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Email and password sign-in works today. The app route that consumes the
            token is already implemented, so Google sign-in will start working as soon
            as the server redirects.
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
