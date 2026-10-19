import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError } from '../services/api/client'
import type { ApiErrorShape } from '../services/api/types'

interface UseAsyncOptions {
  /** Run immediately on mount. Off for actions triggered by a button. */
  immediate?: boolean
}

interface UseAsyncState<T> {
  data: T | null
  error: ApiErrorShape | null
  loading: boolean
  /** True only for the initial load, so refreshes don't blank the page. */
  initialLoading: boolean
}

/**
 * Async resource helper with three properties the pages depend on:
 *  - stale responses are ignored (an older request cannot overwrite a newer one)
 *  - errors are normalized through toApiError
 *  - a refresh keeps existing data on screen instead of flashing a skeleton
 */
export function useAsync<T>(
  operation: () => Promise<T>,
  deps: unknown[] = [],
  options: UseAsyncOptions = { immediate: true },
) {
  const { immediate = true } = options
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    loading: immediate,
    initialLoading: immediate,
  })

  const requestId = useRef(0)
  const mounted = useRef(true)
  const operationRef = useRef(operation)
  operationRef.current = operation

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async (): Promise<T | null> => {
    const id = ++requestId.current
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }))

    try {
      const result = await operationRef.current()
      if (!mounted.current || id !== requestId.current) return result
      setState({
        data: result,
        error: null,
        loading: false,
        initialLoading: false,
      })
      return result
    } catch (error) {
      if (!mounted.current || id !== requestId.current) return null
      setState((current) => ({
        ...current,
        error: toApiError(error),
        loading: false,
        initialLoading: false,
      }))
      return null
    }
  }, [])

  useEffect(() => {
    if (!immediate) return
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback((updater: (previous: T | null) => T | null) => {
    setState((current) => ({ ...current, data: updater(current.data) }))
  }, [])

  return { ...state, run, setData, refresh: run }
}
