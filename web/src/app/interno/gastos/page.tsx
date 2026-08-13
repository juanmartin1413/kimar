'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { GastoFijo, InstanciaGasto, TipoGasto } from '@/lib/types'
import { formatPeso, formatFecha } from '@/lib/format'
import { Plus, Pencil, CheckCircle, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function GastosPage() {
  const { data, addGastoFijo, updateGastoFijo, deleteGastoFijo, generarInstanciasMensuales, pagarInstanciaGasto, updateInstanciaGasto } = useData()
  const [tab, setTab] = useState<'definidos' | 'instancias'>('instancias')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<GastoFijo | null>(null)
  const [editingInst, setEditingInst] = useState<InstanciaGasto | null>(null)

  const now = new Date()
  const [mesSel, setMesSel] = useState(now.getMonth() + 1)
  const [anioSel, setAnioSel] = useState(now.getFullYear())

  const instanciasMes = data.instanciasGasto.filter(i => i.mes === mesSel && i.anio === anioSel)
  const totalMes = instanciasMes.reduce((s, i) => s + i.monto, 0)
  const totalPagado = instanciasMes.filter(i => i.pagado).reduce((s, i) => s + i.monto, 0)

  function handleGenerarMes() {
    generarInstanciasMensuales(mesSel, anioSel)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Gastos Fijos</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">Gestión de gastos mensuales y ocasionales</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo gasto
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('instancias')} className={cn('px-4 py-1.5 rounded-full text-sm font-medium border transition-colors', tab === 'instancias' ? 'bg-[oklch(0.42_0.14_240)] text-white border-transparent' : 'border-[oklch(0.88_0.02_240)] text-[oklch(0.45_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}>
          Instancias del mes
        </button>
        <button onClick={() => setTab('definidos')} className={cn('px-4 py-1.5 rounded-full text-sm font-medium border transition-colors', tab === 'definidos' ? 'bg-[oklch(0.42_0.14_240)] text-white border-transparent' : 'border-[oklch(0.88_0.02_240)] text-[oklch(0.45_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}>
          Gastos definidos
        </button>
      </div>

      {tab === 'instancias' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[oklch(0.5_0.04_240)]" />
              <select value={mesSel} onChange={e => setMesSel(Number(e.target.value))} className="border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-1.5 text-sm">
                {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select value={anioSel} onChange={e => setAnioSel(Number(e.target.value))} className="border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-1.5 text-sm">
                {[2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <button onClick={handleGenerarMes} className="text-xs text-[oklch(0.42_0.14_240)] hover:underline font-medium">
              Generar pendientes
            </button>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <span className="text-[oklch(0.5_0.04_240)]">Total: <span className="font-semibold text-[oklch(0.25_0.06_240)]">{formatPeso(totalMes)}</span></span>
              <span className="text-green-600">Pagado: <span className="font-semibold">{formatPeso(totalPagado)}</span></span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.9_0.01_240)]">
                  <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Gasto</th>
                  <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Monto</th>
                  <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Vencimiento</th>
                  <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Fecha pago</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {instanciasMes.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-[oklch(0.55_0.04_240)]">Sin instancias para este mes</td></tr>
                ) : instanciasMes.map(inst => {
                  const gasto = data.gastosFijos.find(g => g.id === inst.gastoFijoId)
                  return (
                    <tr key={inst.id} className="border-b border-[oklch(0.93_0.01_240)] hover:bg-[oklch(0.98_0.005_240)]">
                      <td className="py-3 px-4">
                        <p className="font-medium text-[oklch(0.25_0.06_240)]">{gasto?.nombre ?? '—'}</p>
                        {gasto?.descripcion && <p className="text-xs text-[oklch(0.5_0.04_240)]">{gasto.descripcion}</p>}
                      </td>
                      <td className="py-3 px-4 font-semibold tabular-nums">{formatPeso(inst.monto)}</td>
                      <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{inst.fechaVencimiento ? formatFecha(inst.fechaVencimiento) : '—'}</td>
                      <td className="py-3 px-4">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', inst.pagado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                          {inst.pagado ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{inst.fechaPago ? formatFecha(inst.fechaPago) : '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingInst(inst)} className="text-[oklch(0.55_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!inst.pagado && (
                            <button onClick={() => pagarInstanciaGasto(inst.id)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium transition-colors">
                              <CheckCircle className="w-4 h-4" /> Pagar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'definidos' && (
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.9_0.01_240)]">
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Descripción</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Monto</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Tipo</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Día pago</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Estado</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {data.gastosFijos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[oklch(0.55_0.04_240)]">Sin gastos definidos</td></tr>
              ) : data.gastosFijos.map(g => (
                <tr key={g.id} className={cn('border-b border-[oklch(0.93_0.01_240)] hover:bg-[oklch(0.98_0.005_240)]', !g.activo && 'opacity-50')}>
                  <td className="py-3 px-4 font-medium text-[oklch(0.25_0.06_240)]">{g.nombre}</td>
                  <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{g.descripcion ?? '—'}</td>
                  <td className="py-3 px-4 font-semibold tabular-nums">{formatPeso(g.monto)}</td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', g.tipo === 'mensual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
                      {g.tipo === 'mensual' ? 'MENSUAL' : 'OCASIONAL'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{g.diaPago ? `Día ${g.diaPago}` : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', g.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {g.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(g)} className="text-[oklch(0.55_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {g.activo && (
                        <button onClick={() => deleteGastoFijo(g.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo gasto fijo</DialogTitle></DialogHeader>
          <GastoForm onSave={vals => { addGastoFijo(vals); setCreating(false) }} onCancel={() => setCreating(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar gasto fijo</DialogTitle></DialogHeader>
          {editing && (
            <GastoForm initial={editing} onSave={vals => { updateGastoFijo(editing.id, vals); setEditing(null) }} onCancel={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingInst} onOpenChange={open => { if (!open) setEditingInst(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Editar instancia</DialogTitle></DialogHeader>
          {editingInst && (
            <InstanciaForm initial={editingInst} onSave={vals => { updateInstanciaGasto(editingInst.id, vals); setEditingInst(null) }} onCancel={() => setEditingInst(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GastoForm({ initial, onSave, onCancel }: {
  initial?: GastoFijo
  onSave: (vals: { nombre: string; descripcion?: string; monto: number; tipo: TipoGasto; diaPago?: number }) => void
  onCancel: () => void
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [monto, setMonto] = useState(initial?.monto ? String(initial.monto) : '')
  const [tipo, setTipo] = useState<TipoGasto>(initial?.tipo ?? 'mensual')
  const [diaPago, setDiaPago] = useState(initial?.diaPago ? String(initial.diaPago) : '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ nombre, descripcion: descripcion || undefined, monto: parseFloat(monto), tipo, diaPago: diaPago ? parseInt(diaPago) : undefined })
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Nombre *</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} required className={fieldClass} placeholder="Ej: Alquiler oficina" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Descripción</label>
        <input value={descripcion} onChange={e => setDescripcion(e.target.value)} className={fieldClass} placeholder="Opcional" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Monto *</label>
          <input type="number" value={monto} onChange={e => setMonto(e.target.value)} required min="1" className={fieldClass} placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Tipo *</label>
          <select value={tipo} onChange={e => setTipo(e.target.value as TipoGasto)} className={fieldClass}>
            <option value="mensual">Mensual</option>
            <option value="ocasional">Ocasional</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Día de pago (1-31)</label>
        <input type="number" value={diaPago} onChange={e => setDiaPago(e.target.value)} min="1" max="31" className={fieldClass} placeholder="Ej: 10" />
        <p className="text-xs text-[oklch(0.55_0.04_240)] mt-1">Día del mes en que vence el pago</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)]">
          Cancelar
        </button>
        <button type="submit" className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white py-2.5 rounded-lg text-sm font-semibold">
          {initial ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

function InstanciaForm({ initial, onSave, onCancel }: {
  initial: InstanciaGasto
  onSave: (vals: Partial<InstanciaGasto>) => void
  onCancel: () => void
}) {
  const [monto, setMonto] = useState(String(initial.monto))
  const [fechaVencimiento, setFechaVencimiento] = useState(initial.fechaVencimiento ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ monto: parseFloat(monto), fechaVencimiento: fechaVencimiento || undefined })
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Monto *</label>
        <input type="number" value={monto} onChange={e => setMonto(e.target.value)} required min="1" className={fieldClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Fecha de vencimiento</label>
        <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} className={fieldClass} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)]">
          Cancelar
        </button>
        <button type="submit" className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white py-2.5 rounded-lg text-sm font-semibold">
          Guardar
        </button>
      </div>
    </form>
  )
}
