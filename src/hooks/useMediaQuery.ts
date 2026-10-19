import { useEffect, useState } from 'react'

/**
 * Subscribes to a media query. Used for layout decisions (sidebar rail vs.
 * desktop) and to honour reduced-motion / reduced-transparency preferences in
 * JS where CSS media queries can't reach (e.g. disabling a count-up animation).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** Breakpoints matching the Tailwind defaults used across the app. */
export function useBreakpoint() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 768px)')
  return { isDesktop, isTablet, isMobile: !isTablet }
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
