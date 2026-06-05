'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { Cobranza } from '@/lib/types'
import { formatPeso, formatFecha, today } from '@/lib/format'
import { CheckCircle, Plus, AlertCircle, Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const estadoConfig = {
  pendiente: { label: 'PENDIENTE', className: 'bg-yellow-100 text-yellow-700' },
  cobrado: { label: 'COBRADO', className: 'bg-green-100 text-green-700' },
  vencido: { label: 'VENCIDO', className: 'bg-red-100 text-red-700' },
}

const formaPagoLabel = { efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque' }

export default function CobranzasPage() {
  const { data, cobrarCobranza, addCobranza, updateCobranza } = useData()
  const [estadoFilter, setEstadoFilter] = useState('pendiente')
  const [formaFilter, setFormaFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Cobranza | null>(null)

  const todayStr = today()
  const allCobranzas = data.cobranzas

  // Smart filtering based on virtual states
  const filtered = allCobranzas.filter(c => {
    // Forma de pago filter
    if (formaFilter && c.formaPago !== formaFilter) return false
    // Estado filter
    if (!estadoFilter) return true
    if (estadoFilter === 'hoy') return c.estado === 'pendiente' && c.fecha === todayStr
    if (estadoFilter === 'vencido') return c.estado === 'pendiente' && c.fecha < todayStr
    if (estadoFilter === 'pendiente') return c.estado === 'pendiente' && c.fecha >= todayStr
    if (estadoFilter === 'cobrado') return c.estado === 'cobrado'
    return c.estado === estadoFilter
  })
  const sorted = [...filtered].sort((a, b) => a.fecha.localeCompare(b.fecha))

  const totalPendiente = allCobranzas
    .filter(c => c.estado === 'pendiente')
    .reduce((s, c) => s + c.monto, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Cobranzas</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">Agenda y registro de cobros</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 text-center">
            <p className="text-xs text-yellow-600 font-medium">PENDIENTE A COBRAR</p>
            <p className="text-xl font-bold text-yellow-700 tabular-nums">{formatPeso(totalPendiente)}</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva cobranza
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: '', label: 'Todos' },
          { key: 'hoy', label: 'Hoy' },
          { key: 'pendiente', label: 'Pendiente' },
          { key: 'vencido', label: 'Vencido' },
          { key: 'cobrado', label: 'Cobrado' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setEstadoFilter(key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              estadoFilter === key
                ? 'bg-[oklch(0.42_0.14_240)] text-white border-transparent'
                : 'border-[oklch(0.88_0.02_240)] text-[oklch(0.45_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]'
            )}
          >
            {label}
          </button>
        ))}

        <div className="ml-auto">
          <select
            value={formaFilter}
            onChange={e => setFormaFilter(e.target.value)}
            className="border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-1.5 text-sm text-[oklch(0.45_0.04_240)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
          >
            <option value="">Todas las formas</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.9_0.01_240)]">
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Fecha</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Monto</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Forma</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Venta</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Estado</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[oklch(0.55_0.04_240)]">Sin cobranzas en esta categoría</td></tr>
              ) : sorted.map(c => {
                const cliente = data.clientes.find(x => x.id === c.clienteId)
                const venta = c.ventaId ? data.ventas.find(v => v.id === c.ventaId) : null
                const isVencido = c.estado === 'pendiente' && c.fecha < todayStr
                const isHoy = c.estado === 'pendiente' && c.fecha === todayStr
                const displayEstado = isVencido ? 'vencido' : c.estado
                const cfg = estadoConfig[displayEstado as keyof typeof estadoConfig] ?? estadoConfig.pendiente
                return (
                  <tr key={c.id} className={cn('border-b border-[oklch(0.93_0.01_240)] hover:bg-[oklch(0.98_0.005_240)]', isVencido && 'bg-red-50/30')}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isVencido && <AlertCircle className="w-4 h-4 text-red-500" />}
                        <span className={cn('text-[oklch(0.45_0.04_240)]', isVencido && 'text-red-600 font-medium')}>{formatFecha(c.fecha)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[oklch(0.25_0.06_240)]">{cliente?.nombre ?? '—'}</td>
                    <td className="py-3 px-4 font-semibold tabular-nums">{formatPeso(c.monto)}</td>
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{formaPagoLabel[c.formaPago]}</td>
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{venta ? `Remito: ${venta.nroRemito ?? '—'}` : '—'}</td>
                    <td className="py-3 px-4">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.className)}>{cfg.label}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {c.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => cobrarCobranza(c.id)}
                              title="Marcar como cobrado"
                              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" /> Cobrar
                            </button>
                            <button
                              onClick={() => setEditing(c)}
                              title="Editar cobranza"
                              className="text-[oklch(0.55_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </>
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

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nueva cobranza</DialogTitle></DialogHeader>
          <CobranzaForm
            data={data}
            onSave={vals => { addCobranza(vals); setCreating(false) }}
            onCancel={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar cobranza</DialogTitle></DialogHeader>
          {editing && (
            <CobranzaForm
              data={data}
              initial={editing}
              onSave={vals => { updateCobranza(editing.id, vals); setEditing(null) }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

type CobranzaFormValues = Omit<Cobranza, 'id' | 'fechaCreacion'>

function CobranzaForm({ data, initial, onSave, onCancel }: {
  data: any
  initial?: Cobranza
  onSave: (vals: CobranzaFormValues) => void
  onCancel: () => void
}) {
  const [clienteId, setClienteId] = useState(initial?.clienteId ?? '')
  const [ventaId, setVentaId] = useState(initial?.ventaId ?? '')
  const [fecha, setFecha] = useState(initial?.fecha ?? today())
  const [monto, setMonto] = useState(initial?.monto ? String(initial.monto) : '')
  const [formaPago, setFormaPago] = useState(initial?.formaPago ?? 'efectivo')
  const [observaciones, setObservaciones] = useState(initial?.observaciones ?? '')

  const clienteVentas = data.ventas.filter((v: any) => v.clienteId === clienteId && v.estado !== 'pagado')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      clienteId,
      ventaId: ventaId || undefined,
      fecha,
      monto: parseFloat(monto),
      formaPago: formaPago as any,
      estado: initial?.estado ?? 'pendiente',
      observaciones: observaciones || undefined,
    })
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Cliente *</label>
        <select
          value={clienteId}
          onChange={e => { setClienteId(e.target.value); setVentaId('') }}
          required
          disabled={!!initial}
          className={fieldClass}
        >
          <option value="">Seleccionar…</option>
          {data.clientes.filter((c: any) => c.activo).map((c: any) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {clienteId && clienteVentas.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Asociar a venta (opcional)</label>
          <select value={ventaId} onChange={e => setVentaId(e.target.value)} className={fieldClass}>
            <option value="">Sin venta asociada</option>
            {clienteVentas.map((v: any) => (
              <option key={v.id} value={v.id}>
                Remito {v.nroRemito ?? '—'} — {formatPeso(v.total)} — {formatFecha(v.fechaEntrega)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Monto *</label>
          <input
            type="number"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            required
            min="1"
            className={fieldClass}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Forma de pago</label>
        <select value={formaPago} onChange={e => setFormaPago(e.target.value as any)} className={fieldClass}>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Observaciones</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} className={fieldClass} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)]">
          Cancelar
        </button>
        <button type="submit" className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white py-2.5 rounded-lg text-sm font-semibold">
          {initial ? 'Guardar cambios' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}
