'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { CompromisoProveedor, CuotaProveedor, FormaPago, Proveedor } from '@/lib/types'
import { formatPeso, formatFecha, today } from '@/lib/format'
import { generateId } from '@/lib/storage'
import { Plus, Pencil, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function ProveedoresPage() {
  const { data, addProveedor, updateProveedor, addCompromisoProveedor, pagarCuotaProveedor } = useData()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Proveedor | null>(null)
  const [creatingCompromiso, setCreatingCompromiso] = useState<string | null>(null)
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

              {/* Expanded: compromisos */}
              {isExpanded && (
                <div className="border-t border-[oklch(0.93_0.01_240)] px-5 py-4 space-y-4 bg-[oklch(0.98_0.005_240)]">
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
                                  onClick={() => pagarCuotaProveedor(comp.id, cu.id)}
                                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Pagar
                                </button>
                              ) : (
                                <span className="text-xs text-green-600 font-medium">✓ Pagado</span>
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
  const [cuotas, setCuotas] = useState<{ id: string; fecha: string; monto: string; formaPago: FormaPago }[]>([
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
              <select value={c.formaPago} onChange={e => updateCuota(c.id, { formaPago: e.target.value as FormaPago })} className={fieldClass}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
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
