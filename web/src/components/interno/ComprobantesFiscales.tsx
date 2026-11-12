'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { api } from '@/lib/api'
import { formatPeso, formatFecha, today } from '@/lib/format'
import { ComprobanteFiscal, FiscalConfig, fiscalLabels, fiscalStatusClass, ReceptorFiscal } from '@/lib/facturacion'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { FacturaResumen, ReceptorFields } from './FacturaEditor'

const button = 'rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50'
export function ComprobantesFiscales({ ventaId }: { ventaId?: string }) {
  const { canManageData, isAdmin } = useAuth()
  const { refresh } = useData()
  const [items, setItems] = useState<ComprobanteFiscal[]>([])
  const [config, setConfig] = useState<FiscalConfig | null>(null)
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<{ c: ComprobanteFiscal; action: 'nc' | 'corregir' | 'reemplazar' } | null>(null)
  const [motivo, setMotivo] = useState('')
  const [efecto, setEfecto] = useState('')
  const [receptor, setReceptor] = useState<ReceptorFiscal>({ razonSocial: '', cuit: '', condicionIva: 0, domicilio: '' })
  const [descripciones, setDescripciones] = useState<string[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [fecha, setFecha] = useState(today())
  const load = useCallback(async () => {
    const query = new URLSearchParams({ pagina: String(pagina) })
    if (ventaId) query.set('ventaId', ventaId)
    if (estado) query.set('estado', estado)
    const result = await api.get<{ items: ComprobanteFiscal[]; total: number }>(`/api/facturacion?${query}`)
    setItems(result.items); setTotal(result.total); setLoading(false)
  }, [pagina, estado, ventaId])
  useEffect(() => {
    if (!canManageData) return
    const run = () => load().catch(e => { setError(e.message); setLoading(false) })
    run()
    const timer = setInterval(run, 15000)
    api.get<FiscalConfig>('/api/facturacion/configuracion').then(setConfig).catch(e => setError(e.message))
    return () => clearInterval(timer)
  }, [load, canManageData])
  function open(c: ComprobanteFiscal, action: 'nc' | 'corregir' | 'reemplazar') {
    setSelected({ c, action }); setMotivo(''); setEfecto(''); setReceptor(c.datos.receptor)
    setDescripciones(c.datos.items.map(i => i.descripcion)); setObservaciones(c.datos.observaciones || ''); setFecha(today()); setError('')
  }
  async function run(fn: () => Promise<unknown>, message: string) {
    setBusy(true); setError(''); setNotice('')
    try { await fn(); setNotice(message); setSelected(null); await load(); refresh() }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación') }
    finally { setBusy(false) }
  }
  if (!canManageData) return <p>No tenés acceso a Facturación.</p>
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">{ventaId ? 'Comprobantes fiscales' : 'Facturación'}</h2>
      <button className={button} onClick={() => run(load, 'Listado actualizado')} disabled={busy}>Actualizar</button>
    </div>
    {config && !ventaId && <div className="rounded-lg border bg-blue-50 p-3 text-sm">
      <p className="font-semibold">{config.ambiente === 'production' ? 'Producción' : 'HOMOLOGACIÓN — PRUEBA'} · {config.emisor?.razonSocial || 'Emisor sin configurar'}</p>
      <p>Reintentos cada {config.reintentoMinutos} minutos, sin límite para errores transitorios.</p>
      {config.error && <p className="text-amber-800">{config.error}</p>}
    </div>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{notice}</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    {!ventaId && <label className="block text-sm">Estado <select className="rounded-lg border p-2" value={estado} onChange={e => { setEstado(e.target.value); setPagina(1) }}>
      <option value="">Todos</option>{Object.entries(fiscalLabels).filter(([id]) => id !== 'borrador').map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select></label>}
    {loading ? <p>Cargando comprobantes…</p> : !items.length ? <p className="text-gray-500">Sin comprobantes fiscales.</p> : items.map(c => {
      const nc = items.find(n => n.comprobanteOrigenId === c.id && n.estado === 'autorizado') ?? items.find(n => n.comprobanteOrigenId === c.id)
      const old = c.estado !== 'autorizado' && Date.now() - Date.parse(c.fechaCreacion) > 3600000
      return <article key={c.id} className={`rounded-xl border p-4 space-y-3 ${old ? 'border-amber-400 bg-amber-50' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-wrap justify-between gap-2">
          <div><p className="font-bold">{c.tipo === 3 ? 'NC' : 'FC'} A · {c.numeroCompleto || 'Sin número autorizado'}</p>
            <p className="text-sm">{c.datos.receptor.razonSocial} · {formatFecha(c.fecha)} · {formatPeso(c.total)}</p></div>
          <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${fiscalStatusClass(c.estado, nc?.estado === 'autorizado')}`}>{nc?.estado === 'autorizado' ? 'Acreditada totalmente' : fiscalLabels[c.estado] || c.estado}</span>
        </div>
        {c.estado !== 'autorizado' && (c.ultimoError || old) && <details className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <summary className="cursor-pointer font-medium">{['rechazado', 'requiere_atencion'].includes(c.estado) ? 'Revisar motivo' : 'Información de la emisión pendiente'}</summary>
          {c.ultimoError && <p className="mt-2">{c.ultimoError}</p>}
          {c.proximoIntento && <p className="mt-2">Próximo intento: {new Date(c.proximoIntento).toLocaleString('es-AR')}</p>}
          {old && <p className="mt-2">Pendiente hace más de una hora. {c.proximoIntento ? 'Los reintentos siguen activos.' : 'Requiere revisión.'}</p>}
        </details>}
        {c.errorPdf && <p className="text-sm text-amber-800">El comprobante está autorizado. El PDF todavía no está disponible.</p>}
        <div className="flex flex-wrap gap-2">
          {c.pdfDisponible && <button disabled={busy} className={button} onClick={() => run(() => api.download(`/api/facturacion/${c.id}/pdf`, `${c.tipo === 3 ? 'NC' : 'FC'}-A-${c.numeroCompleto}.pdf`), 'PDF descargado')}>Descargar PDF</button>}
          {c.estado !== 'rechazado' && c.estado !== 'en_proceso' && (c.estado !== 'autorizado' || !c.pdfDisponible || c.errorPdf) && <button disabled={busy} className={button} onClick={() => run(() => api.post(`/api/facturacion/${c.id}/reintentar`), 'Reintento solicitado. El proceso continuará en segundo plano.')}>{c.estado === 'autorizado' ? 'Regenerar PDF' : 'Reintentar ahora'}</button>}
          {['rechazado', 'requiere_atencion'].includes(c.estado) && !c.numero && <button className={button} onClick={() => open(c, 'corregir')}>Corregir y confirmar</button>}
          {isAdmin && c.tipo === 1 && c.estado === 'autorizado' && !nc && <button className={button} onClick={() => open(c, 'nc')}>Emitir NC total</button>}
          {isAdmin && c.tipo === 1 && nc?.estado === 'autorizado' && nc.efectoComercial === 'correccion_fiscal' && !items.some(r => r.reemplazaId === c.id) && <button className={button} onClick={() => open(c, 'reemplazar')}>Emitir factura de reemplazo</button>}
          {!ventaId && c.ventaId && <Link className={button} href={`/interno/ventas/${c.ventaId}`}>Ver venta</Link>}
        </div>
      </article>
    })}
    {total > 50 && <div className="flex items-center gap-3"><button className={button} disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>Anterior</button><span>Página {pagina}</span><button className={button} disabled={pagina * 50 >= total} onClick={() => setPagina(p => p + 1)}>Siguiente</button></div>}
    <Dialog open={!!selected} onOpenChange={v => { if (!v && !busy) setSelected(null) }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle>{selected?.action === 'nc' ? 'Confirmar nota de crédito total' : 'Revisar y confirmar factura'}</DialogTitle>
        {selected && <>
          <FacturaResumen comprobante={selected.c} />
          {selected.action === 'nc' && <div className="space-y-3">
            <label className="block text-sm">Motivo<textarea className="w-full border rounded p-2" value={motivo} maxLength={500} onChange={e => setMotivo(e.target.value)} /></label>
            <label className="block text-sm">Efecto de la nota de crédito<select className="w-full border rounded p-2" value={efecto} onChange={e => setEfecto(e.target.value)}>
              <option value="">Seleccionar…</option><option value="anular_venta">Anular la venta: descontar deuda / generar saldo a favor</option><option value="correccion_fiscal">Corregir factura: conservar venta y deuda, para refacturar</option>
            </select></label>
            <p className="text-sm">Se emitirá una NC por el total. No devuelve mercadería al stock ni reintegra dinero automáticamente.</p>
            <button className={button} disabled={busy || !motivo.trim() || !efecto} onClick={() => run(() => api.post(`/api/facturacion/${selected.c.id}/nota-credito`, { motivo, efectoComercial: efecto }), 'Nota de crédito solicitada. Su efecto se aplica al autorizarse.')}>{busy ? 'Procesando…' : 'Confirmar y emitir NC total'}</button>
          </div>}
          {['corregir', 'reemplazar'].includes(selected.action) && <div className="space-y-3">
            <ReceptorFields value={receptor} onChange={setReceptor} disabled={busy || selected.c.tipo === 3} />
            <label className="block text-sm">Fecha confirmada<input className="block border rounded p-2" type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></label>
            {descripciones.map((d, i) => <label key={i} className="block text-sm">Descripción fiscal {i + 1}<input className="w-full border rounded p-2" maxLength={300} value={d} onChange={e => setDescripciones(p => p.map((v, n) => n === i ? e.target.value : v))} /></label>)}
            <label className="block text-sm">Observaciones<textarea className="w-full border rounded p-2" maxLength={500} value={observaciones} onChange={e => setObservaciones(e.target.value)} /></label>
            <p className="text-sm">Los importes se conservan. La emisión usará el emisor original y los datos confirmados arriba.</p>
            <button className={button} disabled={busy} onClick={() => run(() => api.post(`/api/facturacion/${selected.c.id}/${selected.action}`, { receptor, descripciones, observaciones, fecha }), 'Datos confirmados. Emisión en cola.')}>{busy ? 'Procesando…' : 'Confirmar datos y solicitar emisión'}</button>
          </div>}
          {error && <p role="alert" className="text-red-700">{error}</p>}
        </>}
      </DialogContent>
    </Dialog>
  </section>
}
