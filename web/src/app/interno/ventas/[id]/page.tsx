'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { roundMoney } from '@/lib/facturacion'
import { ItemVenta } from '@/lib/types'
import { formatFecha, formatPeso, addDaysIso } from '@/lib/format'
import { esEnvioExterno, estadoEntregaConfig, formatFechaHora, medioEnvioLabels, parseApiError } from '@/lib/entregas'
import { generateId } from '@/lib/storage'
import { ComprobantesFiscales } from '@/components/interno/ComprobantesFiscales'
import { AdjuntosVenta } from '@/components/interno/AdjuntosVenta'
import { Trash2, ArrowLeft, AlertTriangle, Lock, Info } from 'lucide-react'
import Link from 'next/link'
import { EstadoCuentaCliente } from '@/components/interno/EstadoCuentaCliente'
import { EntregaPactada } from '@/components/interno/EntregaPactada'
import { AdjuntosPago } from '@/components/interno/AdjuntosPago'
import { cn } from '@/lib/utils'


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
  const { data, updateVentaCompleta, updateVentaDatos, getCalidadesDelProducto } = useData()
  const { isAdmin, canManageData } = useAuth()
  const router = useRouter()
  const venta = data.ventas.find(v => v.id === ventaId)!

  // Solo el administrador edita ítems, cliente, vendedor, fecha y entrega pactada.
  // El gestor conserva la edición de remito, factura y observaciones.
  const puedeEditarTodo = isAdmin && !venta.emitirFactura
  const [correccionFiscal, setCorreccionFiscal] = useState(false)
  const revisarPermiso = useCallback(() => {
    if (venta.emitirFactura && canManageData) api.get<{ editable: boolean }>('/api/facturacion/venta/' + ventaId + '/editable').then(r => setCorreccionFiscal(r.editable)).catch(() => setCorreccionFiscal(false))
  }, [venta.emitirFactura, ventaId, canManageData])
  useEffect(() => { revisarPermiso(); const timer = setInterval(revisarPermiso, 15000); return () => clearInterval(timer) }, [revisarPermiso])
  const puedeEditarProductos = puedeEditarTodo || (canManageData && correccionFiscal)

  // Cobradas: intocables (el backend también lo garantiza)
  const cobradasExistentes = data.cobranzas.filter(c => c.ventaId === ventaId && c.estado === 'cobrado')
  const totalCobrado = cobradasExistentes.reduce((s, c) => s + c.monto, 0)

  const [clienteId, setClienteId] = useState(venta.clienteId)
  const [vendedorId, setVendedorId] = useState(venta.vendedorId)
  const [fechaEntrega, setFechaEntrega] = useState(venta.fechaEntrega)
  const [horaEntregaDesde, setDesde] = useState(venta.horaEntregaDesde ?? '')
  const [horaEntregaHasta, setHasta] = useState(venta.horaEntregaHasta ?? '')
  const [nroRemito, setNroRemito] = useState(venta.nroRemito ?? '')
  const [nroFactura, setNroFactura] = useState(venta.nroFactura ?? '')
  const [observaciones, setObservaciones] = useState(venta.observaciones ?? '')
  const [items, setItems] = useState<ItemVenta[]>(venta.items)

  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precio, setPrecio] = useState('')
  const [calidadId, setCalidadId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const neto = items.reduce((s, i) => s + (venta.emitirFactura ? roundMoney(i.cantidad * i.precioUnitario) : i.subtotal), 0)
  const total = puedeEditarProductos ? neto + (venta.emitirFactura ? roundMoney(neto * 0.21) : 0) : venta.total
  const selectedProduct = data.productos.find(p => p.id === productoId)
  const unidadLabel = selectedProduct?.unidad === 'unidad' ? 'Unidades' : 'Kg'
  const calidadesActivas = selectedProduct ? getCalidadesDelProducto(selectedProduct.id).filter(c => c.activo) : []
  const requiereCalidad = calidadesActivas.length > 1

  const itemsPendientesCalidad = items.filter(it => {
    if (it.calidadId) return false
    const activasProd = getCalidadesDelProducto(it.productoId).filter(c => c.activo)
    return activasProd.length > 1
  })

  const firmaItems = (rows: ItemVenta[]) => JSON.stringify(rows.map(i =>
    JSON.stringify([i.productoId, i.calidadId ?? null, i.descripcion, i.cantidad, i.precioUnitario])
  ).sort())
  const itemsCambiaron = puedeEditarProductos && firmaItems(items) !== firmaItems(venta.items)

  // No se puede reducir el total por debajo de lo cobrado
  const bloqueoPlan = puedeEditarProductos && total < totalCobrado

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

  async function doSave() {
    if (!canManageData) return
    setSaving(true)
    setError('')
    try {
      if (puedeEditarProductos) {
        await updateVentaCompleta(ventaId, {
          clienteId,
          vendedorId,
          fechaEntrega, horaEntregaDesde, horaEntregaHasta,
          nroRemito: nroRemito || null,
          nroFactura: venta.emitirFactura ? venta.nroFactura ?? null : nroFactura || null,
          observaciones: observaciones || null,
          items: items.map(i => ({
            productoId: i.productoId,
            calidadId: i.calidadId ?? null,
            descripcion: i.descripcion,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
          })),
        })
      } else {
        await updateVentaDatos(ventaId, {
          nroRemito: nroRemito || undefined,
          nroFactura: venta.emitirFactura ? undefined : nroFactura || undefined,
          observaciones: observaciones || undefined,
        })
      }
      if (venta.emitirFactura) { setSaving(false); revisarPermiso() } else router.push('/interno/ventas')
    } catch (e) {
      setError(parseApiError(e, 'No se pudo guardar la venta.'))
      setSaving(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (puedeEditarProductos) {
      if (!clienteId || items.length === 0) return
      if (itemsPendientesCalidad.length > 0) return
      if (bloqueoPlan) return
      if (horaEntregaHasta && horaEntregaHasta <= horaEntregaDesde) { setError('Revisá el horario de entrega.'); return }
    }
    doSave()
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
  const readOnlyClass = "w-full border border-[oklch(0.92_0.01_240)] bg-[oklch(0.97_0.01_240)] rounded-lg px-3 py-2 text-sm text-[oklch(0.35_0.04_240)]"

  const clienteNombre = data.clientes.find(c => c.id === venta.clienteId)?.nombre ?? '—'
  const vendedorNombre = data.vendedores.find(v => v.id === venta.vendedorId)?.nombre ?? '—'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/interno/ventas" className="text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Editar venta</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">
            {puedeEditarProductos
              ? (correccionFiscal ? 'Ajustá los productos para emitir la factura de reemplazo' : 'Modificá los datos de la venta, los productos y el plan de cobro')
              : 'Modificá remito, factura y observaciones. Solo un administrador puede cambiar productos y plan de cobro.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos principales */}
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[oklch(0.25_0.06_240)]">Datos de la venta</h2>

          {/* Estado de entrega: lo manejan depósito y repartidor; acá es solo lectura */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[oklch(0.5_0.04_240)]">
            <span className={cn('font-semibold px-2.5 py-1 rounded-full', estadoEntregaConfig[venta.estadoEntrega ?? 'pendiente'].className)}>
              {estadoEntregaConfig[venta.estadoEntrega ?? 'pendiente'].label}
            </span>
            {esEnvioExterno(venta.medioEnvio) && <span>Envío por <span className="font-medium">{medioEnvioLabels[venta.medioEnvio]}</span></span>}
            {venta.repartidorNombre && <span>Repartidor: <span className="font-medium">{venta.repartidorNombre}</span></span>}
            {venta.fechaEntregado && <span>· Entregado el {formatFechaHora(venta.fechaEntregado)}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Cliente *</label>
              {puedeEditarTodo ? (
                <select disabled={totalCobrado > 0} value={clienteId} onChange={e => onClienteChange(e.target.value)} required className={fieldClass}>
                  <option value="">Seleccionar…</option>
                  {data.clientes.filter(c => c.activo || c.id === venta.clienteId).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              ) : (
                <div className={readOnlyClass}>{clienteNombre}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Vendedor *</label>
              {puedeEditarTodo ? (
                <select value={vendedorId} onChange={e => setVendedorId(e.target.value)} className={fieldClass}>
                  {data.vendedores.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre}</option>
                  ))}
                </select>
              ) : (
                <div className={readOnlyClass}>{vendedorNombre}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">N° Remito</label>
              <input disabled={!canManageData} value={nroRemito} onChange={e => setNroRemito(e.target.value)} className={fieldClass} placeholder="Ej: 3520" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">N° Factura</label>
              <input disabled={!canManageData || venta.emitirFactura} value={venta.emitirFactura ? (venta.nroFactura ?? '') : nroFactura} onChange={e => setNroFactura(e.target.value)} className={fieldClass} placeholder="Ej: 245" />
            </div>
          </div>
        </div>

        <EstadoCuentaCliente clienteId={clienteId} />
        <EntregaPactada disabled={!puedeEditarTodo} fecha={fechaEntrega} desde={horaEntregaDesde} hasta={horaEntregaHasta} onChange={(f,d,h) => { setFechaEntrega(f); setDesde(d); setHasta(h) }} />
        {venta.emitirFactura && <p className="rounded-lg bg-blue-50 p-3 text-sm">{correccionFiscal ? 'NC total autorizada: ajustá los productos, guardá los cambios y emití la factura de reemplazo al pie de esta página.' : 'Para corregir productos, emití una NC total por corrección fiscal y esperá su autorización.'}</p>}
        {/* Productos */}
        <div id="productos" className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[oklch(0.25_0.06_240)]">Productos</h2>
            {!puedeEditarProductos && (
              <span className="text-xs text-[oklch(0.5_0.04_240)] flex items-center gap-1"><Lock className="w-3 h-3" /> {venta.emitirFactura ? 'Requiere NC autorizada' : 'Solo administrador'}</span>
            )}
          </div>

          {puedeEditarProductos && (
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
          )}

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
                      {puedeEditarProductos ? <input aria-label={'Cantidad de ' + item.descripcion} type="number" min="0.01" step="0.01" required className="w-24 rounded border bg-white p-1 mr-2" value={item.cantidad} onChange={e => setItems(prev => prev.map(i => i.id === item.id ? { ...i, cantidad: Number(e.target.value), subtotal: Number(e.target.value) * i.precioUnitario } : i))} /> : item.cantidad} × {item.descripcion}{item.calidadNombre ? ` (${item.calidadNombre})` : ''}
                      <span className="text-xs text-[oklch(0.5_0.04_240)] ml-2">{formatPeso(item.precioUnitario)} c/u</span>
                      {pendienteCalidad && puedeEditarProductos && (
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
                      {puedeEditarProductos && (
                        <button type="button" onClick={() => setItems(p => p.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                        </button>
                      )}
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

          {itemsCambiaron && (
            <p className="text-xs text-[oklch(0.42_0.14_240)] flex items-center gap-1.5 bg-[oklch(0.96_0.02_240)] rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              Los cambios en los productos ajustan el stock automáticamente al guardar.
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="font-semibold">Compromiso de cobro</h2>
          <p>Plazo aplicado: {venta.diasPlazoPago ?? 15} días · Vencimiento: {fechaEntrega && formatFecha(addDaysIso(fechaEntrega, venta.diasPlazoPago ?? 15))}</p>
          <p>Cobrado: {formatPeso(totalCobrado)} · Saldo: {formatPeso(total - (venta.creditoAplicado ?? 0) - totalCobrado)}</p>
          {bloqueoPlan && <p className="text-red-700">El total no puede ser menor a lo ya cobrado.</p>}
          {cobradasExistentes.map(c => <div className="border-t pt-2" key={c.id}><p>{formatFecha(c.fechaCobro ?? c.fecha)} · {c.formaPago} · {formatPeso(c.monto)}</p>{canManageData && c.pagoId && <AdjuntosPago pagoId={c.pagoId} />}</div>)}
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6">
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Observaciones</label>
          <textarea disabled={!canManageData} value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3} className={fieldClass} placeholder="Notas de la venta…" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {canManageData && (
          <div className="flex gap-3">
            <Link href="/interno/ventas" className="flex-1 text-center border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-3 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)] transition-colors">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || (puedeEditarProductos && (!clienteId || items.length === 0 || itemsPendientesCalidad.length > 0 || bloqueoPlan))}
              title={itemsPendientesCalidad.length > 0 ? 'Hay ítems que requieren elegir una calidad' : undefined}
              className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-50 text-white py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </form>

      {canManageData && venta.emitirFactura && <ComprobantesFiscales ventaId={ventaId} onFiscalChange={revisarPermiso} cambiosSinGuardar={itemsCambiaron || saving} />}
      {/* Fuera del form: los documentos se suben/eliminan al instante, no al guardar la venta */}
      {canManageData && <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-[oklch(0.25_0.06_240)]">Documentos adjuntos</h2>
        <AdjuntosVenta ventaId={ventaId} />
      </div>}
    </div>
  )
}
