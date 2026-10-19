import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

/**
 * Value that animates to its target with a critically damped spring.
 *
 * Implemented as a small integrator rather than a CSS transition for two
 * reasons that matter here:
 *  1. It starts from the *current on-screen value*, so an interruption (data
 *     arriving, a second refresh) never jumps back to a stale baseline.
 *  2. Numbers are repainted per frame, which a CSS transition cannot do.
 *
 * Damping 1.0 means no overshoot — the house style for anything that is not
 * driven by a flick.
 */
function useSpringValue(target: number, enabled: boolean): number {
  const [value, setValue] = useState(enabled ? 0 : target)
  const currentRef = useRef(enabled ? 0 : target)
  const velocityRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      currentRef.current = target
      velocityRef.current = 0
      setValue(target)
      return
    }

    let frame = 0
    let previous = performance.now()

    const stiffness = 170
    const damping = 2 * Math.sqrt(stiffness)

    const step = (now: number) => {
      // Clamp dt so a backgrounded tab cannot produce one huge, jumpy step.
      const dt = Math.min((now - previous) / 1000, 1 / 30)
      previous = now

      const displacement = target - currentRef.current
      velocityRef.current += (stiffness * displacement - damping * velocityRef.current) * dt
      currentRef.current += velocityRef.current * dt

      if (Math.abs(displacement) < 0.5 && Math.abs(velocityRef.current) < 0.5) {
        currentRef.current = target
        velocityRef.current = 0
        setValue(target)
        return
      }

      setValue(currentRef.current)
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, enabled])

  return value
}

interface CountUpProps {
  value: number
  /** Rendered after the number, e.g. "h" or "%". */
  suffix?: string
  /** Decimal places to show while counting. */
  precision?: number
  className?: string
}

export function CountUp({ value, suffix = '', precision = 0, className }: CountUpProps) {
  const reducedMotion = usePrefersReducedMotion()
  const animated = useSpringValue(value, !reducedMotion && Number.isFinite(value))
  const rounded = animated.toFixed(precision)

  return (
    <span className={className} aria-label={`${value}${suffix}`}>
      <span aria-hidden="true" className="numeric">
        {rounded}
        {suffix}
      </span>
    </span>
  )
}
