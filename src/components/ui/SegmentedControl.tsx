import { useId, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface SegmentedControlProps<T extends string> {
  options: Array<SegmentOption<T>>
  value: T
  onChange: (value: T) => void
  /** Visible group label; also used as the accessible name. */
  label: string
  className?: string
}

/**
 * Filter tabs rendered as a radio group with roving tabindex: one stop in the tab
 * order, arrow keys move between options, matching native segmented behaviour.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const id = useId()
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  const focusAt = (index: number) => {
    const next = options[(index + options.length) % options.length]
    onChange(next.value)
    document.getElementById(`${id}-${next.value}`)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'relative inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[0.75rem] bg-[var(--surface-2)] p-1',
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault()
          focusAt(activeIndex + 1)
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault()
          focusAt(activeIndex - 1)
        } else if (event.key === 'Home') {
          event.preventDefault()
          focusAt(0)
        } else if (event.key === 'End') {
          event.preventDefault()
          focusAt(options.length - 1)
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            id={`${id}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-[0.5rem] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-150',
              selected
                ? 'bg-surface text-ink shadow-[var(--shadow-thumb)]'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span
                className={cn(
                  'numeric rounded-full px-1.5 text-[0.6875rem] leading-4',
                  selected ? 'bg-[var(--surface-2)] text-ink-2' : 'text-ink-3',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/* --------------------------- Titled section ---------------------------- */

export function TitledBlock({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}
