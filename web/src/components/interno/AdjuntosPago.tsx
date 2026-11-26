'use client'

import { useEffect, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { Adjunto } from '@/lib/types'

export function AdjuntosPago({ pagoId }: { pagoId: string }) {
  const { getAdjuntos, getAdjuntoContenido, subirAdjunto } = useData()
  const [lista, setLista] = useState<Adjunto[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    getAdjuntos('PagoCliente', pagoId).then(r => { if (active) setLista(r) }).catch(() => { if (active) setError('No se pudieron cargar los comprobantes.') })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagoId, revision])
  async function descargar(a: Adjunto) {
    try {
      const c = await getAdjuntoContenido(a.id)
      const bytes = Uint8Array.from(atob(c.contenidoBase64), x => x.charCodeAt(0))
      const url = URL.createObjectURL(new Blob([bytes], { type: c.contentType }))
      const link = document.createElement('a'); link.href = url; link.download = a.nombre; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { setError('No se pudo descargar el comprobante.') }
  }
  async function subir(files: File[]) {
    setBusy(true); setError('')
    try { for (const file of files) await subirAdjunto('PagoCliente', pagoId, 'comprobante_pago', file) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo subir el comprobante.') }
    finally { setBusy(false); setRevision(n => n + 1) }
  }
  return <div className="space-y-2 text-sm">
    <p className="font-medium">Comprobantes del pago</p>
    {lista.map(a => <button key={a.id} type="button" className="block underline text-blue-700" onClick={() => descargar(a)}>{a.nombre}</button>)}
    {!lista.length && <p className="text-gray-500">Sin comprobantes adjuntos.</p>}
    <label className="block">Agregar archivos (PDF o imagen, hasta 8 MB cada uno)
      <input aria-label="Agregar comprobantes" disabled={busy} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => { void subir(Array.from(e.target.files ?? [])); e.target.value = '' }} />
    </label>
    {error && <p role="alert" className="text-red-700">{error} <button type="button" className="underline" onClick={() => { setError(''); setRevision(n => n + 1) }}>Actualizar lista</button></p>}
  </div>
}
