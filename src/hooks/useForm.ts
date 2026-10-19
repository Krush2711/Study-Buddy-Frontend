import { useCallback, useMemo, useState } from 'react'

export type Validator<T> = (values: T) => Partial<Record<keyof T, string>>

interface UseFormOptions<T> {
  initialValues: T
  validate?: Validator<T>
}

/**
 * Small form helper: controlled values, on-blur validation, and a submit gate.
 * Validation is intentionally inline (per field) rather than submit-only, so a
 * user sees the problem as soon as they leave the field.
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const errors = useMemo<Partial<Record<keyof T, string>>>(() => {
    return validate ? validate(values) : {}
  }, [validate, values])

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
  }, [])

  const setFieldTouched = useCallback((key: keyof T) => {
    setTouched((current) => ({ ...current, [key]: true }))
  }, [])

  /** Error text should only appear once the field was touched or submit tried. */
  const errorFor = useCallback(
    (key: keyof T): string | undefined => {
      if (!submitAttempted && !touched[key]) return undefined
      return errors[key]
    },
    [errors, submitAttempted, touched],
  )

  const isValid = Object.keys(errors).length === 0

  const handleSubmit = useCallback(
    (onValid: (values: T) => void | Promise<void>) =>
      async (event?: React.FormEvent) => {
        event?.preventDefault()
        setSubmitAttempted(true)
        if (!isValid) return
        await onValid(values)
      },
    [isValid, values],
  )

  const reset = useCallback(
    (next?: T) => {
      setValues(next ?? initialValues)
      setTouched({})
      setSubmitAttempted(false)
    },
    [initialValues],
  )

  return {
    values,
    setValue,
    setValues,
    errors,
    errorFor,
    touched,
    setFieldTouched,
    submitAttempted,
    isValid,
    handleSubmit,
    reset,
  }
}
