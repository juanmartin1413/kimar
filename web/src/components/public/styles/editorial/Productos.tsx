'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { formatPeso } from '@/lib/format'
import { categoriaLabels, precios } from '@/components/public/shared/content'
import { precioLabel, useProductos } from '@/components/public/shared/useProductos'
import Reveal from '@/components/public/shared/Reveal'

/*
 * Lista de precios Editorial: cabecera de revista ("Edición del …"), índice de
 * categorías y grupos con filas de guía punteada `nombre … precio` a dos columnas.
 */

const container = 'mx-auto max-w-7xl px-6 lg:px-10'

function two(n: number) {
  return String(n).padStart(2, '0')
}

export default function Productos() {
  const { activos, porCategoria, descargarLista } = useProductos()

  // La fecha se resuelve sólo en el cliente para evitar diferencias de hidratación.
  const [edicion, setEdicion] = useState<string | null>(null)
  useEffect(() => {
    setEdicion(new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }))
  }, [])

  return (
    <div className="bg-pub-bg text-pub-text">
      {/* Cabecera */}
      <section className={`${container} pt-14 md:pt-24`}>
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-end border-b border-pub-line pb-12">
            <div className="md:col-span-8">
              <p className="text-xs uppercase tracking-[0.2em] text-pub-muted">
                <span className={edicion ? '' : 'invisible'}>Edición del {edicion ?? '00/00/0000'}</span>
                <span className="mx-3 text-pub-accent">·</span>
                {activos.length} productos
              </p>
              <h1 className="mt-6 font-pub-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-pub-heading">
                {precios.titulo}
              </h1>
              <p className="mt-6 max-w-prose leading-relaxed text-pub-muted">{precios.intro}</p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <button
                type="button"
                onClick={descargarLista}
                className="inline-flex items-center gap-3 rounded-pub border border-pub-heading px-6 py-4 text-xs uppercase tracking-[0.2em] text-pub-heading transition-colors hover:bg-pub-heading hover:text-pub-bg"
              >
                <Download className="w-4 h-4" />
                {precios.descargar}
              </button>
            </div>
          </div>
        </Reveal>

        {/* Índice de categorías */}
        <Reveal delay={100} effect="fade">
          <nav aria-label="Categorías" className="flex flex-wrap gap-x-8 gap-y-3 py-6 border-b border-pub-line">
            {porCategoria.map(({ categoria }, i) => (
              <a
                key={categoria}
                href={`#${categoria}`}
                className="inline-flex items-baseline gap-2 text-xs uppercase tracking-[0.2em] text-pub-muted transition-colors hover:text-pub-accent"
              >
                <span className="font-pub-display text-pub-accent">{two(i + 1)}</span>
                {categoriaLabels[categoria]}
              </a>
            ))}
          </nav>
        </Reveal>
      </section>

      {/* Grupos */}
      <section className={container}>
        {porCategoria.map(({ categoria, items }, i) => (
          <section
            key={categoria}
            id={categoria}
            aria-labelledby={`cat-${categoria}`}
            className="scroll-mt-28 grid grid-cols-1 md:grid-cols-12 gap-x-10 border-b border-pub-line py-12 md:py-16"
          >
            <div className="md:col-span-3">
              <Reveal>
                <p className="font-pub-display text-sm tracking-[0.2em] text-pub-accent">{two(i + 1)}</p>
                <h2 id={`cat-${categoria}`} className="mt-2 font-pub-display text-3xl md:text-4xl leading-tight text-pub-heading">
                  {categoriaLabels[categoria]}
                </h2>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-pub-muted-2">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </p>
              </Reveal>
            </div>

            <div className="md:col-span-9 mt-8 md:mt-0">
              <Reveal delay={80}>
                <ul className="md:columns-2 md:gap-x-14">
                  {items.map(p => (
                    <li key={p.id} className="flex items-baseline gap-3 py-3 break-inside-avoid border-b border-pub-line/60">
                      <span className="text-pub-text">{p.nombre}</span>
                      <span aria-hidden="true" className="flex-1 -translate-y-1 border-b border-dotted border-pub-line" />
                      <span className="shrink-0 font-semibold tabular-nums text-pub-accent">
                        {formatPeso(p.precioKg)}
                        <span className="ml-0.5 text-xs font-normal text-pub-muted-2">{precioLabel(p)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>
        ))}

        <Reveal effect="fade">
          <p className="max-w-3xl py-12 font-pub-display italic text-lg leading-relaxed text-pub-muted-2">{precios.nota}</p>
        </Reveal>
      </section>
    </div>
  )
}
