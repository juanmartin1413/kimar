'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { ItemPedido } from '@/lib/types'
import { formatPeso, today } from '@/lib/format'
import { generateId } from '@/lib/storage'
import { Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoPedidoPage() {
  const { data, addPedido, getStockActual } = useData()
  const { usuario } = useAuth()
  const router = useRouter()

  const vendedorIdDefault = data.vendedores.find(v => v.usuarioId === usuario?.id)?.id ?? data.vendedores[0]?.id ?? ''

  const [clienteId, setClienteId] = useState('')
  const [vendedorId, setVendedorId] = useState(vendedorIdDefault)
  const [fecha, setFecha] = useState(today())
  const [observaciones, setObservaciones] = useState('')
  const [items, setItems] = useState<ItemPedido[]>([])
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precio, setPrecio] = useState('')

  const selectedProduct = data.productos.find(p => p.id === productoId)
  const unidadLabel = selectedProduct?.unidad === 'unidad' ? 'Unidades' : 'Kg'
  const stockActual = selectedProduct ? getStockActual(selectedProduct.id) : 0
  const cantidadNum = cantidad ? parseFloat(cantidad) : 0
  const stockInsuficiente = cantidadNum > stockActual && stockActual > 0

  function onClienteChange(id: string) {
    setClienteId(id)
    const cliente = data.clientes.find(c => c.id === id)
    if (cliente?.vendedorId) setVendedorId(cliente.vendedorId)
  }

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId || items.length === 0) return
    addPedido({ clienteId, vendedorId, fecha, items, observaciones: observaciones || undefined })
    router.push('/interno/pedidos')
  }

  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/interno/pedidos" className="text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Nuevo pedido</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">Completá los datos del pedido</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[oklch(0.25_0.06_240)]">Datos del pedido</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Cliente *</label>
              <select value={clienteId} onChange={e => onClienteChange(e.target.value)} required className={fieldClass}>
                <option value="">Seleccionar…</option>
                {data.clientes.filter(c => c.activo).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Vendedor *</label>
              <select
                value={vendedorId}
                onChange={e => setVendedorId(e.target.value)}
                disabled={usuario?.rol === 'vendedor'}
                className={fieldClass}
              >
                {data.vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={fieldClass} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[oklch(0.25_0.06_240)]">Productos</h2>

          <div className="border border-dashed border-[oklch(0.85_0.03_240)] rounded-lg p-4 space-y-3">
            <p className="text-xs font-medium text-[oklch(0.45_0.04_240)]">Agregar producto</p>
            <div className="grid grid-cols-3 gap-2">
              <select value={productoId} onChange={e => onProductoChange(e.target.value)} className={fieldClass}>
                <option value="">Producto…</option>
                {data.productos.filter(p => p.activo).map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              <input
                type="number"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                placeholder={unidadLabel}
                min="0"
                step="0.5"
                className={fieldClass}
              />
              <input
                type="number"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                placeholder="$/unidad"
                min="0"
                className={fieldClass}
              />
            </div>
            {selectedProduct && (
              <div className={`text-xs px-3 py-2 rounded ${stockActual === 0 ? 'bg-red-100 text-red-800' : stockInsuficiente ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                <span className="font-semibold">Stock actual: {stockActual.toFixed(2)} {unidadLabel.toLowerCase()}</span>
                {stockActual === 0 && <span> — ⚠️ SIN STOCK DISPONIBLE</span>}
                {stockInsuficiente && <span> — ⚠️ Stock insuficiente: solicitadas {cantidadNum.toFixed(2)}, disponibles {stockActual.toFixed(2)}</span>}
              </div>
            )}
            <button
              type="button"
              onClick={addItem}
              disabled={!productoId || !cantidad || !precio}
              className="text-sm bg-[oklch(0.92_0.04_240)] hover:bg-[oklch(0.85_0.05_240)] disabled:opacity-50 text-[oklch(0.35_0.10_240)] px-4 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Agregar
            </button>
          </div>

          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[oklch(0.97_0.01_240)] rounded-lg px-4 py-2.5 text-sm">
                  <span className="text-[oklch(0.3_0.06_240)]">{item.cantidad} × {item.productoNombre} — {formatPeso(item.precioUnitario)}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">{formatPeso(item.subtotal)}</span>
                    <button type="button" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}>
                      <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="text-right font-bold text-[oklch(0.25_0.06_240)] pr-4 pt-1">
                Total estimado: {formatPeso(total)}
              </div>
            </div>
          ) : (
            <p className="text-center py-6 text-sm text-[oklch(0.55_0.04_240)]">Agregá al menos un producto</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6">
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            rows={3}
            className={fieldClass}
            placeholder="Notas del pedido…"
          />
        </div>

        <div className="flex gap-3">
          <Link
            href="/interno/pedidos"
            className="flex-1 text-center border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-3 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)] transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!clienteId || items.length === 0}
            className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-50 text-white py-3 rounded-lg text-sm font-semibold transition-colors"
          >
            Crear pedido
          </button>
        </div>
      </form>
    </div>
  )
}
