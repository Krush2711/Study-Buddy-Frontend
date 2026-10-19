import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  /** Stretch to the container width (forms, mobile actions). */
  block?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

const SIZES: Record<Size, string> = {
  sm: '!min-h-8 !px-3 !text-[0.8125rem] !rounded-[0.625rem]',
  md: '',
  lg: '!min-h-11 !px-5 !text-[1rem]',
}

/**
 * Compress-on-press lives in CSS (`.btn:active`), so feedback fires on
 * pointer-down instead of waiting for the click to resolve.
 *
 * The click handler is only ignored while loading or disabled — a disabled
 * button still shows its pressed state, which keeps the control feeling alive.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    iconLeft,
    iconRight,
    block = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'btn',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  )
})

/* ------------------------------ Icon button ---------------------------- */

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls need an accessible name. */
  label: string
  children: ReactNode
  variant?: Variant
  size?: number
}

export function IconButton({
  label,
  children,
  variant = 'ghost',
  size = 36,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'btn !min-h-0 !p-0 !rounded-[0.625rem]',
        VARIANTS[variant],
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children}
    </button>
  )
}
