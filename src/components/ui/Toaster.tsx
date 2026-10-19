import { createPortal } from 'react-dom'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToast, type Toast } from '../../context/ToastContext'
import { cn } from '../../utils/cn'

const TONE_ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const

const TONE_CLASS = {
  success: 'text-[var(--success)]',
  error: 'text-[var(--danger)]',
  info: 'text-[var(--info)]',
} as const

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = TONE_ICON[toast.tone]

  return (
    <li
      className="glass-float pointer-events-auto flex w-full items-start gap-3 rounded-[0.875rem] px-3.5 py-3 transition-[opacity,translate,scale] duration-200 ease-[var(--ease-decelerate)] motion-reduce:transition-opacity starting:translate-y-2 starting:opacity-0"
      role={toast.tone === 'error' ? 'alert' : 'status'}
    >
      <Icon
        size={18}
        className={cn('mt-0.5 shrink-0', TONE_CLASS[toast.tone])}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.875rem] font-medium leading-snug text-ink">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-2">
            {toast.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 rounded-md p-1 text-ink-3 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </li>
  )
}

/**
 * Announcements stack bottom-right on desktop and bottom-center on mobile,
 * above the safe area. Live region so screen readers get them without focus.
 */
export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end sm:px-0 sm:pb-0"
    >
      <ul className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </ul>
    </div>,
    document.body,
  )
}
