'use client'

import { useRef, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { api } from '@/lib/api'
import { Cobranza, FormaPago } from '@/lib/types'
import { ConfirmarPagoPayload, PreviewPago, dinero, distribucionValida } from '@/lib/cobranzas'
import { formatFecha, today } from '@/lib/format'
import { EstadoCuentaCliente } from './EstadoCuentaCliente'

export function CobranzaForm({ initial, onDone, onBusy }: { initial?: Cobranza; onDone: () => void; onBusy: (busy: boolean) => void }) {
  const { data, registrarPago, subirAdjunto } = useData()
  const [clienteId, setCliente] = useState(initial?.clienteId ?? '')
  const [monto, setMonto] = useState(initial ? String(initial.monto) : '')
  const [fecha, setFecha] = useState(today())
  const [formaPago, setForma] = useState<FormaPago>('efectivo')
  const [observaciones, setObservaciones] = useState('')
  const [preview, setPreview] = useState<PreviewPago | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [savedId, setSavedId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const gate = useRef(false)
  const pending = useRef<ConfirmarPagoPayload | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const field = 'w-full border rounded-lg px-3 py-2 text-sm'
  const valid = preview && distribucionValida(preview.deudas, Number(monto))
  function lock(value: boolean) { gate.current = value; setBusy(value); onBusy(value) }
  async function proponer() {
    if (gate.current) return
    lock(true); setError(''); setPreview(null)
    try {
      setPreview(await api.post<PreviewPago>('/api/cobranzas/previsualizar', { clienteId, monto: Number(monto), prioridadId: initial?.clienteId === clienteId ? initial.id : null }))
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo calcular la distribución.') }
    finally { lock(false) }
  }
  async function confirmar() {
    if (gate.current || (!savedId && !valid)) return
    if (!savedId && files.some(f => f.size === 0 || f.size > 8 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type))) {
      setError('Elegí comprobantes PDF, JPG, PNG o WebP de hasta 8 MB cada uno.'); return
    }
    lock(true); setError('')
    let id = savedId
    try {
      if (!id) {
        pending.current ??= { operacionId: crypto.randomUUID(), clienteId, fecha, monto: Number(monto), formaPago, observaciones,
          version: preview!.version, imputaciones: preview!.deudas.filter(d => d.aplicar > 0).map(d => ({ cobranzaId: d.cobranzaId, monto: d.aplicar })) }
        const result = await registrarPago(pending.current)
        id = result.id; setSavedId(id); setUncertain(false)
      }
      const restantes = [...files]
      while (restantes.length) {
        await subirAdjunto('PagoCliente', id, 'comprobante_pago', restantes[0])
        restantes.shift(); setFiles([...restantes])
      }
      onDone()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo registrar el pago.'
      if (id) setError(`El pago quedó registrado. Falta subir comprobantes: ${message}`)
      else {
        // Una respuesta HTTP es un rechazo conocido; un fallo de red conserva el mismo cuerpo/id para reintentar.
        const status = (e as { status?: number }).status
        if (status && status < 500) { pending.current = null; setPreview(null); setUncertain(false) }
        else setUncertain(true)
        setError(message)
      }
    } finally { lock(false) }
  }
  return <div className="space-y-4">
    <fieldset disabled={busy || !!savedId || uncertain} className="space-y-4">
      <label className="block text-sm">Cliente *<select className={field} value={clienteId} onChange={e => { setCliente(e.target.value); setPreview(null) }}>
        <option value="">Seleccionar…</option>{data.clientes.filter(c => c.activo).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select></label>
      <EstadoCuentaCliente clienteId={clienteId} />
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Monto recibido *<input type="number" min="0.01" step="0.01" className={field} value={monto} onChange={e => { setMonto(e.target.value); setPreview(null) }} /></label>
        <label className="text-sm">Fecha del pago *<input type="date" className={field} value={fecha} onChange={e => setFecha(e.target.value)} /></label>
      </div>
      <label className="block text-sm">Medio de pago<select className={field} value={formaPago} onChange={e => setForma(e.target.value as FormaPago)}>
        <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="cheque">Cheque</option>
      </select></label>
      <label className="block text-sm">Observaciones<textarea maxLength={500} className={field} value={observaciones} onChange={e => setObservaciones(e.target.value)} /></label>
      <label className="block text-sm">Comprobantes (opcionales, hasta 8 MB por archivo)<input className={field} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => setFiles(Array.from(e.target.files ?? []))} /></label>
      <button type="button" disabled={!clienteId || !(Number(monto) > 0) || !fecha} className="rounded-lg border px-4 py-2 text-blue-800 disabled:opacity-50" onClick={proponer}>Calcular distribución</button>
      {preview && <div className="space-y-2">
        <p className="font-semibold">Revisá y ajustá la distribución antes de confirmar</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th>Remito / vencimiento</th><th>Saldo</th><th>Aplicar</th><th>Restante</th></tr></thead>
          <tbody>{preview.deudas.map(d => <tr key={d.cobranzaId} className="border-t">
            <td className="py-2">{d.nroRemito ?? '—'}<br />{formatFecha(d.vencimiento)}</td><td>{dinero(d.saldo)}</td>
            <td><input aria-label={`Aplicar a remito ${d.nroRemito ?? d.ventaId}`} className="w-28 border rounded p-2" type="number" min="0" max={d.saldo} step="0.01" value={d.aplicar} onChange={e => setPreview(p => p && ({ ...p, deudas: p.deudas.map(x => x.cobranzaId === d.cobranzaId ? { ...x, aplicar: Number(e.target.value) } : x) }))} /></td>
            <td>{dinero(d.saldo - d.aplicar)}</td>
          </tr>)}</tbody></table></div>
        <p>Distribuido: {dinero(preview.deudas.reduce((n,d) => n + d.aplicar, 0))} de {dinero(Number(monto))}</p>
        {!valid && <p role="alert" className="text-red-700">Distribuí el importe completo sin superar los saldos. Usá cero para excluir una operación.</p>}
      </div>}
    </fieldset>
    {savedId && <p className="text-green-800">Pago registrado. {files.length > 0 ? `${files.length} comprobante(s) pendiente(s) de carga.` : ''}</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {uncertain && <p className="text-sm">No se pudo confirmar la respuesta. Reintentá con los mismos datos para recuperar el resultado sin duplicar el pago.</p>}
    <button type="button" disabled={busy || (!savedId && (!valid || !fecha))} onClick={confirmar} className="rounded-lg bg-blue-800 text-white px-4 py-2 disabled:opacity-50">
      {busy ? 'Procesando…' : savedId ? 'Reintentar comprobantes' : uncertain ? 'Reintentar confirmación' : 'Confirmar distribución y registrar pago'}
    </button>
    {savedId && !busy && <button type="button" className="ml-3 underline" onClick={onDone}>Cerrar y completar adjuntos después</button>}
  </div>
}
