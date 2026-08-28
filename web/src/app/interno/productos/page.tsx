'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Producto, UnidadProducto } from '@/lib/types'
import { formatPeso } from '@/lib/format'
import { Pencil, Check, X, Layers, Plus, GripVertical, Ban, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function unidadSuffix(u: UnidadProducto | undefined) {
  return u === 'unidad' ? '/u' : '/kg'
}

function NuevoProductoForm({ onClose }: { onClose: () => void }) {
  const { addProducto } = useData()
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [unidad, setUnidad] = useState<UnidadProducto>('kg')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    const n = parseFloat(precio)
    if (!nombre.trim() || isNaN(n) || n <= 0) return
    setSaving(true)
    await addProducto({ nombre: nombre.trim(), precioKg: n, unidad })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl space-y-4">
        <h3 className="font-bold text-[oklch(0.25_0.08_240)]">Cargar producto</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[oklch(0.5_0.04_240)] mb-1">Nombre</label>
            <input
              autoFocus
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
              placeholder="Ej. Filet de Merluza"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[oklch(0.5_0.04_240)] mb-1">Precio</label>
              <input
                type="number"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                className="w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[oklch(0.5_0.04_240)] mb-1">Unidad</label>
              <div className="flex rounded-lg border border-[oklch(0.88_0.02_240)] overflow-hidden text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUnidad('kg')}
                  className={cn('px-3 py-2 transition-colors', unidad === 'kg' ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}
                >kg</button>
                <button
                  type="button"
                  onClick={() => setUnidad('unidad')}
                  className={cn('px-3 py-2 transition-colors', unidad === 'unidad' ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}
                >u</button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-1.5 text-sm font-semibold text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.3_0.06_240)]">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !nombre.trim() || !precio}
            className="px-4 py-1.5 rounded-lg bg-[oklch(0.42_0.14_240)] text-white text-sm font-semibold disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductoRow({ producto, dragHandle }: { producto: Producto; dragHandle?: React.ReactNode }) {
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
    <div className={cn(!producto.activo && 'opacity-50')}>
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
          <div className="flex items-center gap-2">
            {dragHandle}
            <span className={cn('text-[oklch(0.3_0.06_240)] font-medium', !producto.activo && 'line-through')}>{producto.nombre}</span>
          </div>
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
            <button
              onClick={() => updateProducto(producto.id, { activo: !producto.activo })}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors',
                producto.activo
                  ? 'text-[oklch(0.55_0.15_25)] hover:bg-[oklch(0.95_0.05_25)]'
                  : 'text-[oklch(0.5_0.1_150)] hover:bg-[oklch(0.95_0.05_150)]'
              )}
              title={producto.activo ? 'Desactivar producto' : 'Reactivar producto'}
            >
              {producto.activo ? <Ban className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {producto.activo ? 'Desactivar' : 'Activar'}
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

function SortableProductoRow({ producto }: { producto: Producto }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: producto.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style}>
      <ProductoRow
        producto={producto}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-[oklch(0.7_0.02_240)] hover:text-[oklch(0.5_0.04_240)] touch-none"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        }
      />
    </div>
  )
}

export default function ProductosInternoPage() {
  const { data, reorderProductos } = useData()
  const { canManageData } = useAuth()
  const [showNuevo, setShowNuevo] = useState(false)

  const productos = [...data.productos].sort((a, b) => a.orden - b.orden)
  const activos = productos.filter(p => p.activo)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = productos.findIndex(p => p.id === active.id)
    const newIndex = productos.findIndex(p => p.id === over.id)
    const reordered = arrayMove(productos, oldIndex, newIndex)
    reorderProductos(reordered.map((p, i) => ({ id: p.id, orden: i })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Productos & Precios</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">
            {activos.length} productos activos — clic en el precio para editar precio y unidad. Arrastrá para cambiar el orden en la lista de precios.
          </p>
        </div>
        {canManageData && (
          <button
            onClick={() => setShowNuevo(true)}
            className="flex items-center gap-2 rounded-lg bg-[oklch(0.42_0.14_240)] text-white text-sm font-semibold px-4 py-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Cargar producto
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
        {canManageData ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={productos.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-[oklch(0.95_0.01_240)]">
                {productos.map(p => <SortableProductoRow key={p.id} producto={p} />)}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="divide-y divide-[oklch(0.95_0.01_240)]">
            {activos.map(p => <ProductoRow key={p.id} producto={p} />)}
          </div>
        )}
      </div>

      {showNuevo && <NuevoProductoForm onClose={() => setShowNuevo(false)} />}
    </div>
  )
}
