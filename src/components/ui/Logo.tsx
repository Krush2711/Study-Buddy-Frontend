import { cn } from '../../utils/cn'

/**
 * Wordmark + glyph. The mark is a small open book with a clay cover, carried over
 * from the demo's logo and simplified so it holds up at 16px.
 */
export function Logo({
  size = 28,
  showWordmark = true,
  tone = 'default',
  className,
}: {
  size?: number
  showWordmark?: boolean
  /** 'inverse' for the dark sidebar, where the wordmark must read light. */
  tone?: 'default' | 'inverse'
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="64" height="64" rx="15" fill="var(--brand)" />
        <path
          d="M18 40V22.5c0-1.4 1.5-2.3 2.8-1.7 4.2 1.9 8.2 3 11.2 3.2 3-.2 7-1.3 11.2-3.2 1.3-.6 2.8.3 2.8 1.7V40c0 1.2-.8 2.2-1.9 2.6-4 1.4-8 2.3-11.6 2.6h-1c-3.6-.3-7.6-1.2-11.6-2.6C18.8 42.2 18 41.2 18 40Z"
          fill="var(--brand-ink)"
        />
        <path
          d="M32 24v21"
          stroke="var(--brand)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark ? (
        <span
          className={cn(
            'text-[1.0625rem] font-semibold tracking-[-0.012em]',
            tone === 'inverse' ? 'text-[var(--sidebar-ink)]' : 'text-ink',
          )}
        >
          StudyBuddy
        </span>
      ) : null}
    </span>
  )
}
