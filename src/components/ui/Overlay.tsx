import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

/* ------------------------------ Presence ------------------------------- */

/**
 * Keeps children mounted for `exitMs` after `open` flips to false so the closing
 * transition can actually run. Opacity-only on the way out, per reduced-motion
 * guidance — an exit that slides while a user is trying to move on feels slow.
 */
export function usePresence(open: boolean, exitMs = 180) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }

    if (!mounted) return

    setClosing(true)
    const timer = window.setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, exitMs)

    return () => window.clearTimeout(timer)
  }, [open, exitMs, mounted])

  return { mounted: mounted || open, closing }
}

/* ------------------------------ Body lock ------------------------------ */

let lockCount = 0
let previousOverflow = ''

function lockScroll(): void {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow
  }
}

/* ----------------------------- Focus trap ------------------------------ */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Move focus into the surface, preferring an autofocused control.
    const initial =
      container.querySelector<HTMLElement>('[data-autofocus]') ??
      container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      container
    // rAF so the browser has laid the element out before focus is applied.
    const raf = requestAnimationFrame(() => initial.focus({ preventScroll: true }))

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)

      if (focusable.length === 0) {
        event.preventDefault()
        container.focus({ preventScroll: true })
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement as HTMLElement | null

      // Wrap at both ends — a loop, never an escape into the page behind.
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [active, containerRef])
}

/** Escape-to-close, wired at the document so it works even after focus moves. */
function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onEscape()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [active, onEscape])
}

/* -------------------------------- Modal -------------------------------- */

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  /** 'sm' for confirmations, 'md' for forms, 'lg' for content. */
  size?: 'sm' | 'md' | 'lg'
  /** Confirmation dialogs should not close on a stray backdrop click. */
  dismissOnBackdrop?: boolean
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissOnBackdrop = true,
}: ModalProps) {
  const { mounted, closing } = usePresence(open)
  const containerRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useFocusTrap(containerRef, mounted && !closing)
  useEscape(mounted && !closing, onClose)

  useEffect(() => {
    if (!mounted) return
    lockScroll()
    return unlockScroll
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="presentation"
    >
      {/* Scrim: dims the page behind and pushes it back */}
      <div
        aria-hidden="true"
        onClick={dismissOnBackdrop ? onClose : undefined}
        className={cn(
          'absolute inset-0 bg-[var(--scrim)] backdrop-blur-[2px] transition-opacity duration-200 starting:opacity-0',
          closing ? 'opacity-0' : 'opacity-100',
        )}
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full glass-float sm:rounded-[1.25rem] rounded-t-[1.25rem] max-h-[92vh] flex flex-col',
          'transition-[opacity,translate,scale] duration-200 ease-[var(--ease-decelerate)]',
          'motion-reduce:transition-[opacity]',
          // Enter by materialising: fades + settles up in scale. Modals are not
          // anchored to a trigger, so the origin stays centred.
          'starting:opacity-0 starting:translate-y-2 starting:scale-[0.98]',
          'sm:starting:translate-y-0 sm:starting:scale-[0.97]',
          closing
            ? 'opacity-0 sm:scale-[0.985] translate-y-2 sm:translate-y-0'
            : 'opacity-100 sm:scale-100 translate-y-0',
          SIZES[size],
        )}
      >
        <header className="flex items-start gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[1.0625rem]">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-[0.875rem] leading-relaxed text-ink-2"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="btn btn-ghost -mr-2 -mt-1 !min-h-9 !px-2 text-ink-3 hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>

        {footer ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-[var(--line)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

/* -------------------------------- Drawer ------------------------------- */

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  /** Width on desktop. Mobile is always full width minus a gutter. */
  width?: 'md' | 'lg'
}

/**
 * Side panel that enters and exits along the same edge (spatial consistency),
 * with no scrim — this is a parallel inspector, not a blocking task.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
}: DrawerProps) {
  const { mounted, closing } = usePresence(open, 220)
  const containerRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useFocusTrap(containerRef, mounted && !closing)
  useEscape(mounted && !closing, onClose)

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end" role="presentation">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-[var(--scrim-soft)] transition-opacity duration-200 starting:opacity-0',
          closing ? 'opacity-0' : 'opacity-100',
        )}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex h-full w-full flex-col bg-surface shadow-[var(--shadow-float)] border-l border-[var(--line)]',
          'transition-[translate] duration-200 ease-[var(--ease-decelerate)] motion-reduce:transition-opacity',
          'starting:translate-x-full',
          width === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
          closing ? 'translate-x-full motion-reduce:opacity-0' : 'translate-x-0',
        )}
      >
        <header className="flex items-start gap-4 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[1.0625rem]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[0.8125rem] text-ink-2">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="btn btn-ghost -mr-2 -mt-1 !min-h-9 !px-2 text-ink-3 hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer ? (
          <footer className="border-t border-[var(--line)] px-5 py-4">{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

/* --------------------------- Confirm dialog ---------------------------- */

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  loading?: boolean
}

/**
 * Reserved for genuinely destructive, irreversible actions. Overusing
 * confirmation trains people to click through it.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      dismissOnBackdrop={false}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary sm:min-w-[6.5rem]"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-autofocus
            className={cn(
              'btn sm:min-w-[6.5rem]',
              tone === 'danger' ? 'btn-danger' : 'btn-primary',
            )}
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-[0.875rem] leading-relaxed text-ink-2">{description}</p>
    </Modal>
  )
}

/** Convenience hook for components that need a confirm-then-act flow. */
export function useConfirm() {
  const [pending, setPending] = useState<null | (() => void | Promise<void>)>(null)

  const request = useCallback((action: () => void | Promise<void>) => {
    setPending(() => action)
  }, [])

  const cancel = useCallback(() => setPending(null), [])

  const confirm = useCallback(async () => {
    const action = pending
    setPending(null)
    if (action) await action()
  }, [pending])

  return { isOpen: Boolean(pending), request, cancel, confirm }
}
