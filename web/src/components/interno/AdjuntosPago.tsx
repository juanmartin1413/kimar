'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { QueryState, useApiQuery } from './QueryState'
import { Adjunto } from '@/lib/types'
import { ComprobantesPagoSelector } from './ComprobantesPagoSelector'
import { FileText, Trash2 } from 'lucide-react'

export function AdjuntosPago({ pagoId }: { pagoId: string }) {
  const { getAdjuntoContenido, subirAdjunto, eliminarAdjunto } = useData()
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const query = useApiQuery<Adjunto[]>('/api/adjuntos?entidadTipo=PagoCliente&entidadId=' + pagoId, revision)
  const lista = query.data || []
  async function descargar(a: Adjunto) {
    try {
      const c = await getAdjuntoContenido(a.id)
      const bytes = Uint8Array.from(atob(c.contenidoBase64), x => x.charCodeAt(0))
      const url = URL.createObjectURL(new Blob([bytes], { type: c.contentType }))
      const link = document.createElement('a'); link.href = url; link.download = a.nombre; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { setError('No se pudo descargar el comprobante.') }
  }
  async function subir() {
    setBusy(true); setError('')
    try {
      const pendientes = [...files]
      while (pendientes.length) {
        await subirAdjunto('PagoCliente', pagoId, 'comprobante_pago', pendientes[0])
        pendientes.shift(); setFiles([...pendientes])
      }
    }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo subir el comprobante.') }
    finally { setBusy(false); setRevision(n => n + 1) }
  }
  async function eliminar(a: Adjunto) {
    if (!window.confirm(`¿Eliminar el comprobante "${a.nombre}" de este pago?`)) return
    setBusy(true); setError('')
    try { await eliminarAdjunto(a.id); setRevision(n => n + 1) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo eliminar el comprobante.') }
    finally { setBusy(false) }
  }
  return <div className="space-y-3 text-sm">
    <p className="font-medium">Comprobantes del pago</p>
    {lista.map(a => <div key={a.id} className="flex items-center gap-3 rounded-lg border bg-white p-3">
      <FileText className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
      <button type="button" className="min-w-0 flex-1 break-all text-left underline text-blue-700" onClick={() => descargar(a)}>{a.nombre}</button>
      <button type="button" disabled={busy} aria-label={`Eliminar ${a.nombre}`} onClick={() => eliminar(a)} className="inline-flex items-center gap-1 rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50">
        <Trash2 className="h-4 w-4" aria-hidden="true" />Eliminar
      </button>
    </div>)}
    <QueryState loading={query.loading} error={query.error} retry={query.retry} />
    {!query.loading && !query.error && !lista.length && <p className="text-gray-500">Sin comprobantes adjuntos.</p>}
    <ComprobantesPagoSelector files={files} onChange={setFiles} disabled={busy} buttonLabel="Añadir un comprobante" />
    {files.length > 0 && <button type="button" disabled={busy} onClick={subir} className="rounded-lg bg-blue-800 px-4 py-2 font-semibold text-white disabled:opacity-50">
      {busy ? 'Subiendo…' : 'Guardar comprobantes'}
    </button>}
    {error && <p role="alert" className="text-red-700">{error} <button type="button" className="underline" onClick={() => { setError(''); setRevision(n => n + 1) }}>Actualizar lista</button></p>}
  </div>
}
