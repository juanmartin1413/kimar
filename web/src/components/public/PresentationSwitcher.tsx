'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Check, LayoutTemplate, Newspaper, Sparkles, SwatchBook, X } from 'lucide-react'
import { useTheme, type Palette, type StyleVariant } from '@/contexts/ThemeContext'

/*
 * Selector de presentación del sitio público: permite combinar estilo (composición,
 * tipografía, radios) y paleta de colores de forma independiente. Pensado para que
 * el dueño compare opciones; la elección se guarda en el dispositivo.
 * Usa radios fijos (no rounded-pub-*) para verse igual en los tres estilos.
 */

const STYLE_OPTIONS: { value: StyleVariant; label: string; hint: string; Icon: typeof Newspaper }[] = [
  { value: 'clasico', label: 'Clásico', hint: 'Sitio actual', Icon: LayoutTemplate },
  { value: 'editorial', label: 'Editorial', hint: 'Revista premium', Icon: Newspaper },
  { value: 'moderno', label: 'Moderno', hint: 'Audaz y dinámico', Icon: Sparkles },
]

// Las muestras de color son fijas a propósito: no deben seguir la paleta activa.
const PALETTE_OPTIONS: { value: Palette; label: string; hint: string; dots: [string, string, string] }[] = [
  { value: 'default', label: 'Azul', hint: 'Marino y celeste', dots: ['oklch(0.18 0.06 240)', 'oklch(0.42 0.14 240)', 'oklch(0.92 0.04 240)'] },
  { value: 'kimar', label: 'KIMAR', hint: 'Navy, oro y marfil', dots: ['#0F2B2E', '#C7A35A', '#F5F2E8'] },
]

export default function PresentationSwitcher() {
  const { style, palette, setStyle, setPalette } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3 font-sans">
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Opciones de presentación"
          className="w-[19rem] rounded-2xl bg-pub-deep text-pub-on-deep shadow-2xl ring-1 ring-white/10 p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Presentación</p>
              <p className="text-[11px] text-pub-on-deep-muted">Elegí cómo se ve el sitio</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <Segment label="Estilo">
            {STYLE_OPTIONS.map(o => (
              <SegmentButton
                key={o.value}
                active={style === o.value}
                onClick={() => setStyle(o.value)}
                label={o.label}
                hint={o.hint}
              >
                <o.Icon className="w-4 h-4" />
              </SegmentButton>
            ))}
          </Segment>

          <Segment label="Colores">
            {PALETTE_OPTIONS.map(o => (
              <SegmentButton
                key={o.value}
                active={palette === o.value}
                onClick={() => setPalette(o.value)}
                label={o.label}
                hint={o.hint}
              >
                <span className="flex -space-x-1">
                  {o.dots.map(c => (
                    <span key={c} className="w-3.5 h-3.5 rounded-full ring-1 ring-black/30" style={{ background: c }} />
                  ))}
                </span>
              </SegmentButton>
            ))}
          </Segment>

          <p className="text-[11px] text-pub-on-deep-muted">Se guarda en este dispositivo.</p>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Cambiar presentación del sitio"
        title="Cambiar presentación"
        className="w-12 h-12 rounded-full bg-pub-accent text-pub-accent-fg shadow-lg flex items-center justify-center transition-transform hover:scale-110"
      >
        <SwatchBook className="w-5 h-5" />
      </button>
    </div>
  )
}

function Segment({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-[11px] uppercase tracking-wider text-pub-on-deep-muted mb-1.5">{label}</legend>
      <div role="radiogroup" aria-label={label} className="grid gap-1.5 rounded-xl ring-1 ring-white/15 p-1.5">
        {children}
      </div>
    </fieldset>
  )
}

function SegmentButton({
  active,
  onClick,
  label,
  hint,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex items-center gap-3 w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
        active ? 'bg-white/15 text-white' : 'hover:bg-white/5 text-pub-on-deep'
      }`}
    >
      <span className="w-8 flex justify-center shrink-0">{children}</span>
      <span className="flex-1 leading-tight">
        <span className="block font-medium">{label}</span>
        <span className="block text-[11px] text-pub-on-deep-muted">{hint}</span>
      </span>
      {active && <Check className="w-4 h-4 shrink-0 text-pub-accent-on-dark" />}
    </button>
  )
}
