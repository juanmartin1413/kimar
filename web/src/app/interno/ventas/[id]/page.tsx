'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useData } from '@/contexts/DataContext'
import { Cobranza, FormaPago, ItemVenta } from '@/lib/types'
import { formatPeso, today } from '@/lib/format'
import { generateId } from '@/lib/storage'
import { Trash2, ArrowLeft, AlertTriangle, Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type CobranzaDraft = {
  id: string
  fecha: string
  tipo: 'total' | 'parcial'
  monto: number
  formaPago: FormaPago
}

export default function EditarVentaPage() {
  const { data } = useData()
  const params = useParams()
  const ventaId = params.id as string

  const venta = data.ventas.find(v => v.id === ventaId)
  if (!venta) {
    return (
      <div className="text-center py-20">
        <p className="text-[oklch(0.5_0.04_240)]">Venta no encontrada</p>
        <Link href="/interno/ventas" className="text-[oklch(0.42_0.14_240)] hover:underline text-sm mt-2 inline-block">Volver a ventas</Link>
      </div>
    )
  }

  return <EditVentaForm ventaId={ventaId} />
}

function EditVentaForm({ ventaId }: { ventaId: string }) {
  const { data, updateVentaCompleta, getCalidadesDelProducto } = useData()
  const router = useRouter()
  const venta = data.ventas.find(v => v.id === ventaId)!

  // Existing cobradas (read-only)
  const cobradasExistentes = data.cobranzas.filter(c => c.ventaId === ventaId && c.estado === 'cobrado')
  const totalCobrado = cobradasExistentes.reduce((s, c) => s + c.monto, 0)

  // Init form with existing venta data
  const [clienteId, setClienteId] = useState(venta.clienteId)
  const [vendedorId, setVendedorId] = useState(venta.vendedorId)
  const [fechaEntrega, setFechaEntrega] = useState(venta.fechaEntrega)
  const [nroRemito, setNroRemito] = useState(venta.nroRemito ?? '')
  const [nroFactura, setNroFactura] = useState(venta.nroFactura ?? '')
  const [observaciones, setObservaciones] = useState(venta.observaciones ?? '')
  const [items, setItems] = useState<ItemVenta[]>(venta.items)

  // Init pending cobranzas as drafts
  const pendingCobs = data.cobranzas.filter(c => c.ventaId === ventaId && c.estado === 'pendiente')
  const [cobranzas, setCobranzas] = useState<CobranzaDraft[]>(
    pendingCobs.map(c => ({ id: c.id, fecha: c.fecha, tipo: 'parcial', monto: c.monto, formaPago: c.formaPago }))
  )

  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precio, setPrecio] = useState('')
  const [calidadId, setCalidadId] = useState('')
  const [showWarning, setShowWarning] = useState(false)

  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const totalNewCobranzas = cobranzas.reduce((s, c) => s + (c.tipo === 'total' ? total : c.monto), 0)
  const totalPlanCompleto = totalCobrado + totalNewCobranzas
  const selectedProduct = data.productos.find(p => p.id === productoId)
  const unidadLabel = selectedProduct?.unidad === 'unidad' ? 'Unidades' : 'Kg'
  const calidadesActivas = selectedProduct ? getCalidadesDelProducto(selectedProduct.id).filter(c => c.activo) : []
  const requiereCalidad = calidadesActivas.length > 1

  const itemsPendientesCalidad = items.filter(it => {
    if (it.calidadId) return false
    const activasProd = getCalidadesDelProducto(it.productoId).filter(c => c.activo)
    return activasProd.length > 1
  })

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

  function updateCobranzaDraft(id: string, changes: Partial<CobranzaDraft>) {
    setCobranzas(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c))
  }

  function removeCobranza(id: string) {
    setCobranzas(prev => prev.filter(c => c.id !== id))
  }

  function doSave() {
    const cobsInput: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[] = cobranzas.map(c => ({
      fecha: c.fecha,
      monto: c.tipo === 'total' ? total : c.monto,
      formaPago: c.formaPago,
      estado: 'pendiente' as const,
    }))
    updateVentaCompleta(
      ventaId,
      {
        clienteId,
        vendedorId,
        pedidoId: venta.pedidoId,
        fechaEntrega,
        nroRemito: nroRemito || undefined,
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

    if (cobranzas.length === 0 && totalCobrado < total) {
      setShowWarning(true)
      return
    }
    if (totalPlanCompleto < total) {
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
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Editar venta</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">Modificá los datos de la venta y el plan de cobro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Fecha entrega</label>
              <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">N° Remito</label>
              <input value={nroRemito} onChange={e => setNroRemito(e.target.value)} className={fieldClass} placeholder="Ej: 3520" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">N° Factura</label>
              <input value={nroFactura} onChange={e => setNroFactura(e.target.value)} className={fieldClass} placeholder="Ej: 245" />
            </div>
          </div>
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
              <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder={unidadLabel} min="0" step="0.5" className={fieldClass} />
              <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="$/unidad" min="0" className={fieldClass} />
            </div>
            {requiereCalidad && (
              <select value={calidadId} onChange={e => setCalidadId(e.target.value)} required className={fieldClass}>
                <option value="">Calidad… (uso interno)</option>
                {calidadesActivas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}
            <button type="button" onClick={addItem} disabled={!productoId || !cantidad || !precio || (requiereCalidad && !calidadId)} className="text-sm bg-[oklch(0.92_0.04_240)] hover:bg-[oklch(0.85_0.05_240)] disabled:opacity-50 text-[oklch(0.35_0.10_240)] px-4 py-1.5 rounded-lg font-medium transition-colors">
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
              {total > 0 && (
                <p className={cn('text-xs mt-0.5', totalPlanCompleto >= total ? 'text-green-600' : 'text-orange-500')}>
                  Cubierto: {formatPeso(totalPlanCompleto)} de {formatPeso(total)}
                </p>
              )}
            </div>
            <button type="button" onClick={addCobranza} className="text-xs text-[oklch(0.42_0.14_240)] hover:underline font-medium">
              + Agregar cuota
            </button>
          </div>

          {/* Cobradas existentes (read-only) */}
          {cobradasExistentes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-green-700 flex items-center gap-1"><Lock className="w-3 h-3" /> Cobranzas ya cobradas</p>
              {cobradasExistentes.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-2.5 text-sm border border-green-200">
                  <span className="text-green-800">{c.fecha} · {c.formaPago}</span>
                  <span className="font-semibold text-green-700 tabular-nums">{formatPeso(c.monto)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pending cobranzas (editable) */}
          {cobranzas.length === 0 && cobradasExistentes.length === 0 ? (
            <p className="text-center py-4 text-sm text-[oklch(0.55_0.04_240)]">Sin plan de cobro pendiente</p>
          ) : (
            <div className="space-y-3">
              {cobranzas.map(c => (
                <div key={c.id} className="border border-[oklch(0.9_0.01_240)] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex rounded-lg border border-[oklch(0.88_0.02_240)] overflow-hidden text-xs font-semibold">
                      <button type="button" onClick={() => updateCobranzaDraft(c.id, { tipo: 'total' })} className={cn('px-3 py-1.5 transition-colors', c.tipo === 'total' ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}>
                        Total {total > 0 && c.tipo === 'total' && `(${formatPeso(total)})`}
                      </button>
                      <button type="button" onClick={() => updateCobranzaDraft(c.id, { tipo: 'parcial' })} className={cn('px-3 py-1.5 transition-colors', c.tipo === 'parcial' ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}>
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
                      <input type="date" value={c.fecha} onChange={e => updateCobranzaDraft(c.id, { fecha: e.target.value })} className={fieldClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Monto</label>
                      {c.tipo === 'total' ? (
                        <div className={cn(fieldClass, 'bg-[oklch(0.96_0.01_240)] text-[oklch(0.45_0.04_240)] tabular-nums cursor-not-allowed')}>{total > 0 ? formatPeso(total) : '—'}</div>
                      ) : (
                        <input type="number" value={c.monto || ''} onChange={e => updateCobranzaDraft(c.id, { monto: parseFloat(e.target.value) || 0 })} placeholder="0" min="0" className={fieldClass} />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Forma de pago</label>
                      <select value={c.formaPago} onChange={e => updateCobranzaDraft(c.id, { formaPago: e.target.value as FormaPago })} className={fieldClass}>
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
          <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3} className={fieldClass} placeholder="Notas de la venta…" />
        </div>

        {/* Warning */}
        {showWarning && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-700">Plan de cobro incompleto</p>
                <p className="text-sm text-orange-600 mt-0.5">
                  El plan cubre {formatPeso(totalPlanCompleto)} de {formatPeso(total)}. Falta registrar {formatPeso(total - totalPlanCompleto)}.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowWarning(false)} className="flex-1 border border-orange-300 text-orange-700 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">
                Completar ahora
              </button>
              <button type="button" onClick={doSave} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                Guardar igual
              </button>
            </div>
          </div>
        )}

        {!showWarning && (
          <div className="flex gap-3">
            <Link href="/interno/ventas" className="flex-1 text-center border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-3 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)] transition-colors">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!clienteId || items.length === 0 || itemsPendientesCalidad.length > 0}
              title={itemsPendientesCalidad.length > 0 ? 'Hay ítems que requieren elegir una calidad' : undefined}
              className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-50 text-white py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
