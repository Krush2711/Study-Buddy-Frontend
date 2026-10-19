import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Inbox,
  Loader2,
  RefreshCw,
  PlugZap,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import type { ApiErrorShape } from '../../services/api/types'
import { Button } from './Button'

/* ------------------------------ Skeletons ------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} aria-hidden="true" />
}

/** Card-shaped skeleton used while a page's data loads for the first time. */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-32" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-3"
            // Ragged line lengths read as text, not as a bar chart
            {...{ style: { width: `${88 - index * 12}%` } }}
          />
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)]">
      <div className="border-b border-[var(--line)] bg-surface-2 px-4 py-3">
        <Skeleton className="h-3 w-full max-w-[12rem]" />
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 border-b border-[var(--line)] px-4 py-4 last:border-0"
        >
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className="h-3.5"
              {...{
                style: {
                  width: `${[38, 22, 18, 12][columnIndex % 4]}%`,
                },
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function InlineSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[0.875rem] text-ink-2">
      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      {label}
    </span>
  )
}

/** Determinate bar for uploads and other measurable progress. */
export function ProgressBar({
  value,
  indeterminate = false,
  label,
}: {
  value: number
  indeterminate?: boolean
  label?: string
}) {
  return (
    <div>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-[0.8125rem] text-ink-2">
          <span>{label}</span>
          {!indeterminate ? <span className="numeric">{Math.round(value)}%</span> : null}
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : Math.round(value)}
        aria-valuetext={indeterminate ? 'Processing' : `${Math.round(value)}%`}
      >
        <div
          className={cn(
            'h-full rounded-full bg-brand transition-[width] duration-300 ease-out',
            indeterminate && 'w-1/3 animate-pulse',
          )}
          {...{ style: indeterminate ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` } }}
        />
      </div>
    </div>
  )
}

/* ------------------------------ Empty state ---------------------------- */

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] bg-surface/50 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
      )}
    >
      <div
        className="mb-4 flex items-center justify-center rounded-2xl bg-[var(--surface-2)] text-ink-3"
        style={{ width: compact ? 40 : 48, height: compact ? 40 : 48 }}
        aria-hidden="true"
      >
        {icon ?? <Inbox size={compact ? 18 : 22} />}
      </div>
      <h3 className="text-[0.9375rem] font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[0.875rem] leading-relaxed text-ink-2">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/* ------------------------------ Error state ---------------------------- */

interface ErrorStateProps {
  error: ApiErrorShape
  onRetry?: () => void
  compact?: boolean
  /** Shown above the generic message, e.g. "Could not load documents". */
  title?: string
}

export function ErrorState({ error, onRetry, compact = false, title }: ErrorStateProps) {
  const isNetwork = error.status === 0
  const isAuth = error.status === 401 || error.status === 403

  return (
    <div
      role="alert"
      className={cn(
        'rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--danger)_26%,transparent)] bg-[var(--danger-soft)]',
        compact ? 'p-4' : 'p-5',
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={18}
          className="mt-0.5 shrink-0 text-[var(--danger)]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.875rem] font-semibold text-ink">
            {title ??
              (isNetwork
                ? 'Cannot reach the API'
                : isAuth
                  ? 'Not authorized'
                  : 'Something went wrong')}
          </p>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-2">{error.message}</p>
          {isNetwork ? (
            <p className="mt-2 text-[0.8125rem] text-ink-3">
              Check that the ASP.NET API is running and that the proxy target in
              vite.config.ts matches its port.
            </p>
          ) : null}
          {onRetry ? (
            <div className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={onRetry}
                iconLeft={<RefreshCw size={14} />}
              >
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* --------------------- Integration placeholder ------------------------- */

interface IntegrationPlaceholderProps {
  /** Feature name, e.g. "Study sessions". */
  feature: string
  /** The endpoint(s) the frontend is waiting for. */
  needed: string
  /** What the backend gap means for the user, in plain language. */
  detail: string
  /** Optional: what still works locally. */
  children?: ReactNode
}

/**
 * Used everywhere a requested capability has no backend support. It states the
 * gap plainly and names the missing route — it never pretends the action worked.
 */
export function IntegrationPlaceholder({
  feature,
  needed,
  detail,
  children,
}: IntegrationPlaceholderProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--warning)_30%,transparent)] bg-[var(--warning-soft)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <PlugZap
          size={18}
          className="mt-0.5 shrink-0 text-[var(--warning)]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.875rem] font-semibold text-ink">
            {feature} — backend integration pending
          </p>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-2">{detail}</p>
          <div className="mt-2.5 rounded-lg bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] px-3 py-2">
            <p className="text-micro text-ink-3">Required endpoint</p>
            <code className="mt-1 block break-words font-mono text-[0.8125rem] text-ink-2">
              {needed}
            </code>
          </div>
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
    </div>
  )
}

/** Small inline note for a value that is illustrative rather than measured. */
export function UnavailableValue({
  children = 'Not tracked',
}: {
  children?: ReactNode
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-[0.75rem] text-ink-3"
      title="This value needs a backend endpoint that does not exist yet"
    >
      {children}
    </span>
  )
}
