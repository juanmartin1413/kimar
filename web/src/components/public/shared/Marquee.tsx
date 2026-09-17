import type { CSSProperties, ReactNode } from 'react'

type Props = {
  children: ReactNode
  reverse?: boolean
  /** Segundos por vuelta completa. */
  duration?: number
  className?: string
}

/**
 * Cinta infinita por CSS (public.css: .pub-marquee). Duplica el contenido para
 * que el desplazamiento de -50% cierre el bucle sin saltos. Se pausa al pasar el mouse.
 */
export default function Marquee({ children, reverse = false, duration = 30, className = '' }: Props) {
  return (
    <div className={`pub-marquee ${className}`}>
      <div
        className="pub-marquee-track"
        data-reverse={reverse ? 'true' : 'false'}
        style={{ '--pub-marquee-duration': `${duration}s` } as CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
