/**
 * Field-level validators shared by the auth, knowledge and profile forms.
 * Message wording is user-facing — keep it plain and specific.
 */

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return 'Email is required.'
  // Deliberately loose: the server is the authority on deliverability.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return 'Enter a valid email address.'
  }
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required.'
  if (value.length < 6) return 'Use at least 6 characters.'
  return undefined
}

export function validateFullName(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return 'Full name is required.'
  if (trimmed.length < 2) return 'That name looks too short.'
  if (trimmed.length > 120) return 'Keep the name under 120 characters.'
  return undefined
}

export function validateRequired(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`
}

/** Strips undefined entries so forms can treat `{}` as valid. */
export function compactErrors<T extends Record<string, string | undefined>>(
  errors: T,
): { [K in keyof T]?: string } {
  const result: Partial<T> = {}
  ;(Object.keys(errors) as Array<keyof T>).forEach((key) => {
    if (errors[key]) result[key] = errors[key]
  })
  return result as { [K in keyof T]?: string }
}
