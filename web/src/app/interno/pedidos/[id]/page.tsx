'use client'

import { EntregaPactada, horarioEntrega } from '@/components/interno/EntregaPactada'
import { EstadoCuentaCliente } from '@/components/interno/EstadoCuentaCliente'

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
  const { data, updatePedidoCompleto } = useData()
  const { canManageData, usuario } = useAuth()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clienteId, setClienteId] = useState(pedido.clienteId)
  const [fecha, setFecha] = useState(pedido.fecha)
  const [fechaEntrega, setFechaEntrega] = useState(pedido.fechaEntrega)
  const [desde, setDesde] = useState(pedido.horaEntregaDesde ?? '')
  const [hasta, setHasta] = useState(pedido.horaEntregaHasta ?? '')
  const [items, setItems] = useState<ItemPedido[]>(pedido.items)
  const [observaciones, setObservaciones] = useState(pedido.observaciones ?? '')
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precio, setPrecio] = useState('')

  const selectedProduct = data.productos.find(p => p.id === productoId)
  const unidadLabel = selectedProduct?.unidad === 'unidad' ? 'Unidades' : 'Kg'
  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const originalTotal = pedido.items.reduce((s, i) => s + i.subtotal, 0)
  const vendedorId = data.vendedores.find(v => v.usuarioId === usuario?.id && v.activo)?.id
  const propio = usuario?.rol === 'vendedor' && !!vendedorId && pedido.vendedorId === vendedorId && data.clientes.some(c => c.id === pedido.clienteId && c.vendedorId === vendedorId)
  const canEdit = pedido.estado === 'pendiente' && (canManageData || propio)
  const itemsValidos = items.length > 0 && items.every(i => Number.isFinite(i.cantidad) && i.cantidad > 0 && Number.isFinite(i.precioUnitario) && i.precioUnitario >= 0)

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
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(pr) || pr < 0) return
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

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (saving || !canEdit || !itemsValidos) return
    if (!fecha || !fechaEntrega || (hasta && hasta <= desde)) { setError('Revisá las fechas y el horario de entrega.'); return }
    setSaving(true); setError('')
    try {
      await updatePedidoCompleto(pedido.id, { clienteId, vendedorId: pedido.vendedorId, fecha, fechaEntrega,
        horaEntregaDesde: desde, horaEntregaHasta: hasta, items, observaciones })
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el pedido.')
    } finally { setSaving(false) }
  }

  function cancelEdit() {
    setItems(pedido.items)
    setObservaciones(pedido.observaciones ?? '')
    setClienteId(pedido.clienteId); setFecha(pedido.fecha); setFechaEntrega(pedido.fechaEntrega)
    setDesde(pedido.horaEntregaDesde ?? ''); setHasta(pedido.horaEntregaHasta ?? '')
    setError(''); setProductoId(''); setCantidad(''); setPrecio('')
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

      <EstadoCuentaCliente clienteId={editing ? clienteId : pedido.clienteId} />
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
            <p className="font-semibold text-[oklch(0.25_0.06_240)]">{formatFecha(pedido.fecha)}</p><p>Entrega: {formatFecha(pedido.fechaEntrega)} · {horarioEntrega(pedido.horaEntregaDesde, pedido.horaEntregaHasta)}</p>
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
              onClick={() => { cancelEdit(); setEditing(true) }}
              className="text-sm text-[oklch(0.42_0.14_240)] hover:text-[oklch(0.32_0.12_240)] font-medium transition-colors"
            >
              Editar pedido
            </button>
          )}
        </div>

        {editing && canEdit ? (
          <form onSubmit={saveEdit} className="p-6 space-y-4">
            <fieldset disabled={saving} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">Fecha del pedido *<input required type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={fieldClass} /></label>
              <label className="text-sm">Cliente *<select required value={clienteId} onChange={e => setClienteId(e.target.value)} className={fieldClass}>
                {data.clientes.filter(c => c.activo && (canManageData || c.vendedorId === vendedorId)).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select></label>
            </div>
            <EntregaPactada fecha={fechaEntrega} desde={desde} hasta={hasta} onChange={(f,d,h) => { setFechaEntrega(f); setDesde(d); setHasta(h) }} />
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
                  <div className="flex-1 space-y-2 mr-3">
                    <span>{item.productoNombre}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs">Cantidad<input aria-label={`Cantidad de ${item.productoNombre}`} required type="number" min="0.01" step="0.01" value={item.cantidad} className={fieldClass} onChange={e => {
                        const cantidad = Number(e.target.value)
                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, cantidad, subtotal: Math.round(cantidad * i.precioUnitario * 100) / 100 } : i))
                      }} /></label>
                      <label className="text-xs">Precio unitario<input aria-label={`Precio de ${item.productoNombre}`} required type="number" min="0" step="0.01" value={item.precioUnitario} className={fieldClass} onChange={e => {
                        const precioUnitario = Number(e.target.value)
                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, precioUnitario, subtotal: Math.round(i.cantidad * precioUnitario * 100) / 100 } : i))
                      }} /></label>
                    </div>
                  </div>
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
              <textarea maxLength={500} value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} className={fieldClass} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={cancelEdit} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)] transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving || !itemsValidos} className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
            </fieldset>
            {error && <p role="alert" className="text-red-700">{error}</p>}
          </form>
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
