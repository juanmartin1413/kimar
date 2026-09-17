'use client'

import { Download } from 'lucide-react'
import { formatPeso } from '@/lib/format'
import { precios } from '@/components/public/shared/content'
import { precioLabel, useProductos } from '@/components/public/shared/useProductos'

export default function Productos() {
  const { productos, descargarLista } = useProductos()

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 bg-pub-bg" style={{ minHeight: '100%' }}>
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-bold text-pub-heading">{precios.titulo}</h1>
        <p className="max-w-xl mx-auto text-pub-muted">{precios.intro}</p>
        <button
          onClick={descargarLista}
          className="inline-flex items-center gap-2 bg-pub-accent text-pub-accent-fg font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          {precios.descargar}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {productos.map(p => (
          <div key={p.id} className="flex justify-between items-center py-3 px-4 rounded-lg">
            <span className="font-medium text-pub-text">{p.nombre}</span>
            <span className="font-bold tabular-nums text-pub-accent">
              {formatPeso(p.precioKg)}{precioLabel(p)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs mt-12 text-pub-muted-2">{precios.nota}</p>
    </div>
  )
}
