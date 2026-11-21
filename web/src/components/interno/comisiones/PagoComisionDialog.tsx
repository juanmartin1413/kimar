'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { ComisionDocumento, hoyComisiones, formatComision as formatPeso } from '@/lib/comisiones'

export interface PagoAccion {
  titulo: string; path: string; body: Record<string, unknown>; monto: number; limite?: number; minimoFecha?: string
  manual?: boolean; requiereMotivo?: boolean; advertencia?: string
  liquidacion?: { comision: number; compensado: number; ajusteAnterior: number }
}
export interface PagoPendiente { accion: PagoAccion; body: Record<string, unknown> }

export function PagoComisionDialog({ accion, pendiente, storageKey, onClose, onSuccess }: {
  accion: PagoAccion; pendiente?: PagoPendiente; storageKey: string; onClose: () => void; onSuccess: (doc: ComisionDocumento) => void
}) {
  const [monto, setMonto] = useState(accion.manual ? '' : String(accion.monto))
  const [fecha, setFecha] = useState(hoyComisiones())
  const [formaPago, setFormaPago] = useState('transferencia')
  const [referencia, setReferencia] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviada, setEnviada] = useState<PagoPendiente | undefined>(pendiente)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [compensarAdelantos, setCompensarAdelantos] = useState(true)
  const compensado = accion.liquidacion
    ? compensarAdelantos ? accion.liquidacion.compensado : Math.min(Math.max(0, accion.liquidacion.comision), accion.liquidacion.ajusteAnterior)
    : 0
  const importe = accion.liquidacion ? Math.max(0, accion.liquidacion.comision - compensado) : Number(monto)
  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    const request = enviada ?? { accion: { ...accion, monto: importe }, body: { ...accion.body, operacionId: crypto.randomUUID(), fecha,
      formaPago: importe !== 0 ? formaPago : null, referencia: referencia || null, motivo: motivo || null,
      ...(accion.liquidacion ? { compensarAdelantos } : {}),
      ...(accion.manual ? { monto: Number(monto) } : {}),
    } }
    setBusy(true); setError('')
    try {
      // Conservar el mismo identificador incluso si se cierra la pestaña tras perder la respuesta.
      localStorage.setItem(storageKey, JSON.stringify(request)); setEnviada(request)
      const doc = await api.post<ComisionDocumento>(request.accion.path, request.body)
      localStorage.removeItem(storageKey); onSuccess(doc)
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status && status >= 400 && status < 500) { localStorage.removeItem(storageKey); setEnviada(undefined) }
      setError(e instanceof Error ? e.message : 'No se pudo registrar el pago.')
    } finally { setBusy(false) }
  }
  const field = 'block w-full border rounded-lg px-3 py-2 mt-1'
  return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="pago-titulo">
    <form onSubmit={guardar} className="bg-white rounded-2xl p-6 space-y-4 w-full max-w-lg max-h-[90vh] overflow-auto">
      <h2 id="pago-titulo" className="text-xl font-bold">{accion.titulo}</h2>
      {accion.advertencia && !accion.liquidacion && <p className="text-sm bg-amber-50 text-amber-900 p-3 rounded">{accion.advertencia}</p>}
      {enviada ? <div className="bg-blue-50 p-4 rounded text-sm space-y-2">
        <p>Hay una confirmación en curso. Reintentar usa la misma operación y no duplica el pago.</p>
        <p>Fecha: {String(enviada.body.fecha)} · Importe: {formatPeso(Number(enviada.body.monto ?? enviada.accion.monto))}</p>
      </div> : <>
        {accion.liquidacion && <div className="bg-blue-50 rounded-lg p-4 space-y-3 text-sm">
          <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={compensarAdelantos} onChange={e => setCompensarAdelantos(e.target.checked)} />Compensar adelantos</label>
          <p>{compensarAdelantos ? 'Se descuentan los adelantos pendientes de esta liquidación.' : 'Los adelantos quedan pendientes para futuras liquidaciones.'}</p>
          <p>Comisión: {formatPeso(accion.liquidacion.comision)} · Compensaciones: {formatPeso(compensado)}</p>
          {accion.liquidacion.ajusteAnterior > 0 && <p>Los ajustes por pagos anteriores se recuperan igualmente.</p>}
        </div>}
        {accion.manual ? <label className="block text-sm">Comisión adelantada (máximo {formatPeso(accion.limite ?? 0)})<input autoFocus required type="number" min="0.01" max={accion.limite} step="0.01" value={monto} onChange={e => setMonto(e.target.value)} className={field} /></label>
          : <p className="text-lg font-bold">Importe: {formatPeso(importe)}</p>}
        <label className="block text-sm">Fecha del movimiento<input required type="date" min={accion.minimoFecha} max={hoyComisiones()} value={fecha} onChange={e => setFecha(e.target.value)} className={field} /></label>
        {importe !== 0 && <label className="block text-sm">Forma de pago<select value={formaPago} onChange={e => setFormaPago(e.target.value)} className={field}><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="cheque">Cheque</option></select></label>}
        <label className="block text-sm">Referencia del pago<input maxLength={200} value={referencia} onChange={e => setReferencia(e.target.value)} className={field} /></label>
        <label className="block text-sm">{accion.requiereMotivo ? 'Motivo (obligatorio)' : 'Observaciones'}<textarea required={accion.requiereMotivo} maxLength={500} value={motivo} onChange={e => setMotivo(e.target.value)} className={field} /></label>
      </>}
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
      <div className="flex gap-3">
        {!enviada && <button type="button" onClick={onClose} disabled={busy} className="border rounded-lg px-4 py-2">Volver</button>}
        <button type="submit" disabled={busy} className="bg-slate-900 text-white rounded-lg px-4 py-2 disabled:opacity-50">{busy ? 'Registrando…' : enviada ? 'Reintentar confirmación' : 'Confirmar y generar constancia'}</button>
      </div>
    </form>
  </div>
}
