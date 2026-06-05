'use client'

import { use, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { ItemPedido, Pedido } from '@/lib/types'
import { formatPeso, formatFecha } from '@/lib/format'
import { generateId } from '@/lib/storage'
import { Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const estadoColors = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-green-100 text-green-700',
  cancelado: 'bg-gray-100 text-gray-600',
}

export default function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data } = useData()

  const pedido = data.pedidos.find(p => p.id === id)
  if (!pedido) {
    return (
      <div className="space-y-4">
        <Link href="/interno/pedidos" className="flex items-center gap-2 text-sm text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.42_0.14_240)]">
          <ArrowLeft className="w-4 h-4" /> Volver a pedidos
        </Link>
        <p className="text-[oklch(0.5_0.04_240)]">Pedido no encontrado.</p>
      </div>
    )
  }

  const cliente = data.clientes.find(c => c.id === pedido.clienteId)
  const vendedor = data.vendedores.find(v => v.id === pedido.vendedorId)

  return <PedidoDetalleForm pedido={pedido} clienteNombre={cliente?.nombre} vendedorNombre={vendedor?.nombre} />
}

function PedidoDetalleForm({ pedido, clienteNombre, vendedorNombre }: {
  pedido: Pedido
  clienteNombre?: string
  vendedorNombre?: string
}) {
  const { data, updatePedido } = useData()
  const { canManageData } = useAuth()

  const [editing, setEditing] = useState(false)
  const [items, setItems] = useState<ItemPedido[]>(pedido.items)
  const [observaciones, setObservaciones] = useState(pedido.observaciones ?? '')
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precio, setPrecio] = useState('')

  const selectedProduct = data.productos.find(p => p.id === productoId)
  const unidadLabel = selectedProduct?.unidad === 'unidad' ? 'Unidades' : 'Kg'
  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const originalTotal = pedido.items.reduce((s, i) => s + i.subtotal, 0)
  const canEdit = pedido.estado === 'pendiente' && canManageData

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"

  function onProductoChange(id: string) {
    setProductoId(id)
    const prod = data.productos.find(p => p.id === id)
    if (prod) setPrecio(String(prod.precioKg))
  }

  function addItem() {
    const prod = data.productos.find(p => p.id === productoId)
    if (!prod || !cantidad || !precio) return
    const qty = parseFloat(cantidad)
    const pr = parseFloat(precio)
    setItems(prev => [...prev, {
      id: generateId(),
      productoId: prod.id,
      productoNombre: prod.nombre,
      cantidad: qty,
      precioUnitario: pr,
      subtotal: qty * pr,
    }])
    setProductoId('')
    setCantidad('')
    setPrecio('')
  }

  function saveEdit() {
    updatePedido(pedido.id, { items, observaciones: observaciones || undefined })
    setEditing(false)
  }

  function cancelEdit() {
    setItems(pedido.items)
    setObservaciones(pedido.observaciones ?? '')
    setEditing(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/interno/pedidos" className="text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Detalle del pedido</h1>
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', estadoColors[pedido.estado])}>
              {pedido.estado.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">{clienteNombre} — {formatFecha(pedido.fecha)}</p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-[oklch(0.5_0.04_240)] mb-0.5">Cliente</p>
            <p className="font-semibold text-[oklch(0.25_0.06_240)]">{clienteNombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[oklch(0.5_0.04_240)] mb-0.5">Vendedor</p>
            <p className="font-semibold text-[oklch(0.25_0.06_240)]">{vendedorNombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[oklch(0.5_0.04_240)] mb-0.5">Fecha del pedido</p>
            <p className="font-semibold text-[oklch(0.25_0.06_240)]">{formatFecha(pedido.fecha)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[oklch(0.5_0.04_240)] mb-0.5">Total estimado</p>
            <p className="font-bold text-[oklch(0.42_0.14_240)] tabular-nums text-lg">{formatPeso(originalTotal)}</p>
          </div>
        </div>
        {pedido.observaciones && (
          <div className="mt-4 pt-4 border-t border-[oklch(0.93_0.01_240)]">
            <p className="text-xs font-medium text-[oklch(0.5_0.04_240)] mb-0.5">Observaciones</p>
            <p className="text-sm text-[oklch(0.35_0.06_240)]">{pedido.observaciones}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[oklch(0.93_0.01_240)]">
          <h2 className="font-semibold text-[oklch(0.25_0.06_240)]">Ítems del pedido</h2>
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-[oklch(0.42_0.14_240)] hover:text-[oklch(0.32_0.12_240)] font-medium transition-colors"
            >
              Editar pedido
            </button>
          )}
        </div>

        {editing ? (
          <div className="p-6 space-y-4">
            <div className="border border-dashed border-[oklch(0.85_0.03_240)] rounded-lg p-4 space-y-3">
              <p className="text-xs font-medium text-[oklch(0.45_0.04_240)]">Agregar producto</p>
              <div className="grid grid-cols-3 gap-2">
                <select value={productoId} onChange={e => onProductoChange(e.target.value)} className={fieldClass}>
                  <option value="">Producto…</option>
                  {data.productos.filter(p => p.activo).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
                <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder={unidadLabel} min="0" step="0.5" className={fieldClass} />
                <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="$/unidad" min="0" className={fieldClass} />
              </div>
              <button
                type="button"
                onClick={addItem}
                disabled={!productoId || !cantidad || !precio}
                className="text-sm bg-[oklch(0.92_0.04_240)] hover:bg-[oklch(0.85_0.05_240)] disabled:opacity-50 text-[oklch(0.35_0.10_240)] px-4 py-1.5 rounded-lg font-medium transition-colors"
              >
                + Agregar
              </button>
            </div>

            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[oklch(0.97_0.01_240)] rounded-lg px-4 py-2.5 text-sm">
                  <span>{item.cantidad} × {item.productoNombre}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">{formatPeso(item.subtotal)}</span>
                    <button type="button" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}>
                      <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
              {items.length > 0 && (
                <div className="text-right font-bold text-[oklch(0.25_0.06_240)] pr-4 pt-1">Total: {formatPeso(total)}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Observaciones</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} className={fieldClass} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={cancelEdit} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)] transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={saveEdit} disabled={items.length === 0} className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                Guardar cambios
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.95_0.01_240)]">
            {pedido.items.map(item => (
              <div key={item.id} className="flex items-center justify-between px-6 py-3.5 text-sm">
                <div>
                  <p className="font-medium text-[oklch(0.3_0.06_240)]">{item.productoNombre}</p>
                  <p className="text-xs text-[oklch(0.55_0.04_240)]">{item.cantidad} × {formatPeso(item.precioUnitario)}</p>
                </div>
                <span className="font-semibold tabular-nums text-[oklch(0.3_0.06_240)]">{formatPeso(item.subtotal)}</span>
              </div>
            ))}
            <div className="px-6 py-3 bg-[oklch(0.97_0.01_240)] flex justify-end">
              <span className="font-bold text-[oklch(0.25_0.06_240)] tabular-nums">Total: {formatPeso(originalTotal)}</span>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/interno/pedidos"
        className="block text-center border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-3 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)] transition-colors"
      >
        Volver a pedidos
      </Link>
    </div>
  )
}
