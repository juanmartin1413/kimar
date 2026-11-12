'use client'

import { useState } from 'react'
import { Cliente, ItemVenta } from '@/lib/types'
import { ComprobanteFiscal, condicionIvaLabels, fiscalItems, receptorCliente, ReceptorFiscal } from '@/lib/facturacion'
import { api } from '@/lib/api'
import { formatPeso } from '@/lib/format'

const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white'
export function ReceptorFields({ value, onChange, disabled = false }: { value: ReceptorFiscal; onChange: (r: ReceptorFiscal) => void; disabled?: boolean }) {
  return <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm">Razón social<input className={field} value={value.razonSocial} maxLength={200} onChange={e => onChange({ ...value, razonSocial: e.target.value })} /></label>
    <label className="text-sm">CUIT<input className={field} value={value.cuit} onChange={e => onChange({ ...value, cuit: e.target.value })} /></label>
    <label className="text-sm">Condición IVA<select className={field} value={value.condicionIva} onChange={e => onChange({ ...value, condicionIva: Number(e.target.value) })}>
      <option value={0}>Seleccionar…</option>{Object.entries(condicionIvaLabels).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select></label>
    <label className="text-sm">Domicilio fiscal<input className={field} value={value.domicilio} maxLength={300} onChange={e => onChange({ ...value, domicilio: e.target.value })} /></label>
  </fieldset>
}

export function FacturaResumen({ comprobante: c }: { comprobante: ComprobanteFiscal }) {
  return <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2 text-sm">
    <p className="font-bold">{c.tipo === 3 ? 'Nota de crédito A' : 'Factura A'} · {c.numeroCompleto || 'Borrador — sin validez fiscal'}</p>
    <p>{c.datos.emisor.razonSocial} · CUIT {c.datos.emisor.cuit} · PV {String(c.puntoVenta).padStart(5, '0')}</p>
    <p className="font-semibold">{c.ambiente === 'production' ? 'Producción' : 'HOMOLOGACIÓN — PRUEBA'}</p>
    <p>{c.datos.receptor.razonSocial} · CUIT {c.datos.receptor.cuit}</p>
    <p>{c.datos.receptor.domicilio}</p>
    {c.datos.items.map((i, index) => <div key={index} className="flex justify-between gap-4 border-t border-blue-100 pt-2"><span>{i.cantidad} {i.unidad} × {i.descripcion}</span><span className="whitespace-nowrap">{formatPeso(i.neto)}</span></div>)}
    {c.datos.observaciones && <p>{c.datos.observaciones}</p>}
    <p>Neto: {formatPeso(c.neto)} · IVA 21%: {formatPeso(c.iva)}</p>
    <p className="font-bold text-lg">Total: {formatPeso(c.total)}</p>
  </div>
}

export function FacturaEditor({ cliente, items, onPreview }: { cliente: Cliente; items: ItemVenta[]; onPreview: (c: ComprobanteFiscal | null) => void }) {
  const [receptor, setReceptor] = useState(() => receptorCliente(cliente))
  const [descripciones, setDescripciones] = useState<Record<string, string>>({})
  const [observaciones, setObservaciones] = useState('')
  const [preview, setPreview] = useState<ComprobanteFiscal | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reviewedInput, setReviewedInput] = useState('')
  const input = JSON.stringify({ clienteId: cliente.id, items: fiscalItems(items), receptor, descripciones: items.map(i => descripciones[i.id] ?? i.descripcion), observaciones })
  const current = reviewedInput === input
  function invalidate() { setPreview(null); onPreview(null) }
  async function review() {
    setBusy(true); setError(''); onPreview(null)
    try {
      const result = await api.post<ComprobanteFiscal>('/api/facturacion/preview', JSON.parse(input))
      setPreview(result); setReviewedInput(input); onPreview(result)
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo preparar la factura') }
    finally { setBusy(false) }
  }
  return <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
    <h2 className="font-semibold">Factura — revisión previa</h2>
    <p className="text-sm text-gray-600">Los cambios de este bloque se aplican a la factura. Las descripciones del remito y del catálogo se conservan.</p>
    <ReceptorFields value={receptor} disabled={busy} onChange={r => { setReceptor(r); invalidate() }} />
    {items.map(i => <label key={i.id} className="block text-sm">Descripción fiscal · {i.cantidad} × {i.descripcion}
      <input disabled={busy} className={field} maxLength={300} value={descripciones[i.id] ?? i.descripcion} onChange={e => { setDescripciones(p => ({ ...p, [i.id]: e.target.value })); invalidate() }} />
    </label>)}
    <label className="block text-sm">Observaciones de la factura<textarea disabled={busy} className={field} maxLength={500} value={observaciones} onChange={e => { setObservaciones(e.target.value); invalidate() }} /></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button type="button" onClick={review} disabled={busy || !items.length} className="rounded-lg bg-blue-700 text-white px-4 py-2 disabled:opacity-50">{busy ? 'Preparando…' : 'Actualizar vista previa'}</button>
    {preview && current ? <FacturaResumen comprobante={preview} /> : <p className="text-sm text-amber-700">Actualizá la vista previa antes de confirmar la venta.</p>}
  </section>
}
