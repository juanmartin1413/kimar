'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Retardo en ms para escalonar elementos vecinos. */
  delay?: number
  effect?: 'rise' | 'fade' | 'pop'
  className?: string
}

/**
 * Aparece al entrar en viewport. Las clases .pub-reveal/.is-in viven en public.css
 * y sólo ocultan contenido cuando <html class="js"> está presente, así sin JS se ve todo.
 */
export default function Reveal({ children, delay = 0, effect = 'rise', className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in')
      return
    }
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('is-in')
            io.disconnect()
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-effect={effect}
      className={`pub-reveal ${className}`}
      style={{ '--pub-reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
