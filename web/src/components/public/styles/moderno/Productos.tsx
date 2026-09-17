'use client'

import { Download } from 'lucide-react'
import { formatPeso } from '@/lib/format'
import { categoriaLabels, precios } from '@/components/public/shared/content'
import { precioLabel, useProductos } from '@/components/public/shared/useProductos'
import Reveal from '@/components/public/shared/Reveal'

export default function Productos() {
  const { activos, porCategoria, descargarLista } = useProductos()

  return (
    <div className="bg-pub-bg">
      {/* Header */}
      <section className="bg-pub-bg-alt rounded-b-[3rem] px-6 pt-14 pb-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 items-end">
          <Reveal className="lg:col-span-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pub-accent mb-3">
              {activos.length} productos activos
            </p>
            <h1 className="font-pub-display font-extrabold tracking-tight text-5xl md:text-6xl text-pub-heading leading-[0.98]">
              {precios.titulo}
            </h1>
            <p className="mt-5 text-pub-muted text-lg max-w-xl">{precios.intro}</p>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-4 lg:justify-self-end">
            <button
              type="button"
              onClick={descargarLista}
              className="inline-flex items-center gap-2 rounded-full bg-pub-accent text-pub-accent-fg font-semibold px-7 py-3.5 hover:-translate-y-0.5 transition-transform"
            >
              <Download className="w-4 h-4" />
              {precios.descargar}
            </button>
          </Reveal>
        </div>
      </section>

      {/* Chip bar */}
      <div className="sticky top-24 z-30 px-4 -mt-7">
        <nav
          aria-label="Categorías"
          className="max-w-3xl mx-auto rounded-full bg-pub-bg/80 backdrop-blur border border-pub-line shadow-lg p-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex items-center gap-1 w-max sm:w-full sm:justify-center">
            {porCategoria.map(({ categoria, items }) => (
              <li key={categoria}>
                <a
                  href={`#${categoria}`}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-pub-heading-2 hover:bg-pub-soft transition-colors"
                >
                  {categoriaLabels[categoria]}
                  <span className="text-xs font-medium text-pub-muted-2 tabular-nums">{items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Groups */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 space-y-16">
        {porCategoria.map(({ categoria, items }) => (
          <section key={categoria} id={categoria} className="scroll-mt-32">
            <Reveal effect="fade">
              <div className="flex items-baseline gap-3 mb-6">
                <h2 className="font-pub-display font-extrabold tracking-tight text-3xl text-pub-heading">
                  {categoriaLabels[categoria]}
                </h2>
                <span className="rounded-full bg-pub-soft text-pub-heading-2 text-xs font-semibold px-2.5 py-1 tabular-nums">
                  {items.length}
                </span>
              </div>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 5) * 40} effect="pop" className="h-full">
                  <div className="h-full rounded-pub-lg bg-pub-surface border border-pub-line p-5 flex justify-between items-end gap-4 hover:border-pub-accent/60 transition">
                    <span className="font-semibold text-pub-heading leading-snug">{p.nombre}</span>
                    <span className="shrink-0 text-pub-accent font-extrabold tabular-nums text-right leading-none">
                      {formatPeso(p.precioKg)}
                      <span className="text-xs font-medium text-pub-muted-2">{precioLabel(p)}</span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        ))}

        <Reveal effect="fade">
          <p className="rounded-pub-lg bg-pub-soft text-pub-muted text-xs p-4 leading-relaxed">{precios.nota}</p>
        </Reveal>
      </div>
    </div>
  )
}
