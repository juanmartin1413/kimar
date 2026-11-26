'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { QueryState, useApiQuery } from '@/components/interno/QueryState'
import { PdfButton } from '@/components/interno/PdfButton'
import { FacturaResumen } from '@/components/interno/FacturaEditor'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ComprobanteFiscal, fiscalLabels } from '@/lib/facturacion'
import { today, addDaysIso, formatFecha, formatPeso } from '@/lib/format'
import { api } from '@/lib/api'

type Evento = { id: string; tipo: string; fecha: string; registro: string; estado: string; referencia?: string; importe?: number }
type Resultado = { cliente: { id: string; nombre: string; activo: boolean }; fechaDesde: string; fechaHasta: string; total: number; items: Evento[] }
type Detalle = { evento: Evento; detalle: ComprobanteFiscal & { observaciones?: string; fechaEntrega?: string; estadoEntrega?: string; medioEnvio?: string; repartidor?: string; nroRemito?: string; nroFactura?: string; formaPago?: string;
  items?: { descripcion: string; cantidad: number; unidad?: string; precio: number; subtotal: number }[]; imputaciones?: { ventaId?: string; nroRemito?: string; monto: number }[] };
  relacionados: Evento[]; adjuntos: { id: string; nombre: string; contentType: string }[] }
const labels: Record<string, string> = { pedido: 'Pedido', venta: 'Venta', preparacion: 'Listo para entrega', entrega: 'Entrega realizada', comprobante: 'Comprobante fiscal', pago: 'Pago recibido' }
const button = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50'
const primary = 'rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50'
const field = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2'

