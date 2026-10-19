import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

/* -------------------------------- Card --------------------------------- */

interface CardProps {
  children: ReactNode
  className?: string
  /** Adds hover lift for cards that are themselves clickable. */
  interactive?: boolean
  as?: 'div' | 'section' | 'article' | 'li'
}

export function Card({ children, className, interactive, as = 'div' }: CardProps) {
  const Tag = as
  return (
    <Tag
      className={cn(
        'card',
        interactive && 'card-lift cursor-pointer',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-[1.0625rem] leading-snug text-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-2">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/* -------------------------------- Badge -------------------------------- */

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-[var(--surface-2)] text-ink-2 border-[var(--line)]',
  brand: 'bg-[var(--brand-soft)] text-[var(--brand)] border-transparent',
  success:
    'bg-[var(--success-soft)] text-[var(--success)] border-transparent',
  warning:
    'bg-[var(--warning-soft)] text-[var(--warning)] border-transparent',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger)] border-transparent',
  info: 'bg-[var(--info-soft)] text-[var(--info)] border-transparent',
}

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className,
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.75rem] font-medium leading-5 whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
          style={{ opacity: 0.85 }}
        />
      ) : null}
      {children}
    </span>
  )
}

/* ---------------------------- Page header ------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumb?: ReactNode
}) {
  return (
    <header className="mb-6 sm:mb-8">
      {breadcrumb ? <div className="mb-3">{breadcrumb}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1>{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

/* --------------------------- Section heading --------------------------- */

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[1rem] font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[0.8125rem] text-ink-2">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/* ------------------------------ Key/value ------------------------------ */

export function DataRow({
  label,
  children,
  mono = false,
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-2.5 last:border-0">
      <dt className="shrink-0 text-[0.8125rem] text-ink-3">{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-right text-[0.875rem] text-ink break-words',
          mono && 'font-mono text-[0.8125rem]',
        )}
      >
        {children}
      </dd>
    </div>
  )
}
