import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '../../context/ThemeContext'
import { cn } from '../../utils/cn'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

const CYCLE: ThemePreference[] = ['light', 'dark', 'system']

const LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

/**
 * Cycles light → dark → system. The icon reflects the *preference*, not the
 * resolved theme, so "system" is a state the user can see and return to.
 * A full three-way control lives on the Settings page.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme()
  const reducedMotion = usePrefersReducedMotion()

  const next = CYCLE[(CYCLE.indexOf(preference) + 1) % CYCLE.length]
  const Icon = preference === 'light' ? Sun : preference === 'dark' ? Moon : Monitor

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={`Theme: ${LABELS[preference]}. Switch to ${LABELS[next]}.`}
      title={`Theme: ${LABELS[preference]}`}
      className={cn(
        'btn btn-ghost !min-h-0 !rounded-[0.625rem] !p-0 text-ink-2 hover:text-ink',
        className,
      )}
      style={{ width: 36, height: 36 }}
    >
      <Icon
        size={17}
        aria-hidden="true"
        className={cn(!reducedMotion && 'transition-transform duration-300 ease-[var(--ease-decelerate)]')}
      />
    </button>
  )
}

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/** Full segmented control for the Settings page. */
export function ThemeSegmented() {
  const { preference, setPreference } = useTheme()
  const activeIndex = OPTIONS.findIndex((option) => option.value === preference)

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="relative inline-grid grid-cols-3 rounded-[0.75rem] bg-[var(--surface-2)] p-1"
    >
      {/* Sliding thumb: one transform, so the motion stays on the compositor */}
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-[0.5rem] bg-surface shadow-[var(--shadow-thumb)] transition-transform duration-200 ease-[var(--ease-decelerate)] motion-reduce:transition-none"
        style={{
          width: 'calc((100% - 0.5rem) / 3)',
          transform: `translateX(${Math.max(0, activeIndex) * 100}%)`,
        }}
      />
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const selected = option.value === preference
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(option.value)}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 rounded-[0.5rem] px-3 py-1.5 text-[0.8125rem] font-medium',
              'transition-colors duration-150',
              selected ? 'text-ink' : 'text-ink-2 hover:text-ink',
            )}
          >
            <Icon size={14} aria-hidden="true" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