function DetalleEvento({ clienteId, evento, desde, hasta, onSelect }: { clienteId: string; evento: Evento; desde: string; hasta: string; onSelect: (e: Evento) => void }) {
  const query = useApiQuery<Detalle>(`/api/trazabilidad/${clienteId}/${evento.tipo}/${evento.id}`)
  const { getAdjuntoContenido } = useData()
  const [error, setError] = useState('')
  async function download(id: string) {
    setError('')
    try {
      const file = await getAdjuntoContenido(id)
      const blob = new Blob([Uint8Array.from(atob(file.contenidoBase64), c => c.charCodeAt(0))], { type: file.contentType })
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = file.nombre; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { setError('No se pudo descargar el archivo. Intentá nuevamente.') }
  }
  const d = query.data?.detalle
  return <QueryState loading={query.loading} error={query.error} retry={query.retry}>{d && <div className="space-y-4 text-sm">
    <p>{formatFecha(evento.fecha)} · {fiscalLabels[evento.estado] || evento.estado.replaceAll('_', ' ')}</p>
    <p className="text-slate-500">Registrado: {new Date(evento.registro).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
    {evento.tipo === 'comprobante' ? <><FacturaResumen comprobante={d} />{d.motivo && <p>Motivo: {d.motivo}</p>}{d.efectoComercial && <p>Efecto: {d.efectoComercial.replaceAll('_', ' ')}</p>}{d.pdfDisponible && <PdfButton onClick={() => { setError(''); api.download(`/api/facturacion/${evento.id}/pdf`, `${d.numeroCompleto || 'Comprobante'}.pdf`).catch(() => setError('No se pudo descargar el PDF.')) }} />}</> : <>
      {d.fechaEntrega && <p>Entrega pactada: {formatFecha(d.fechaEntrega)}</p>}
      {d.estadoEntrega && <p>Estado actual de entrega: {d.estadoEntrega} · {d.medioEnvio} {d.repartidor && `· ${d.repartidor}`}</p>}
      {d.nroRemito && <p>Remito: {d.nroRemito}</p>}{d.nroFactura && <p>Factura: {d.nroFactura}</p>}
      {d.observaciones && <p className="whitespace-pre-wrap">{d.observaciones}</p>}
      {d.items?.map((i, n) => <div key={n} className="flex justify-between gap-3 border-b py-2"><span>{i.cantidad} {i.unidad} × {i.descripcion}</span><span>{formatPeso(i.subtotal)}</span></div>)}
      {d.formaPago && <p>Medio de pago: {d.formaPago}</p>}
      {d.imputaciones && <div><h3 className="font-semibold">Distribución del pago</h3>{d.imputaciones.map((i, n) => <p key={n} className="py-1">{i.ventaId ? <Link className="text-blue-700 underline" href={`/interno/ventas/${i.ventaId}`}>Venta · Remito {i.nroRemito || 'sin número'}</Link> : 'Compromiso'}: {formatPeso(i.monto)}</p>)}</div>}
    </>}
    {!!query.data?.adjuntos.length && <div><h3 className="font-semibold">Documentos adjuntos</h3>{query.data.adjuntos.map(a => <button key={a.id} onClick={() => download(a.id)} className="block py-2 text-blue-700 underline">{a.nombre}</button>)}</div>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!!query.data?.relacionados.length && <div><h3 className="font-semibold">Operaciones relacionadas</h3>{query.data.relacionados.map(e => <button key={e.tipo + e.id} onClick={() => onSelect(e)} className="block py-2 text-left text-blue-700 underline">{formatFecha(e.fecha)} · {labels[e.tipo]} {e.referencia && `· ${e.referencia}`} {e.fecha < desde || e.fecha > hasta ? '(fuera del período)' : ''}</button>)}</div>}
    {evento.tipo === 'venta' && <Link className="inline-block text-blue-700 underline" href={`/interno/ventas/${evento.id}`}>Abrir venta</Link>}
  </div>}</QueryState>
}

function Consulta() {
  const params = useSearchParams(); const router = useRouter()
  const { canManageData } = useAuth(); const { data } = useData()
  const clienteId = params.get('clienteId') || ''; const desde = params.get('fechaDesde') || addDaysIso(today(), -29); const hasta = params.get('fechaHasta') || today()
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)
  const [search, setSearch] = useState(''); const [selected, setSelected] = useState<Evento | null>(null)
  const url = new URLSearchParams({ clienteId, fechaDesde: desde, fechaHasta: hasta, pagina: String(pagina) })
  const query = useApiQuery<Resultado>(canManageData && clienteId ? `/api/trazabilidad?${url}` : null)
  if (!canManageData) return <p>No tenés acceso a Trazabilidad.</p>
  const clientes = data.clientes.filter(c => c.id === clienteId || `${c.nombre} ${c.cuit || ''}`.toLowerCase().includes(search.toLowerCase()))
  function navigate(values: URLSearchParams) { setSelected(null); router.push('/interno/trazabilidad?' + values) }
  return <div className="max-w-5xl space-y-5">
    <div><h1 className="text-2xl font-bold">Trazabilidad</h1><p className="text-sm text-slate-600">Historial comercial por cliente. Los estados y datos comerciales muestran la información actual.</p></div>
    <form key={url.toString()} className="rounded-xl border bg-white p-4 space-y-3" onInput={e => e.currentTarget.querySelectorAll<HTMLInputElement>('input[type="date"]').forEach(input => input.setCustomValidity(''))} onSubmit={e => {
      e.preventDefault(); const form = new FormData(e.currentTarget)
      const values = new URLSearchParams({ clienteId: String(form.get('clienteId')), fechaDesde: String(form.get('fechaDesde')), fechaHasta: String(form.get('fechaHasta')), pagina: '1' })
      if (values.get('fechaDesde')! > values.get('fechaHasta')!) { e.currentTarget.querySelector<HTMLInputElement>('[name="fechaHasta"]')?.setCustomValidity('La fecha hasta debe ser igual o posterior a la fecha desde.'); e.currentTarget.reportValidity(); return }
      navigate(values)
    }}>
      <label className="block text-sm">Buscar cliente por nombre o CUIT<input className={field} value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre o CUIT" /></label>
      <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Cliente<select className={field} name="clienteId" defaultValue={clienteId} required><option value="">Seleccionar cliente…</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{!c.activo ? ' (inactivo)' : ''}</option>)}</select></label>
        <label className="text-sm">Fecha desde<input className={field} type="date" required name="fechaDesde" defaultValue={desde} /></label>
        <label className="text-sm">Fecha hasta<input className={field} type="date" required name="fechaHasta" defaultValue={hasta} onChange={e => e.target.setCustomValidity('')} /></label></div>
      <div className="flex gap-2"><button className={primary}>Consultar</button><button type="button" className={button} onClick={() => navigate(new URLSearchParams({ clienteId, fechaDesde: addDaysIso(today(), -29), fechaHasta: today(), pagina: '1' }))}>Últimos 30 días</button></div>
    </form>
    {!clienteId ? <p className="rounded-xl border bg-white p-8 text-center text-slate-600">Seleccioná un cliente para consultar su historial.</p> : <QueryState loading={query.loading} error={query.error} retry={query.retry}>
      {query.data && <><h2 className="font-semibold">{query.data.cliente.nombre} · {query.data.total} operaciones</h2>
        {!query.data.items.length && <p className="p-6 text-slate-500">No hay operaciones en el período seleccionado.</p>}
        <ol className="space-y-3">{query.data.items.map(e => <li key={e.tipo + e.id} className="rounded-xl border bg-white p-4"><button className="w-full text-left" onClick={() => setSelected(e)}><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{labels[e.tipo]} {e.referencia && `· ${e.referencia}`}</span>{e.importe != null && <strong>{formatPeso(e.importe)}</strong>}</div><p className="mt-2 text-sm text-slate-600">{formatFecha(e.fecha)} · {fiscalLabels[e.estado] || e.estado.replaceAll('_', ' ')}</p><span className="mt-2 inline-block text-sm font-semibold text-blue-700">Ver detalle y relaciones</span></button></li>)}</ol>
        {query.data.total > 50 && <div className="flex items-center gap-3"><button className={button} disabled={pagina === 1} onClick={() => { url.set('pagina', String(pagina - 1)); navigate(url) }}>Anterior</button><span>Página {pagina}</span><button className={button} disabled={pagina * 50 >= query.data.total} onClick={() => { url.set('pagina', String(pagina + 1)); navigate(url) }}>Siguiente</button></div>}
      </>}
    </QueryState>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}><DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl"><DialogTitle>{selected ? labels[selected.tipo] : 'Detalle'}</DialogTitle>{selected && <DetalleEvento key={selected.tipo + selected.id} clienteId={clienteId} evento={selected} desde={desde} hasta={hasta} onSelect={setSelected} />}</DialogContent></Dialog>
  </div>
}

export default function TrazabilidadPage() { return <Suspense fallback={<QueryState loading />}><Consulta /></Suspense> }
