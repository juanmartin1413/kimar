'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { CompromisoProveedor, CreateFormaPagoPayload, CuotaProveedor, MetodoPagoProveedor, Proveedor } from '@/lib/types'
import { formatPeso, formatFecha, today } from '@/lib/format'
import { generateId } from '@/lib/storage'
import { Plus, Pencil, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function ProveedoresPage() {
  const {
    data, addProveedor, updateProveedor, addCompromisoProveedor, pagarCuotaProveedor,
    crearFormaPagoProveedor, getFormaPagoVigente, getHistorialFormaPago,
  } = useData()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Proveedor | null>(null)
  const [creatingCompromiso, setCreatingCompromiso] = useState<string | null>(null)
  const [creatingFormaPago, setCreatingFormaPago] = useState<string | null>(null)
  const [pagando, setPagando] = useState<{ compromisoId: string; cuota: CuotaProveedor } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const proveedoresActivos = data.proveedores.filter(p => p.activo)

  function getDeudaTotal(proveedorId: string): number {
    return data.compromisosProveedor
      .filter(c => c.proveedorId === proveedorId)
      .reduce((total, comp) => total + comp.cuotas.filter(cu => cu.estado === 'pendiente').reduce((s, cu) => s + cu.monto, 0), 0)
  }

  function getCuotasPendientes(proveedorId: string): number {
    return data.compromisosProveedor
      .filter(c => c.proveedorId === proveedorId)
      .reduce((total, comp) => total + comp.cuotas.filter(cu => cu.estado === 'pendiente').length, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Proveedores</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">{proveedoresActivos.length} proveedores activos</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo proveedor
        </button>
      </div>

      {/* Proveedores list */}
      <div className="space-y-3">
        {proveedoresActivos.length === 0 ? (
          <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-12 text-center text-[oklch(0.55_0.04_240)]">
            Sin proveedores registrados
          </div>
        ) : proveedoresActivos.map(prov => {
          const deuda = getDeudaTotal(prov.id)
          const cuotasPend = getCuotasPendientes(prov.id)
          const isExpanded = expanded === prov.id
          const compromisos = data.compromisosProveedor.filter(c => c.proveedorId === prov.id)

          return (
            <div key={prov.id} className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[oklch(0.98_0.005_240)] transition-colors"
                onClick={() => setExpanded(isExpanded ? null : prov.id)}
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-[oklch(0.5_0.04_240)]" /> : <ChevronRight className="w-4 h-4 text-[oklch(0.5_0.04_240)]" />}
                  <div>
                    <p className="font-semibold text-[oklch(0.2_0.06_240)]">{prov.nombre}</p>
                    <div className="flex items-center gap-3 text-xs text-[oklch(0.5_0.04_240)] mt-0.5">
                      {prov.telefono && <span>{prov.telefono}</span>}
                      {prov.email && <span>{prov.email}</span>}
                      {prov.direccion && <span>{prov.direccion}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {deuda > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-red-500 font-medium">{cuotasPend} cuota{cuotasPend !== 1 ? 's' : ''} pend.</p>
                      <p className="font-semibold text-red-600 tabular-nums">{formatPeso(deuda)}</p>
                    </div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setEditing(prov) }}
                    className="text-[oklch(0.55_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded: forma de pago + compromisos */}
              {isExpanded && (
                <div className="border-t border-[oklch(0.93_0.01_240)] px-5 py-4 space-y-4 bg-[oklch(0.98_0.005_240)]">
                  {/* Forma de pago negociada */}
                  <div className="bg-white rounded-lg border border-[oklch(0.9_0.01_240)] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[oklch(0.35_0.06_240)]">Forma de pago negociada</p>
                      <button
                        onClick={() => setCreatingFormaPago(prov.id)}
                        className="text-xs text-[oklch(0.42_0.14_240)] hover:underline font-medium"
                      >
                        {getFormaPagoVigente(prov.id) ? '+ Cambiar condición' : '+ Configurar'}
                      </button>
                    </div>
                    {(() => {
                      const vigente = getFormaPagoVigente(prov.id)
                      if (!vigente) return <p className="text-sm text-[oklch(0.55_0.04_240)] py-1">Sin forma de pago configurada — no se pueden registrar compras hasta configurarla.</p>
                      return (
                        <div className="space-y-1">
                          <p className="text-xs text-[oklch(0.5_0.04_240)]">Vigente desde {formatFecha(vigente.fechaDesde)}</p>
                          {vigente.tramos.map(t => (
                            <div key={t.id} className="flex items-center gap-3 text-sm bg-[oklch(0.97_0.01_240)] rounded-lg px-3 py-1.5">
                              <span className="font-semibold tabular-nums w-14">{t.porcentaje}%</span>
                              <span className="text-[oklch(0.45_0.04_240)]">a {t.diasPlazo} día{t.diasPlazo !== 1 ? 's' : ''}</span>
                              <span className="text-xs text-[oklch(0.5_0.04_240)] capitalize">{t.metodoPago}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    {getHistorialFormaPago(prov.id).length > 1 && (
                      <p className="text-xs text-[oklch(0.55_0.04_240)] pt-1">
                        {getHistorialFormaPago(prov.id).length - 1} condición(es) anterior(es) en el historial
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[oklch(0.35_0.06_240)]">Compromisos de pago</p>
                    <button
                      onClick={() => setCreatingCompromiso(prov.id)}
                      className="text-xs text-[oklch(0.42_0.14_240)] hover:underline font-medium"
                    >
                      + Nuevo compromiso
                    </button>
                  </div>

                  {compromisos.length === 0 ? (
                    <p className="text-sm text-[oklch(0.55_0.04_240)] py-2">Sin compromisos registrados</p>
                  ) : compromisos.map(comp => (
                    <div key={comp.id} className="bg-white rounded-lg border border-[oklch(0.9_0.01_240)] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[oklch(0.25_0.06_240)]">{comp.concepto}</p>
                        {comp.observaciones && <p className="text-xs text-[oklch(0.5_0.04_240)]">{comp.observaciones}</p>}
                      </div>
                      {/* Cuotas table */}
                      <div className="space-y-1.5">
                        {comp.cuotas.map(cu => (
                          <div key={cu.id} className={cn('flex items-center justify-between rounded-lg px-3 py-2 text-sm', cu.estado === 'pagado' ? 'bg-green-50' : 'bg-[oklch(0.97_0.01_240)]')}>
                            <div className="flex items-center gap-3">
                              <span className="text-[oklch(0.45_0.04_240)]">{formatFecha(cu.fecha)}</span>
                              <span className="text-xs text-[oklch(0.5_0.04_240)]">{cu.formaPago}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn('font-semibold tabular-nums', cu.estado === 'pagado' ? 'text-green-600' : 'text-[oklch(0.25_0.06_240)]')}>{formatPeso(cu.monto)}</span>
                              {cu.estado === 'pendiente' ? (
                                <button
                                  onClick={() => setPagando({ compromisoId: comp.id, cuota: cu })}
                                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Pagar
                                </button>
                              ) : (
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ Pagado{cu.montoPagado != null && cu.montoPagado !== cu.monto ? ` (${formatPeso(cu.montoPagado)})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create proveedor */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo proveedor</DialogTitle></DialogHeader>
          <ProveedorForm onSave={vals => { addProveedor(vals); setCreating(false) }} onCancel={() => setCreating(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit proveedor */}
      <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar proveedor</DialogTitle></DialogHeader>
          {editing && (
            <ProveedorForm
              initial={editing}
              onSave={vals => { updateProveedor(editing.id, vals); setEditing(null) }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create compromiso */}
      <Dialog open={!!creatingCompromiso} onOpenChange={open => { if (!open) setCreatingCompromiso(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo compromiso de pago</DialogTitle></DialogHeader>
          {creatingCompromiso && (
            <CompromisoForm
              proveedorId={creatingCompromiso}
              onSave={vals => { addCompromisoProveedor(vals); setCreatingCompromiso(null) }}
              onCancel={() => setCreatingCompromiso(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create/cambiar forma de pago */}
      <Dialog open={!!creatingFormaPago} onOpenChange={open => { if (!open) setCreatingFormaPago(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Forma de pago negociada</DialogTitle></DialogHeader>
          {creatingFormaPago && (
            <FormaPagoForm
              onSave={async vals => { await crearFormaPagoProveedor(creatingFormaPago, vals); setCreatingFormaPago(null) }}
              onCancel={() => setCreatingFormaPago(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Pagar cuota */}
      <Dialog open={!!pagando} onOpenChange={open => { if (!open) setPagando(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Registrar pago de cuota</DialogTitle></DialogHeader>
          {pagando && (
            <PagarCuotaForm
              cuota={pagando.cuota}
              onSave={async vals => { await pagarCuotaProveedor(pagando.compromisoId, pagando.cuota.id, vals); setPagando(null) }}
              onCancel={() => setPagando(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Proveedor Form ---
function ProveedorForm({ initial, onSave, onCancel }: {
  initial?: Proveedor
  onSave: (vals: { nombre: string; telefono?: string; email?: string; direccion?: string }) => void
  onCancel: () => void
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [telefono, setTelefono] = useState(initial?.telefono ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [direccion, setDireccion] = useState(initial?.direccion ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ nombre, telefono: telefono || undefined, email: email || undefined, direccion: direccion || undefined })
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Nombre *</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} required className={fieldClass} placeholder="Nombre del proveedor" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Teléfono</label>
          <input value={telefono} onChange={e => setTelefono(e.target.value)} className={fieldClass} placeholder="Opcional" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={fieldClass} placeholder="Opcional" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Dirección</label>
        <input value={direccion} onChange={e => setDireccion(e.target.value)} className={fieldClass} placeholder="Opcional" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)]">Cancelar</button>
        <button type="submit" className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white py-2.5 rounded-lg text-sm font-semibold">{initial ? 'Guardar' : 'Crear'}</button>
      </div>
    </form>
  )
}

// --- Compromiso Form ---
function CompromisoForm({ proveedorId, onSave, onCancel }: {
  proveedorId: string
  onSave: (vals: Omit<CompromisoProveedor, 'id' | 'fechaCreacion'>) => void
  onCancel: () => void
}) {
  const [concepto, setConcepto] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [cuotas, setCuotas] = useState<{ id: string; fecha: string; monto: string; formaPago: MetodoPagoProveedor }[]>([
    { id: generateId(), fecha: today(), monto: '', formaPago: 'transferencia' }
  ])

  function addCuota() {
    setCuotas(prev => [...prev, { id: generateId(), fecha: today(), monto: '', formaPago: 'transferencia' }])
  }

  function updateCuota(id: string, changes: Partial<typeof cuotas[0]>) {
    setCuotas(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c))
  }

  function removeCuota(id: string) {
    setCuotas(prev => prev.filter(c => c.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cuotasFinales: CuotaProveedor[] = cuotas.map(c => ({
      id: c.id,
      fecha: c.fecha,
      monto: parseFloat(c.monto) || 0,
      formaPago: c.formaPago,
      estado: 'pendiente',
    }))
    onSave({ proveedorId, concepto, cuotas: cuotasFinales, observaciones: observaciones || undefined })
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
  const totalComp = cuotas.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Concepto *</label>
        <input value={concepto} onChange={e => setConcepto(e.target.value)} required className={fieldClass} placeholder="Ej: Compra mercadería junio" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Observaciones</label>
        <input value={observaciones} onChange={e => setObservaciones(e.target.value)} className={fieldClass} placeholder="Opcional" />
      </div>

      {/* Cuotas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[oklch(0.35_0.06_240)]">Cuotas ({cuotas.length}) — Total: {formatPeso(totalComp)}</p>
          <button type="button" onClick={addCuota} className="text-xs text-[oklch(0.42_0.14_240)] hover:underline font-medium">+ Agregar cuota</button>
        </div>
        {cuotas.map(c => (
          <div key={c.id} className="grid grid-cols-4 gap-2 items-end">
            <div>
              <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Fecha</label>
              <input type="date" value={c.fecha} onChange={e => updateCuota(c.id, { fecha: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Monto</label>
              <input type="number" value={c.monto} onChange={e => updateCuota(c.id, { monto: e.target.value })} min="0" className={fieldClass} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Forma</label>
              <select value={c.formaPago} onChange={e => updateCuota(c.id, { formaPago: e.target.value as MetodoPagoProveedor })} className={fieldClass}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="echeq">Echeq</option>
              </select>
            </div>
            <button type="button" onClick={() => removeCuota(c.id)} className="text-xs text-red-400 hover:text-red-600 py-2">Quitar</button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)]">Cancelar</button>
        <button type="submit" disabled={!concepto || cuotas.length === 0} className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold">Crear compromiso</button>
      </div>
    </form>
  )
}

// --- Forma de Pago Form ---
function FormaPagoForm({ onSave, onCancel }: {
  onSave: (vals: CreateFormaPagoPayload) => void | Promise<void>
  onCancel: () => void
}) {
  const [fechaDesde, setFechaDesde] = useState(today())
  const [observaciones, setObservaciones] = useState('')
  const [tramos, setTramos] = useState<{ id: string; porcentaje: string; diasPlazo: string; metodoPago: MetodoPagoProveedor }[]>([
    { id: generateId(), porcentaje: '100', diasPlazo: '0', metodoPago: 'transferencia' }
  ])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function addTramo() {
    setTramos(prev => [...prev, { id: generateId(), porcentaje: '', diasPlazo: '0', metodoPago: 'transferencia' }])
  }

  function updateTramo(id: string, changes: Partial<typeof tramos[0]>) {
    setTramos(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))
  }

  function removeTramo(id: string) {
    setTramos(prev => prev.filter(t => t.id !== id))
  }

  const sumaPorcentajes = tramos.reduce((s, t) => s + (parseFloat(t.porcentaje) || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sumaPorcentajes !== 100) {
      setError(`La suma de los porcentajes debe ser 100 (actual: ${sumaPorcentajes})`)
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave({
        fechaDesde,
        observaciones: observaciones || undefined,
        tramos: tramos.map((t, i) => ({
          orden: i + 1,
          porcentaje: parseFloat(t.porcentaje) || 0,
          diasPlazo: parseInt(t.diasPlazo, 10) || 0,
          metodoPago: t.metodoPago,
        })),
      })
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-[oklch(0.5_0.04_240)]">
        Los días de cada tramo corren desde la fecha de recepción de la mercadería. Al crearla, la condición anterior (si existe) queda en el historial.
      </p>
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Vigente desde *</label>
        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} required className={fieldClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Observaciones</label>
        <input value={observaciones} onChange={e => setObservaciones(e.target.value)} className={fieldClass} placeholder="Opcional" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className={cn('text-xs font-medium', sumaPorcentajes === 100 ? 'text-[oklch(0.35_0.06_240)]' : 'text-red-500')}>
            Tramos ({tramos.length}) — Suma: {sumaPorcentajes}%
          </p>
          <button type="button" onClick={addTramo} className="text-xs text-[oklch(0.42_0.14_240)] hover:underline font-medium">+ Agregar tramo</button>
        </div>
        {tramos.map(t => (
          <div key={t.id} className="grid grid-cols-4 gap-2 items-end">
            <div>
              <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">% del total</label>
              <input type="number" value={t.porcentaje} onChange={e => updateTramo(t.id, { porcentaje: e.target.value })} min="0" max="100" className={fieldClass} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Días de plazo</label>
              <input type="number" value={t.diasPlazo} onChange={e => updateTramo(t.id, { diasPlazo: e.target.value })} min="0" className={fieldClass} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-[oklch(0.5_0.04_240)] mb-0.5">Método</label>
              <select value={t.metodoPago} onChange={e => updateTramo(t.id, { metodoPago: e.target.value as MetodoPagoProveedor })} className={fieldClass}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="echeq">Echeq</option>
              </select>
            </div>
            <button type="button" onClick={() => removeTramo(t.id)} className="text-xs text-red-400 hover:text-red-600 py-2">Quitar</button>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)]">Cancelar</button>
        <button type="submit" disabled={saving || tramos.length === 0} className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// --- Pagar Cuota Form ---
function PagarCuotaForm({ cuota, onSave, onCancel }: {
  cuota: CuotaProveedor
  onSave: (vals: { montoPagado: number; formaPagoReal: MetodoPagoProveedor }) => void | Promise<void>
  onCancel: () => void
}) {
  const [montoPagado, setMontoPagado] = useState(String(cuota.monto))
  const [formaPagoReal, setFormaPagoReal] = useState<MetodoPagoProveedor>(cuota.formaPago)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ montoPagado: parseFloat(montoPagado) || cuota.monto, formaPagoReal })
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-[oklch(0.5_0.04_240)]">Pactado: {formatPeso(cuota.monto)} por {cuota.formaPago}, vencía el {formatFecha(cuota.fecha)}.</p>
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Monto pagado *</label>
        <input type="number" value={montoPagado} onChange={e => setMontoPagado(e.target.value)} min="0" required className={fieldClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Forma de pago real</label>
        <select value={formaPagoReal} onChange={e => setFormaPagoReal(e.target.value as MetodoPagoProveedor)} className={fieldClass}>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="echeq">Echeq</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)]">Cancelar</button>
        <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold">
          {saving ? 'Guardando...' : 'Confirmar pago'}
        </button>
      </div>
    </form>
  )
}
