import { useId, type SVGProps } from 'react'

/*
 * Ilustraciones vectoriales propias para el sitio público. Todas son decorativas
 * (aria-hidden) y heredan el color vía currentColor, así se colorean con text-pub-*.
 */

type SvgProps = SVGProps<SVGSVGElement>

/** Divisor en forma de ola. `fill` rellena la parte inferior (para transiciones entre fondos); `line` es sólo un trazo fino. */
export function WaveDivider({
  variant = 'fill',
  flip = false,
  className = '',
  ...props
}: SvgProps & { variant?: 'fill' | 'line'; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block w-full ${flip ? 'rotate-180' : ''} ${className}`}
      {...props}
    >
      {variant === 'fill' ? (
        <path
          d="M0 44 C 180 84, 360 4, 540 40 C 720 76, 900 8, 1080 40 C 1260 72, 1350 60, 1440 36 L1440 80 L0 80 Z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M0 44 C 180 84, 360 4, 540 40 C 720 76, 900 8, 1080 40 C 1260 72, 1350 60, 1440 36"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}

/** Langostino estilizado a línea. */
export function ShrimpSilhouette({ className = '', ...props }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* cuerpo curvado */}
      <path d="M28 82 C 14 60, 26 30, 54 24 C 84 18, 104 40, 98 66 C 94 84, 78 96, 62 92" />
      <path d="M28 82 C 34 78, 44 76, 52 80 C 60 84, 62 90, 62 92" />
      {/* segmentos */}
      <path d="M46 30 C 52 40, 54 52, 50 62" strokeWidth="2" />
      <path d="M62 26 C 70 36, 74 50, 70 64" strokeWidth="2" />
      <path d="M78 32 C 86 42, 90 54, 86 70" strokeWidth="2" />
      {/* cola en abanico */}
      <path d="M62 92 L 74 104 L 66 90" />
      <path d="M62 92 L 50 106 L 56 90" />
      {/* patas */}
      <path d="M40 66 L 34 76 M 48 72 L 44 84 M 58 76 L 58 88" strokeWidth="2" />
      {/* antenas */}
      <path d="M30 78 C 18 70, 8 74, 4 86" strokeWidth="2" />
      <path d="M28 84 C 16 86, 8 96, 8 108" strokeWidth="2" />
      {/* ojo */}
      <circle cx="36" cy="74" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Calamar estilizado a línea. */
export function SquidSilhouette({ className = '', ...props }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* manto */}
      <path d="M60 8 C 74 24, 78 46, 76 66 L 44 66 C 42 46, 46 24, 60 8 Z" />
      {/* aletas */}
      <path d="M60 8 C 72 14, 84 26, 86 40 C 80 36, 74 34, 70 36" strokeWidth="2" />
      <path d="M60 8 C 48 14, 36 26, 34 40 C 40 36, 46 34, 50 36" strokeWidth="2" />
      {/* cabeza y ojos */}
      <path d="M44 66 C 42 76, 46 82, 60 82 C 74 82, 78 76, 76 66" />
      <circle cx="51" cy="72" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="69" cy="72" r="2.5" fill="currentColor" stroke="none" />
      {/* tentáculos */}
      <path d="M48 82 C 40 92, 34 100, 30 112" strokeWidth="2" />
      <path d="M54 83 C 50 94, 46 104, 46 114" strokeWidth="2" />
      <path d="M60 83 C 60 96, 62 104, 60 116" strokeWidth="2" />
      <path d="M66 83 C 70 94, 74 104, 74 114" strokeWidth="2" />
      <path d="M72 82 C 80 92, 86 100, 90 112" strokeWidth="2" />
    </svg>
  )
}

/** Vieira / concha en abanico. */
export function ScallopSilhouette({ className = '', ...props }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* borde festoneado */}
      <path d="M60 104 L 14 52 C 18 46, 26 46, 28 40 C 32 34, 40 36, 42 30 C 46 24, 54 26, 60 20 C 66 26, 74 24, 78 30 C 80 36, 88 34, 92 40 C 94 46, 102 46, 106 52 Z" />
      {/* nervaduras */}
      <path d="M60 104 L 28 42 M 60 104 L 42 32 M 60 104 L 60 22 M 60 104 L 78 32 M 60 104 L 92 42" strokeWidth="2" />
      {/* base */}
      <path d="M46 96 C 52 100, 68 100, 74 96" strokeWidth="2" />
    </svg>
  )
}

/** Patrón de red (rombos finos). Se posiciona absoluto y cubre al padre. */
export function NetPattern({ className = '', size = 40, ...props }: SvgProps & { size?: number }) {
  const id = useId().replace(/:/g, '')
  const half = size / 2
  return (
    <svg aria-hidden="true" className={`absolute inset-0 h-full w-full ${className}`} {...props}>
      <defs>
        <pattern id={`net-${id}`} width={size} height={size} patternUnits="userSpaceOnUse">
          <path
            d={`M${half} 0 L${size} ${half} L${half} ${size} L0 ${half} Z`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#net-${id})`} />
    </svg>
  )
}

/** Anillos concéntricos, como ondas en el agua. */
export function RippleRings({ className = '', rings = 4, ...props }: SvgProps & { rings?: number }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className} fill="none" stroke="currentColor" {...props}>
      {Array.from({ length: rings }).map((_, i) => (
        <circle
          key={i}
          cx="100"
          cy="100"
          r={20 + (i * 75) / Math.max(1, rings - 1)}
          strokeWidth="1.25"
          opacity={1 - i / (rings + 0.5)}
        />
      ))}
    </svg>
  )
}

/** Copo de frío: alusión a la cadena de frío. */
export function FrostMark({ className = '', ...props }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" {...props}>
      <path d="M60 14 V106 M20 37 L100 83 M20 83 L100 37" />
      <path d="M60 14 L50 26 M60 14 L70 26 M60 106 L50 94 M60 106 L70 94" strokeWidth="2" />
      <path d="M20 37 L36 38 M20 37 L26 52 M100 83 L84 82 M100 83 L94 68" strokeWidth="2" />
      <path d="M20 83 L36 82 M20 83 L26 68 M100 37 L84 38 M100 37 L94 52" strokeWidth="2" />
    </svg>
  )
}
