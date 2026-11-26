'use client'

import { ItemVenta } from '@/lib/types'
import { ComprobanteFiscal, condicionIvaLabels, DatosFactura, ReceptorFiscal } from '@/lib/facturacion'
import { formatPeso } from '@/lib/format'

const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white'
export function ReceptorFields({ value, onChange, disabled = false, required = false }: { value: ReceptorFiscal; onChange: (r: ReceptorFiscal) => void; disabled?: boolean; required?: boolean }) {
  return <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm">Razón social<input required={required} className={field} value={value.razonSocial} maxLength={200} onChange={e => onChange({ ...value, razonSocial: e.target.value })} /></label>
    <label className="text-sm">CUIT<input required={required} className={field} value={value.cuit} onChange={e => onChange({ ...value, cuit: e.target.value })} /></label>
    <label className="text-sm">Condición IVA<select required={required} className={field} value={value.condicionIva || ''} onChange={e => onChange({ ...value, condicionIva: Number(e.target.value) })}>
      <option value="">Seleccionar…</option>{Object.entries(condicionIvaLabels).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select></label>
    <label className="text-sm">Domicilio fiscal<input required={required} className={field} value={value.domicilio} maxLength={300} onChange={e => onChange({ ...value, domicilio: e.target.value })} /></label>
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

export function FacturaEditor({ items, value, onChange }: { items: ItemVenta[]; value: DatosFactura; onChange: (datos: DatosFactura) => void }) {
  return <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
    <h2 className="font-semibold">Datos de facturación</h2>
    <p className="text-sm text-gray-600">Los cambios de este bloque se aplican a la factura. Las descripciones del remito y del catálogo se conservan.</p>
    <ReceptorFields required value={value.receptor} onChange={receptor => onChange({ ...value, receptor })} />
    {items.map(i => <label key={i.id} className="block text-sm">Descripción fiscal · {i.cantidad} × {i.descripcion}
      <input required className={field} maxLength={300} value={value.descripciones[i.id] ?? i.descripcion} onChange={e => onChange({ ...value, descripciones: { ...value.descripciones, [i.id]: e.target.value } })} />
    </label>)}
    <label className="block text-sm">Observaciones de la factura<textarea className={field} maxLength={500} value={value.observaciones} onChange={e => onChange({ ...value, observaciones: e.target.value })} /></label>
  </section>
}
