'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { CategoriaProducto, Producto, UnidadProducto } from '@/lib/types'
import { formatPeso } from '@/lib/format'
import { Pencil, Check, X, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

const catLabels: Record<CategoriaProducto, string> = {
  calamares: '🦑 Calamares',
  langostinos: '🦐 Langostinos & Afines',
  bivalvos: '🦪 Bivalvos & Moluscos',
  pescados: '🐟 Pescados',
  pulpos: '🐙 Pulpos',
  otros: '⭐ Especialidades',
}

const catOrder: CategoriaProducto[] = ['langostinos', 'calamares', 'bivalvos', 'pescados', 'pulpos', 'otros']

function unidadSuffix(u: UnidadProducto | undefined) {
  return u === 'unidad' ? '/u' : '/kg'
}

function ProductoRow({ producto }: { producto: Producto }) {
  const { updateProducto, getCalidadesDelProducto, addCalidad, updateCalidad } = useData()
  const { canManageData } = useAuth()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(producto.precioKg))
  const [unidad, setUnidad] = useState<UnidadProducto>(producto.unidad ?? 'kg')
  const [showCalidades, setShowCalidades] = useState(false)
  const [nuevaCalidad, setNuevaCalidad] = useState('')
  const calidades = getCalidadesDelProducto(producto.id)

  async function handleAddCalidad() {
    const nombre = nuevaCalidad.trim()
    if (!nombre) return
    await addCalidad(producto.id, nombre)
    setNuevaCalidad('')
  }

  function save() {
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) {
      updateProducto(producto.id, { precioKg: n, unidad })
    }
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
    setVal(String(producto.precioKg))
    setUnidad(producto.unidad ?? 'kg')
  }

  const suffix = unidadSuffix(producto.unidad)

  if (!canManageData) {
    return (
      <div className="flex items-center justify-between px-6 py-3.5">
        <span className="text-[oklch(0.3_0.06_240)] font-medium">{producto.nombre}</span>
        <span className="tabular-nums font-bold text-[oklch(0.42_0.14_240)]">{formatPeso(producto.precioKg)}{suffix}</span>
      </div>
    )
  }

  return (
    <div>
      {editing ? (
        <div className="flex items-center justify-between px-6 py-2.5 bg-[oklch(0.97_0.02_240)]">
          <span className="text-[oklch(0.3_0.06_240)] font-medium flex-1 mr-4">{producto.nombre}</span>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[oklch(0.88_0.02_240)] overflow-hidden text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUnidad('kg')}
                className={cn('px-2.5 py-1.5 transition-colors', unidad === 'kg' ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}
              >kg</button>
              <button
                type="button"
                onClick={() => setUnidad('unidad')}
                className={cn('px-2.5 py-1.5 transition-colors', unidad === 'unidad' ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}
              >u</button>
            </div>
            <span className="text-[oklch(0.45_0.04_240)] text-sm">$</span>
            <input
              autoFocus
              type="number"
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
              className="w-28 border border-[oklch(0.42_0.14_240)] rounded px-2 py-0.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
            />
            <button onClick={save} className="text-green-600 hover:text-green-800 p-0.5"><Check className="w-4 h-4" /></button>
            <button onClick={cancel} className="text-gray-400 hover:text-gray-600 p-0.5"><X className="w-4 h-4" /></button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-6 py-3.5 hover:bg-[oklch(0.98_0.005_240)] transition-colors">
          <span className="text-[oklch(0.3_0.06_240)] font-medium">{producto.nombre}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCalidades(v => !v)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors',
                showCalidades ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.92_0.03_240)]'
              )}
              title="Calidades internas de stock (uso interno, no visible al cliente)"
            >
              <Layers className="w-3.5 h-3.5" />
              Calidades{calidades.length > 0 ? ` (${calidades.length})` : ''}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[oklch(0.92_0.03_240)] transition-colors"
              title="Editar precio y unidad"
            >
              <span className="tabular-nums font-bold text-[oklch(0.42_0.14_240)]">{formatPeso(producto.precioKg)}{suffix}</span>
              <Pencil className="w-3.5 h-3.5 text-[oklch(0.65_0.06_240)]" />
            </button>
          </div>
        </div>
      )}

      {showCalidades && (
        <div className="px-6 py-3 bg-[oklch(0.98_0.005_240)] border-t border-[oklch(0.95_0.01_240)] space-y-2">
          <p className="text-[11px] text-[oklch(0.55_0.03_240)]">
            Uso interno: solo sirve para diferenciar de qué lote de stock se descuenta al vender. El cliente nunca ve esto.
          </p>
          {calidades.length === 0 && (
            <p className="text-xs text-[oklch(0.6_0.02_240)]">Sin calidades — el stock de este producto se maneja como un solo lote.</p>
          )}
          {calidades.map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span className={cn(!c.activo && 'line-through text-[oklch(0.6_0.02_240)]')}>{c.nombre}</span>
              <button
                onClick={() => updateCalidad(c.id, { activo: !c.activo })}
                className="text-xs font-semibold text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.3_0.06_240)]"
              >
                {c.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={nuevaCalidad}
              onChange={e => setNuevaCalidad(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCalidad() }}
              placeholder="Nueva calidad (ej. Glaseado 20%)"
              className="flex-1 border border-[oklch(0.88_0.02_240)] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
            />
            <button
              onClick={handleAddCalidad}
              disabled={!nuevaCalidad.trim()}
              className="rounded-lg bg-[oklch(0.42_0.14_240)] text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
            >
              + Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductosInternoPage() {
  const { data } = useData()
  const activos = data.productos.filter(p => p.activo)

  const byCategory = activos.reduce<Record<string, Producto[]>>((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = []
    acc[p.categoria].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Productos & Precios</h1>
        <p className="text-sm text-[oklch(0.5_0.04_240)]">
          {activos.length} productos activos — clic en el precio para editar precio y unidad.
        </p>
      </div>

      <div className="space-y-6">
        {catOrder.map(cat => {
          const prods = byCategory[cat]
          if (!prods?.length) return null
          return (
            <div key={cat} className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
              <div className="bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.9_0.01_240)] px-6 py-3">
                <h2 className="font-bold text-[oklch(0.3_0.08_240)]">{catLabels[cat]}</h2>
              </div>
              <div className="divide-y divide-[oklch(0.95_0.01_240)]">
                {prods.map(p => <ProductoRow key={p.id} producto={p} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
