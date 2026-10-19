import { cn } from '../../utils/cn'
import { initials } from '../../utils/format'

/**
 * Avatar with a deterministic initials fallback. The tint is derived from a hash
 * of the name so the same person is always the same color, without shipping
 * photos for demo data.
 */
const TINTS = [
  { bg: '#EBD8C6', fg: '#7C4A2C' },
  { bg: '#D6E5DC', fg: '#2F6B4A' },
  { bg: '#D9DEEC', fg: '#3A4C7A' },
  { bg: '#EFDCDC', fg: '#8B3A32' },
  { bg: '#E4DEEA', fg: '#5B4276' },
  { bg: '#E8E0CC', fg: '#6E5A26' },
]

function tintFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973
  }
  return TINTS[hash % TINTS.length]
}

export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string | null | undefined
  src?: string | null
  size?: number
  className?: string
}) {
  const label = name?.trim() || 'Unknown user'
  const tint = tintFor(label)

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className={cn('shrink-0 rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      aria-label={label}
      role="img"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: tint.bg,
        color: tint.fg,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        letterSpacing: '0.01em',
      }}
    >
      {initials(label)}
    </span>
  )
}
