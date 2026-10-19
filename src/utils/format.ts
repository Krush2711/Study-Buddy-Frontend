/**
 * Date and duration formatting.
 *
 * Server timestamps arrive as ISO 8601 UTC from ASP.NET / mongo. Everything the
 * UI shows is rendered in the user's local time zone via Intl.
 */

const dateFmt = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const shortDateFmt = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
})

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

const relativeFmt = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

function parse(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = parse(value)
  return date ? dateFmt.format(date) : '—'
}

export function formatShortDate(value: string | Date | null | undefined): string {
  const date = parse(value)
  return date ? shortDateFmt.format(date) : '—'
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = parse(value)
  return date ? `${dateFmt.format(date)} · ${timeFmt.format(date)}` : '—'
}

/** "3 days ago", "last month" — for activity feeds and note timestamps. */
export function formatRelative(value: string | Date | null | undefined): string {
  const date = parse(value)
  if (!date) return '—'

  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60_000)

  if (Math.abs(diffMinutes) < 60) return relativeFmt.format(diffMinutes, 'minute')

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return relativeFmt.format(diffHours, 'hour')

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 30) return relativeFmt.format(diffDays, 'day')

  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) return relativeFmt.format(diffMonths, 'month')

  return relativeFmt.format(Math.round(diffMonths / 12), 'year')
}

/** Today's date as yyyy-mm-dd in the user's local zone, for <input type="date">. */
export function todayInputValue(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/** 92 -> "1h 32m"; 45 -> "45m"; 0 -> "0m" */
export function formatMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m'
  const minutes = Math.round(totalMinutes)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}

const PROVIDER_LABELS: Record<string, string> = {
  local: 'Email & password',
  google: 'Google',
  github: 'GitHub',
}

export function formatProvider(provider: string | null | undefined): string {
  if (!provider) return 'Unknown'
  return PROVIDER_LABELS[provider.toLowerCase()] ?? provider
}

/** Turns `coding_session` / `codingSession` into `Coding session`. */
export function humanize(value: string | null | undefined): string {
  if (!value) return '—'
  const spaced = value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

/** Compact byte label for file listings. */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  )
  const value = bytes / Math.pow(1024, exponent)
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

/** Initials for the avatar fallback: "Krushna Patil" -> "KP". */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
