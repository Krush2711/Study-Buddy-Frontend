import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Form fields follow one accessibility pattern:
 *  - label is always associated via htmlFor/id
 *  - errors are referenced with aria-describedby and flagged with aria-invalid
 *  - the message appears inline, after the field, not in a toast
 */

function FieldMessage({
  id,
  children,
  tone = 'error',
}: {
  id: string
  children: ReactNode
  tone?: 'error' | 'hint'
}) {
  if (tone === 'hint') {
    return (
      <p id={id} className="mt-1.5 text-[0.8125rem] text-ink-3">
        {children}
      </p>
    )
  }
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] text-[var(--danger)]"
    >
      <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

interface FieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => ReactNode
}

/** Render-prop wrapper so any control can be slotted in with correct ARIA. */
export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-msg`

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? (
          <span className="ml-0.5 text-[var(--danger)]" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error || hint ? messageId : undefined,
      })}
      {error ? (
        <FieldMessage id={messageId}>{error}</FieldMessage>
      ) : hint ? (
        <FieldMessage id={messageId} tone="hint">
          {hint}
        </FieldMessage>
      ) : null}
    </div>
  )
}

/* ------------------------------- Inputs -------------------------------- */

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  hint?: string
  leading?: ReactNode
  trailing?: ReactNode
  containerClassName?: string
}

export function TextField({
  label,
  error,
  hint,
  leading,
  trailing,
  className,
  containerClassName,
  required,
  ...rest
}: TextFieldProps) {
  return (
    <div className={containerClassName}>
      <Field label={label} error={error} hint={hint} required={required}>
        {(aria) => (
          <div className="relative">
            {leading ? (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">
                {leading}
              </span>
            ) : null}
            <input
              {...rest}
              {...aria}
              required={required}
              className={cn(
  'input',
  Boolean(leading) && '!pl-9',
  Boolean(trailing) && '!pr-10',
  className
)}
            />
            {trailing ? (
              <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
            ) : null}
          </div>
        )}
      </Field>
    </div>
  )
}

interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  error?: string
  hint?: string
}

export function TextAreaField({
  label,
  error,
  hint,
  rows = 4,
  required,
  className,
  ...rest
}: TextAreaFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {(aria) => (
        <textarea
          {...rest}
          {...aria}
          rows={rows}
          required={required}
          className={cn('input resize-y leading-relaxed', className)}
        />
      )}
    </Field>
  )
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  error?: string
  hint?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export function SelectField({
  label,
  error,
  hint,
  options,
  placeholder,
  required,
  className,
  ...rest
}: SelectFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {(aria) => (
        <select
          {...rest}
          {...aria}
          required={required}
          className={cn('input appearance-none bg-no-repeat pr-9', className)}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239b8878' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundPosition: 'right 0.75rem center',
          }}
        >
          {placeholder ? (
            <option value="">{placeholder}</option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

/* ------------------------------- Toggle -------------------------------- */

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

/** Switch commits on release but shows the thumb moving the whole way. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: SwitchProps) {
  const id = useId()
  const descriptionId = description ? `${id}-desc` : undefined

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[0.9375rem] font-medium text-ink">
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="mt-0.5 text-[0.8125rem] text-ink-2">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-[1.75rem] w-[3rem] shrink-0 rounded-full transition-colors duration-200',
          'motion-reduce:transition-none',
          checked ? 'bg-brand' : 'bg-[var(--surface-3)]',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-[1.5rem] w-[1.5rem] rounded-full bg-white shadow-sm',
            'transition-transform duration-200 ease-[var(--ease-decelerate)] motion-reduce:transition-none',
            checked ? 'translate-x-[1.25rem]' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}
