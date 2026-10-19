import { useEffect, useState } from 'react'

/**
 * Debounces a fast-changing value (search inputs). Kept short — anything longer
 * than ~250ms reads as input lag rather than filtering.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}
