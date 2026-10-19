import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '../../utils/cn'
import { CountUp } from './CountUp'

interface StatCardProps {
  label: string
  value: number
  /** Unit appended to the number, e.g. "h" or "". */
  suffix?: string
  precision?: number
  icon: LucideIcon
  /** Small contextual line under the number. */
  footNote?: string
  /** Rendered as a labelled chip when the metric has no data source yet. */
  unavailable?: boolean
  delta?: { value: number; direction: 'up' | 'down' | 'flat' }
  className?: string
}

export function StatCard({
  label,
  value,
  suffix = '',
  precision = 0,
  icon: Icon,
  footNote,
  unavailable = false,
  delta,
  className,
}: StatCardProps) {
  const DeltaIcon =
    delta?.direction === 'up' ? ArrowUpRight : delta?.direction === 'down' ? ArrowDownRight : Minus

  return (
    <div className={cn('card p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.8125rem] font-medium text-ink-2">{label}</p>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.625rem] bg-[var(--brand-soft)] text-[var(--brand)]"
          aria-hidden="true"
        >
          <Icon size={16} />
        </span>
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5">
        {unavailable ? (
          <span className="text-[1.75rem] font-semibold leading-none text-ink-3">—</span>
        ) : (
          <CountUp
            value={value}
            suffix={suffix}
            precision={precision}
            className="text-[1.75rem] font-semibold leading-none text-ink"
          />
        )}

        {delta ? (
          <span
            className={cn(
              'numeric inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.75rem] font-medium',
              delta.direction === 'up' && 'bg-[var(--success-soft)] text-[var(--success)]',
              delta.direction === 'down' && 'bg-[var(--danger-soft)] text-[var(--danger)]',
              delta.direction === 'flat' && 'bg-[var(--surface-2)] text-ink-2',
            )}
          >
            <DeltaIcon size={12} aria-hidden="true" />
            {Math.abs(delta.value)}%
          </span>
        ) : null}
      </div>

      {footNote ? (
        <p className="mt-2 text-[0.8125rem] leading-snug text-ink-3">{footNote}</p>
      ) : null}
    </div>
  )
}
