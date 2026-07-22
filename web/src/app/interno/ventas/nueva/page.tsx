'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useData } from '@/contexts/DataContext'
import { Cobranza, FormaPago, ItemVenta } from '@/lib/types'
import { formatPeso, formatFecha, today } from '@/lib/format'
import { generateId } from '@/lib/storage'
import { Trash2, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type CobranzaDraft = {
  id: string
  fecha: string
  tipo: 'total' | 'parcial'
  monto: number
  formaPago: FormaPago
}

export default function NuevaVentaPage() {
  const { data, addVenta, getStockActual, getStockTotal, getCalidadesDelProducto } = useData()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [clienteId, setClienteId] = useState('')
  const [vendedorId, setVendedorId] = useState(data.vendedores[0]?.id ?? '')
  const [pedidoId, setPedidoId] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState(today())
  const [nroFactura, setNroFactura] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [items, setItems] = useState<ItemVenta[]>([])
  const [cobranzas, setCobranzas] = useState<CobranzaDraft[]>([
    { id: generateId(), fecha: today(), tipo: 'total', monto: 0, formaPago: 'efectivo' }
  ])
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precio, setPrecio] = useState('')
  const [calidadId, setCalidadId] = useState('')
  const [showWarning, setShowWarning] = useState(false)

  // Auto-select pedido from URL query param
  useEffect(() => {
    const pid = searchParams.get('pedidoId')
    if (pid && !pedidoId) {
      onPedidoSelect(pid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const totalCobranzas = cobranzas.reduce((s, c) => s + (c.tipo === 'total' ? total : c.monto), 0)
  const pendingPedidos = data.pedidos.filter(p => p.estado === 'pendiente')
  const selectedProduct = data.productos.find(p => p.id === productoId)
  const unidadLabel = selectedProduct?.unidad === 'unidad' ? 'Unidades' : 'Kg'
  const selectedCliente = data.clientes.find(c => c.id === clienteId)
  const selectedVendedor = data.vendedores.find(v => v.id === vendedorId)
  const calidadesActivas = selectedProduct ? getCalidadesDelProducto(selectedProduct.id).filter(c => c.activo) : []
  const requiereCalidad = calidadesActivas.length > 1
  const stockActual = selectedProduct
    ? (calidadId ? getStockActual(selectedProduct.id, calidadId) : getStockTotal(selectedProduct.id))
    : 0
  const cantidadNum = cantidad ? parseFloat(cantidad) : 0
  const stockInsuficiente = cantidadNum > stockActual && stockActual > 0

  // Ítems importados de un pedido cuyo producto exige elegir calidad y todavía no la tienen:
  // no se pueden guardar así, hay que quitarlos y volver a agregarlos eligiendo la calidad.
  const itemsPendientesCalidad = items.filter(it => {
    if (it.calidadId) return false
    const activasProd = getCalidadesDelProducto(it.productoId).filter(c => c.activo)
    return activasProd.length > 1
  })

  // Autoselección silenciosa cuando el producto elegido tiene exactamente 1 calidad activa
  useEffect(() => {
    if (calidadesActivas.length === 1) setCalidadId(calidadesActivas[0].id)
    else setCalidadId('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId])

  function onClienteChange(id: string) {
    setClienteId(id)
    const cliente = data.clientes.find(c => c.id === id)
    if (cliente?.vendedorId) setVendedorId(cliente.vendedorId)
  }

  function onPedidoSelect(pid: string) {
    setPedidoId(pid)
    const p = data.pedidos.find(x => x.id === pid)
    if (!p) return
    setClienteId(p.clienteId)
    setVendedorId(p.vendedorId)
    setItems(p.items.map(i => ({ ...i, descripcion: i.productoNombre })))
  }

  function onProductoChange(id: string) {
    setProductoId(id)
    const prod = data.productos.find(p => p.id === id)
    if (prod) setPrecio(String(prod.precioKg))
  }

  function addItem() {
    const prod = data.productos.find(p => p.id === productoId)
    if (!prod || !cantidad || !precio) return
    if (requiereCalidad && !calidadId) return
    const qty = parseFloat(cantidad)
    const pr = parseFloat(precio)
    const calidad = calidadesActivas.find(c => c.id === calidadId)
    setItems(prev => [...prev, {
      id: generateId(),
      productoId: prod.id,
      calidadId: calidadId || undefined,
      calidadNombre: calidad?.nombre,
      descripcion: prod.nombre,
      cantidad: qty,
      precioUnitario: pr,
      subtotal: qty * pr,
    }])
    setProductoId('')
    setCantidad('')
    setPrecio('')
    setCalidadId('')
  }

  function setItemCalidad(itemId: string, calidadIdElegida: string) {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it
      const calidad = getCalidadesDelProducto(it.productoId).find(c => c.id === calidadIdElegida)
      return { ...it, calidadId: calidadIdElegida || undefined, calidadNombre: calidad?.nombre }
    }))
  }

  function addCobranza() {
    setCobranzas(prev => [
      ...prev,
      { id: generateId(), fecha: today(), tipo: 'parcial', monto: 0, formaPago: 'efectivo' }
    ])
  }

  function updateCobranza(id: string, changes: Partial<CobranzaDraft>) {
    setCobranzas(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c))
  }

  function removeCobranza(id: string) {
    setCobranzas(prev => prev.filter(c => c.id !== id))
  }

  async function doSave() {
    const cobsInput: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[] = cobranzas.map(c => ({
      fecha: c.fecha,
      monto: c.tipo === 'total' ? total : c.monto,
      formaPago: c.formaPago,
      estado: 'pendiente' as const,
    }))

    await addVenta(
      {
        clienteId,
        vendedorId,
        pedidoId: pedidoId || undefined,
        fechaEntrega,
        nroFactura: nroFactura || undefined,
        items,
        total,
        observaciones: observaciones || undefined,
      },
      cobsInput
    )

    router.push('/interno/ventas')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId || items.length === 0) return
    if (itemsPendientesCalidad.length > 0) return

    const planTotal = cobranzas.reduce((s, c) => s + (c.tipo === 'total' ? total : c.monto), 0)
    if (cobranzas.length === 0 || planTotal < total) {
      setShowWarning(true)
      return
    }
    doSave()
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/interno/ventas" className="text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Registrar venta</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">Completá los datos de la venta y el plan de cobro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pedido base */}
        {pendingPedidos.length > 0 && (
          <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6">
            <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Basarse en un pedido (opcional)</label>
            <select value={pedidoId} onChange={e => onPedidoSelect(e.target.value)} className={fieldClass}>
              <option value="">Sin pedido de origen</option>
              {pendingPedidos.map(p => {
                const cl = data.clientes.find(c => c.id === p.clienteId)
                return <option key={p.id} value={p.id}>{cl?.nombre} — {formatFecha(p.fecha)}</option>
              })}
            </select>
          </div>
        )}

        {/* Datos principales */}
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[oklch(0.25_0.06_240)]">Datos de la venta</h2>

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
              <select value={vendedorId} onChange={e => setVendedorId(e.target.value)} className={fieldClass}>
                {data.vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {(selectedCliente || selectedVendedor) && (
            <div className="bg-[oklch(0.96_0.02_240)] rounded-lg px-4 py-2.5 text-sm text-[oklch(0.35_0.08_240)]">
              {selectedCliente && <span className="font-medium">{selectedCliente.nombre}</span>}
              {selectedCliente && selectedVendedor && <span className="text-[oklch(0.55_0.04_240)]"> · </span>}
              {selectedVendedor && <span>Vendedor: <span className="font-medium">{selectedVendedor.nombre}</span></span>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Fecha entrega</label>
              <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">N° Factura</label>
              <input value={nroFactura} onChange={e => setNroFactura(e.target.value)} className={fieldClass} placeholder="Ej: 245" />
            </div>
          </div>
          <p className="text-xs text-[oklch(0.55_0.04_240)] -mt-2">
            El N° de remito se asigna automáticamente al guardar la venta.
          </p>
        </div>

        {/* Productos */}
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
            {requiereCalidad && (
              <select value={calidadId} onChange={e => setCalidadId(e.target.value)} required className={fieldClass}>
                <option value="">Calidad… (uso interno)</option>
                {calidadesActivas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}
            {selectedProduct && (
              <div className={`text-xs px-3 py-2 rounded ${stockActual === 0 ? 'bg-red-100 text-red-800' : stockInsuficiente ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                <span className="font-semibold">Stock {calidadId ? 'de esta calidad' : 'actual'}: {stockActual.toFixed(2)} {unidadLabel.toLowerCase()}</span>
                {stockActual === 0 && <span> — ⚠️ SIN STOCK DISPONIBLE</span>}
                {stockInsuficiente && <span> — ⚠️ Stock insuficiente: solicitadas {cantidadNum.toFixed(2)}, disponibles {stockActual.toFixed(2)}</span>}
              </div>
            )}
            <button
              type="button"
              onClick={addItem}
              disabled={!productoId || !cantidad || !precio || (requiereCalidad && !calidadId)}
              className="text-sm bg-[oklch(0.92_0.04_240)] hover:bg-[oklch(0.85_0.05_240)] disabled:opacity-50 text-[oklch(0.35_0.10_240)] px-4 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Agregar
            </button>
          </div>

          {items.length > 0 ? (
            <div className="space-y-1.5">
              {items.map((item, idx) => {
                const pendienteCalidad = itemsPendientesCalidad.some(p => p.id === item.id)
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-4 py-2 text-sm',
                      pendienteCalidad ? 'bg-orange-100' : 'bg-[oklch(0.97_0.01_240)]'
                    )}
                  >
                    <span className="flex-1">
                      {item.cantidad} × {item.descripcion}{item.calidadNombre ? ` (${item.calidadNombre})` : ''}
                      {pendienteCalidad && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-orange-700 font-medium whitespace-nowrap">⚠️ Elegí la calidad:</span>
                          <select
                            value=""
                            onChange={e => setItemCalidad(item.id, e.target.value)}
                            className="text-xs border border-orange-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="">Calidad…</option>
                            {getCalidadesDelProducto(item.productoId).filter(c => c.activo).map(c => (
                              <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">{formatPeso(item.subtotal)}</span>
                      <button type="button" onClick={() => setItems(p => p.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                )
              })}
              <div className="text-right font-bold text-[oklch(0.25_0.06_240)] pr-4 pt-1">
                Total: {formatPeso(total)}
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-sm text-[oklch(0.55_0.04_240)]">Agregá al menos un producto</p>
          )}
        </div>

        {/* Plan de cobro */}
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[oklch(0.25_0.06_240)]">Plan de cobro</h2>
              {cobranzas.length > 0 && total > 0 && (
                <p className={cn('text-xs mt-0.5', totalCobranzas >= total ? 'text-green-600' : 'text-orange-500')}>
                  Cubierto: {formatPeso(totalCobranzas)} de {formatPeso(total)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={addCobranza}
              className="text-xs text-[oklch(0.42_0.14_240)] hover:underline font-medium"
            >
              + Agregar cuota
            </button>
          </div>

          {cobranzas.length === 0 ? (
            <p className="text-center py-4 text-sm text-[oklch(0.55_0.04_240)]">Sin plan de cobro — podés agregarlo luego desde Cobranzas</p>
          ) : (
            <div className="space-y-3">
              {cobranzas.map(c => (
                <div key={c.id} className="border border-[oklch(0.9_0.01_240)] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Total / Parcial toggle */}
                    <div className="flex rounded-lg border border-[oklch(0.88_0.02_240)] overflow-hidden text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => updateCobranza(c.id, { tipo: 'total' })}
                        className={cn('px-3 py-1.5 transition-colors', c.tipo === 'total' ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}
                      >
                        Total {total > 0 && c.tipo === 'total' && `(${formatPeso(total)})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCobranza(c.id, { tipo: 'parcial' })}
                        className={cn('px-3 py-1.5 transition-colors', c.tipo === 'parcial' ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}
                      >
                        Parcial
                      </button>
                    </div>
                    <button type="button" onClick={() => removeCobranza(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Fecha cobro</label>
                      <input
                        type="date"
                        value={c.fecha}
                        onChange={e => updateCobranza(c.id, { fecha: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Monto</label>
                      {c.tipo === 'total' ? (
                        <div className={cn(fieldClass, 'bg-[oklch(0.96_0.01_240)] text-[oklch(0.45_0.04_240)] tabular-nums cursor-not-allowed')}>
                          {total > 0 ? formatPeso(total) : '—'}
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={c.monto || ''}
                          onChange={e => updateCobranza(c.id, { monto: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          min="0"
                          className={fieldClass}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Forma de pago</label>
                      <select
                        value={c.formaPago}
                        onChange={e => updateCobranza(c.id, { formaPago: e.target.value as FormaPago })}
                        className={fieldClass}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6">
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            rows={3}
            className={fieldClass}
            placeholder="Notas de la venta…"
          />
        </div>

        {/* Warning banner */}
        {showWarning && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-700">Plan de cobro incompleto</p>
                <p className="text-sm text-orange-600 mt-0.5">
                  {cobranzas.length === 0
                    ? 'No registraste ningún plan de cobro para esta venta.'
                    : `El plan cubre ${formatPeso(totalCobranzas)} de ${formatPeso(total)}. Falta registrar ${formatPeso(total - totalCobranzas)}.`
                  }
                  {' '}Podés completarlo ahora o registrar el resto desde el módulo de Cobranzas.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowWarning(false)}
                className="flex-1 border border-orange-300 text-orange-700 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
              >
                Completar ahora
              </button>
              <button
                type="button"
                onClick={doSave}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Registrar igual
              </button>
            </div>
          </div>
        )}

        {!showWarning && (
          <div className="flex gap-3">
            <Link
              href="/interno/ventas"
              className="flex-1 text-center border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-3 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)] transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!clienteId || items.length === 0 || itemsPendientesCalidad.length > 0}
              title={itemsPendientesCalidad.length > 0 ? 'Hay ítems que requieren elegir una calidad' : undefined}
              className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-50 text-white py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              Registrar venta
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
