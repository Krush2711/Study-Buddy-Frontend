import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label: string
  className?: string
  /** Binds "/" to focus this field when nothing else has focus. */
  shortcut?: boolean
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label,
  className,
  shortcut = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!shortcut) return
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (event.key === '/' && !typing) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcut])

  return (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="input !pl-9 !pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-3 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : shortcut ? (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-[var(--line-strong)] px-1.5 py-0.5 font-mono text-[0.6875rem] text-ink-3 sm:block"
        >
          /
        </kbd>
      ) : null}
    </div>
  )
}

/** Row wrapper for search + filters above a table or grid. */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  )
}

/* ------------------------------ CopyButton ----------------------------- */

export function CopyButton({
  text,
  label = 'Copy',
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Clipboard is unavailable on insecure origins; fail quietly rather than
      // claiming success.
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.8125rem] font-medium text-ink-2 transition-colors hover:bg-[var(--surface-2)] hover:text-ink',
        className,
      )}
    >
      {copied ? (
        <>
          <Check size={14} className="text-[var(--success)]" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy size={14} aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  )
}
