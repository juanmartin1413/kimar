'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  to: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

const fmt = new Intl.NumberFormat('es-AR')

/**
 * Contador animado al entrar en viewport. En el servidor y con
 * prefers-reduced-motion muestra directamente el valor final.
 */
export default function Counter({ to, prefix = '', suffix = '', duration = 1200, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(to)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || started.current) return
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return
        started.current = true
        io.disconnect()
        const t0 = performance.now()
        setValue(0)
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration)
          const eased = 1 - Math.pow(1 - p, 3)
          setValue(Math.round(to * eased))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {fmt.format(value)}
      {suffix}
    </span>
  )
}
