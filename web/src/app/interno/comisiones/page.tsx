'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { formatFecha } from '@/lib/format'
import { ComisionDocumento, ComisionFiltro, ComisionPreview, ComisionSaldo, hoyComisiones, numeroDocumento, tipoDocumento, formatComision as formatPeso } from '@/lib/comisiones'
import { VentaComisionCard } from '@/components/interno/comisiones/VentaComisionCard'
import { PagoAccion, PagoComisionDialog, PagoPendiente } from '@/components/interno/comisiones/PagoComisionDialog'

type Vendedor = { id: string; nombre: string; tarifa: number }
const field = 'border rounded-lg px-3 py-2 bg-white text-sm'
const button = 'border rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-slate-50'

export default function ComisionesPage() {
  const { usuario, isAdmin, canSeeComisiones } = useAuth()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [vendedorId, setVendedorId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState(hoyComisiones)
  const [clienteId, setClienteId] = useState('')
  const [ventasIds, setVentasIds] = useState<string[] | null>(null)
  const [tab, setTab] = useState('calculo')
  const [preview, setPreview] = useState<{ key: string; data: ComisionPreview } | null>(null)
  const [saldo, setSaldo] = useState<ComisionSaldo | null>(null)
  const [historial, setHistorial] = useState<{ total: number; documentos: ComisionDocumento[] }>({ total: 0, documentos: [] })
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [expanded, setExpanded] = useState<string[]>([])
  const [detalle, setDetalle] = useState<ComisionDocumento | null>(null)
  const [accion, setAccion] = useState<PagoAccion | null>(null)
  const [pendiente, setPendiente] = useState<PagoPendiente>()
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const storageKey = `kimar_comision_pendiente_${usuario?.id}`
  const filtro: ComisionFiltro = useMemo(() => ({ vendedorId, hasta, desde: desde || null, clienteIds: clienteId ? [clienteId] : null, ventaIds: ventasIds }), [vendedorId, hasta, desde, clienteId, ventasIds])
  const filterKey = JSON.stringify(filtro)
  const p = preview?.key === filterKey ? preview.data : null

  useEffect(() => {
    if (!canSeeComisiones) return
    const abort = new AbortController()
    setCargando(true)
    api.get<Vendedor[]>('/api/comisiones/vendedores', abort.signal).then(rows => {
      setVendedores(rows); setVendedorId(rows[0]?.id ?? '')
    }).catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setCargando(false) })
    return () => abort.abort()
  }, [canSeeComisiones, usuario?.id])

  useEffect(() => {
    if (!isAdmin) return
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      try { const pending = JSON.parse(raw) as PagoPendiente; setPendiente(pending); setAccion(pending.accion) }
      catch { setError('No se pudo recuperar la confirmación pendiente. Revisá el historial antes de registrar otro pago.') }
    }
  }, [storageKey, isAdmin])

  useEffect(() => {
    if (!isAdmin || !vendedorId) return
    let active = true
    setPreview(null); setError('')
    api.post<ComisionPreview>('/api/comisiones/preview', filtro).then(data => { if (active) setPreview({ key: filterKey, data }) })
      .catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [isAdmin, vendedorId, filtro, filterKey, refresh])

  useEffect(() => {
    if (!canSeeComisiones || !vendedorId) return
    const abort = new AbortController()
    setHistorial({ total: 0, documentos: [] }); setSaldo(null); setCargando(true)
    Promise.all([
      api.get<{ total: number; documentos: ComisionDocumento[] }>(`/api/comisiones/historial?vendedorId=${vendedorId}&pagina=${pagina}`, abort.signal),
      api.get<ComisionSaldo>(`/api/comisiones/saldos?vendedorId=${vendedorId}`, abort.signal),
    ]).then(([history, balance]) => { setHistorial(history); setSaldo(balance) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) }).finally(() => { if (!abort.signal.aborted) setCargando(false) })
    return () => abort.abort()
  }, [canSeeComisiones, vendedorId, pagina, refresh])

  function cambiarVendedor(id: string) {
    setVendedorId(id); setClienteId(''); setVentasIds(null); setExpanded([]); setPagina(1); setDetalle(null); setMensaje('')
  }
  function toggle(id: string) { setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  async function descargar(d: ComisionDocumento) {
    try { await api.download(`/api/comisiones/${d.id}/pdf`, `Kimar-Comisiones-${numeroDocumento(d.numero)}.pdf`) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo descargar el PDF.') }
  }
  function success(d: ComisionDocumento) {
    setAccion(null); setPendiente(undefined); setDetalle(d.tipo === 'anticipo' ? null : d); setTab('historial'); setPagina(1)
    setMensaje(`${tipoDocumento[d.tipo]} N° ${numeroDocumento(d.numero)} registrada.`); setRefresh(n => n + 1)
  }
  if (!canSeeComisiones) return <p>No tenés acceso a esta sección.</p>
  const clientes = [...new Map((p?.ventas ?? []).map(v => [v.clienteId, v.cliente])).entries()]
  const visibles = (p?.ventas ?? []).filter(v => v.pendiente < 0 || (v.fecha <= hasta && (!desde || v.fecha >= desde) && (!clienteId || v.clienteId === clienteId)))
  return <div className="space-y-6">
    <header className="flex justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-bold text-slate-900">{isAdmin ? 'Comisiones de vendedores' : 'Mis liquidaciones'}</h1>
      <p className="text-sm text-slate-500">{isAdmin ? 'Liquidaciones, pagos a cuenta y comisiones por kilo' : 'Constancias de pago y compensación de anticipos'}</p></div>
      <button className={button} onClick={() => setRefresh(n => n + 1)}>Actualizar</button>
    </header>
    {error && <p role="alert" className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-4">{error}</p>}
    {mensaje && <p role="status" className="bg-green-50 text-green-800 rounded-lg p-4">{mensaje}</p>}
    {vendedores.length === 0 ? <p>{cargando ? 'Cargando…' : 'No hay un esquema de comisión habilitado para esta cuenta.'}</p> : <>
      {isAdmin && <div className="flex gap-3 items-center flex-wrap"><label className="text-sm">Vendedor <select className={field} value={vendedorId} onChange={e => cambiarVendedor(e.target.value)}>{vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre} · {formatPeso(v.tarifa)}/kg</option>)}</select></label>
        <button className={button} aria-pressed={tab === 'calculo'} onClick={() => setTab('calculo')}>Calcular y liquidar</button>
        <button className={button} aria-pressed={tab === 'historial'} onClick={() => setTab('historial')}>Historial de pagos</button></div>}
      {isAdmin && tab === 'calculo' ? <>
        <div className="flex gap-4 flex-wrap bg-white border rounded-xl p-4">
          <label className="text-sm">Entrega desde (opcional)<input aria-label="Entrega desde" type="date" max={hasta} className={`${field} block`} value={desde} onChange={e => { setDesde(e.target.value); setVentasIds(null) }} /></label>
          <label className="text-sm">Corte de entrega y cobros<input aria-label="Fecha de corte" type="date" max={hoyComisiones()} className={`${field} block`} value={hasta} onChange={e => { setHasta(e.target.value); setVentasIds(null) }} /></label>
          <label className="text-sm">Cliente<select className={`${field} block`} value={clienteId} onChange={e => { setClienteId(e.target.value); setVentasIds(null) }}><option value="">Todos los clientes</option>{clientes.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
        </div>
        {!p ? <p>{error ? 'Revisá los filtros y actualizá el cálculo.' : 'Calculando…'}</p> : <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{[
            ['Comisión total', p.total], ['Comisión sobre lo cobrado', p.habilitada], ['Ya liquidado (histórico)', p.liquidada],
            ['Dinero pagado (histórico)', p.pagado], ['Anticipos pendientes de compensar', p.anticiposPendientes],
            ['Otros pagos a recuperar', p.ajusteAnterior], ['Comisión de esta liquidación', p.comision], ['Neto a pagar', p.neto],
          ].map(([label, value]) => <div key={label} className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500">{label}</p><strong className="text-xl">{formatPeso(Number(value))}</strong></div>)}</div>
          <p className="text-sm text-slate-600">Se habilitan $500 por kg en proporción a lo cobrado. Los productos por unidad no generan comisión. Los ajustes negativos se incluyen aunque estén fuera de los filtros.</p>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between gap-3 flex-wrap">
            <div><strong>A compensar: {formatPeso(p.compensado)}</strong><p className="text-sm">Neto a pagar: {formatPeso(p.neto)}</p></div>
            <div className="flex gap-2 flex-wrap"><button className={button} disabled={p.limiteAnticipo <= 0} onClick={() => setAccion({ titulo: 'Registrar pago a cuenta', path: '/api/comisiones/anticipos', body: { vendedorId }, monto: 0, manual: true, limite: p.limiteAnticipo, requiereMotivo: true, advertencia: 'Registrá dinero efectivamente entregado. Se descontará automáticamente de futuras liquidaciones.' })}>Pago a cuenta</button>
              <button className="bg-slate-900 text-white rounded-lg px-4 py-2 disabled:opacity-40" disabled={!p.ventas.some(v => v.incluida && v.pendiente !== 0)} onClick={() => setAccion({ titulo: 'Confirmar liquidación y pago', path: '/api/comisiones/liquidaciones', body: { filtro, huella: p.huella }, monto: p.neto, liquidacion: { comision: p.comision, compensado: p.compensado, ajusteAnterior: p.ajusteAnterior }, minimoFecha: hasta, advertencia: `Comisión: ${formatPeso(p.comision)}. Compensaciones: ${formatPeso(p.compensado)}. Se registrará el pago neto indicado y se generará la constancia.` })}>Revisar y confirmar</button></div>
          </div>
          <section className="space-y-3"><div className="flex gap-3 items-center flex-wrap"><h2 className="font-semibold">Ventas incluidas ({visibles.length})</h2><button className={button} onClick={() => setExpanded(visibles.map(v => v.ventaId))}>Expandir todas</button><button className={button} onClick={() => setExpanded([])}>Colapsar todas</button><button className={button} onClick={() => setVentasIds(null)}>Seleccionar todas</button></div>
            {visibles.length === 0 && <p className="text-sm text-slate-500">No hay ventas en este período.</p>}
            {visibles.map(v => <VentaComisionCard key={v.ventaId} venta={v} expanded={expanded.includes(v.ventaId)} onToggle={() => toggle(v.ventaId)} selected={v.incluida} onSelect={() => setVentasIds(prev => { const ids = prev ?? p.ventas.filter(x => x.incluida).map(x => x.ventaId); return ids.includes(v.ventaId) ? ids.filter(id => id !== v.ventaId) : [...ids, v.ventaId] })} />)}
          </section>
        </>}
      </> : <>
        {saldo && <div className="bg-white border rounded-xl p-4 space-y-2"><p>Dinero pagado: <strong>{formatPeso(saldo.pagado)}</strong> · Anticipos sin compensar: <strong>{formatPeso(saldo.anticiposPendientes)}</strong></p>
          {saldo.ajusteAnterior > 0 && <p>Otros pagos a recuperar: {formatPeso(saldo.ajusteAnterior)}</p>}
          {saldo.anticipos.map(a => <div className="flex items-center gap-3 flex-wrap text-sm" key={a.id}><p>Pago a cuenta N° {numeroDocumento(a.numero)} · {formatFecha(a.fecha)} · Comisión adelantada: {formatPeso(a.monto)} · Pendiente: {formatPeso(a.pendiente)}</p>
            {isAdmin && pagina === 1 && historial.documentos[0]?.id === a.id && <button className={button} onClick={() => setAccion({ titulo: 'Registrar devolución recibida', path: `/api/comisiones/${a.id}/contrapartida`, body: {}, monto: -a.pendiente, minimoFecha: a.fecha, requiereMotivo: true, advertencia: 'Confirmá únicamente si el vendedor devolvió efectivamente el saldo pendiente de este adelanto.' })}>Registrar devolución</button>}
          </div>)}</div>}
        <div className="space-y-3 md:hidden">{historial.documentos.map(d => <article key={d.id} className="bg-white border rounded-xl p-4 space-y-3">
          <div><strong>{tipoDocumento[d.tipo]} N° {numeroDocumento(d.numero)}</strong><p className="text-sm text-slate-500">{formatFecha(d.fecha)}</p></div>
          <dl className="grid grid-cols-2 gap-2 text-sm"><dt>Comisión</dt><dd className="text-right">{formatPeso(d.comision)}</dd><dt>Compensado</dt><dd className="text-right">{formatPeso(d.compensado)}</dd><dt>{d.tipo === 'anticipo' ? 'Comisión adelantada' : 'Pago'}</dt><dd className="text-right font-bold">{formatPeso(d.pago)}</dd><dt>Forma de pago</dt><dd className="text-right">{d.formaPago ?? 'Sin pago'}</dd></dl>
          <div className="flex gap-2">{d.tipo !== 'anticipo' && <button className={button} onClick={() => { setDetalle(d); setExpanded([]) }}>Detalle</button>}<button className={button} onClick={() => descargar(d)}>PDF</button></div>
        </article>)}</div>
        <div className="hidden md:block bg-white border rounded-xl overflow-x-auto"><table className="w-full min-w-[760px] text-sm [&_th]:px-3 [&_td]:px-3"><thead><tr className="text-left bg-slate-50"><th className="p-3">Constancia</th><th>Fecha</th><th>Comisión</th><th>Compensado</th><th>Importe</th><th>Acciones</th></tr></thead><tbody>
          {historial.documentos.map(d => <tr key={d.id} className="border-t"><td className="p-3">{tipoDocumento[d.tipo]}<strong className="block">N° {numeroDocumento(d.numero)}</strong></td><td>{formatFecha(d.fecha)}</td><td>{formatPeso(d.comision)}</td><td>{formatPeso(d.compensado)}</td><td>{d.tipo === 'anticipo' && <span className="block text-xs text-slate-500">Comisión adelantada</span>}{formatPeso(d.pago)}<span className="block text-xs">{d.formaPago ?? 'Sin pago'}</span></td><td>{d.tipo !== 'anticipo' && <button className={button} onClick={() => { setDetalle(d); setExpanded([]) }}>Detalle</button>} <button className={button} onClick={() => descargar(d)}>PDF</button></td></tr>)}
        </tbody></table></div>
        {!historial.documentos.length && <p className="p-6 text-slate-500">{cargando ? 'Cargando…' : 'Todavía no hay movimientos registrados.'}</p>}
        <div className="flex items-center gap-3"><button className={button} disabled={pagina === 1 || cargando} onClick={() => setPagina(n => n - 1)}>Anterior</button><span className="text-sm">Página {pagina} · {historial.total} movimientos</span><button className={button} disabled={pagina * 30 >= historial.total || cargando} onClick={() => setPagina(n => n + 1)}>Siguiente</button></div>
      </>}
      {detalle && <section className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex justify-between gap-3"><h2 className="font-bold">{tipoDocumento[detalle.tipo]} N° {numeroDocumento(detalle.numero)} · {detalle.datos.vendedor}</h2><button className={button} onClick={() => setDetalle(null)}>Cerrar detalle</button></div>
        <p className="text-sm">{formatFecha(detalle.fecha)} · {detalle.formaPago ?? 'Sin movimiento de dinero'} · Referencia: {detalle.referencia ?? '—'}</p>
        <p>Comisión: {formatPeso(detalle.comision)} · Compensado: {formatPeso(detalle.compensado)} · Pago: <strong>{formatPeso(detalle.pago)}</strong></p>
        {detalle.tipo === 'liquidacion' && detalle.datos.compensarAdelantos === false && <p className="text-sm text-slate-600">Se liquidó sin compensar adelantos. Los adelantos conservan su saldo pendiente.</p>}
        {detalle.motivo && <p className="text-sm whitespace-pre-wrap">{detalle.motivo}</p>}
        {detalle.origenId && <p className="text-xs">Documento relacionado: {detalle.origenId}</p>}
        {detalle.datos.aplicaciones.map(a => <p key={a.id} className="text-sm">Anticipo N° {numeroDocumento(a.numero)}: aplicado {formatPeso(a.monto)} · Saldo al emitir: {formatPeso(a.pendiente)}</p>)}
        {detalle.datos.ventas.map(v => <VentaComisionCard key={v.ventaId} venta={v} expanded={expanded.includes(v.ventaId)} onToggle={() => toggle(v.ventaId)} />)}
        <div className="flex gap-3"><button className={button} onClick={() => descargar(detalle)}>Descargar constancia PDF</button>
          {isAdmin && pagina === 1 && historial.documentos[0]?.id === detalle.id && ['liquidacion', 'anticipo'].includes(detalle.tipo) && <button className={button} onClick={() => setAccion({ titulo: detalle.tipo === 'anticipo' ? 'Registrar devolución recibida' : 'Registrar contrapartida', path: `/api/comisiones/${detalle.id}/contrapartida`, body: {}, monto: detalle.tipo === 'anticipo' ? -(saldo?.anticipos.find(a => a.id === detalle.id)?.pendiente ?? 0) : 0, minimoFecha: detalle.fecha, requiereMotivo: true, advertencia: detalle.tipo === 'anticipo' ? 'Confirmá únicamente si el vendedor devolvió efectivamente el saldo pendiente de este anticipo.' : 'Revierte la comisión liquidada, conserva el documento original y deja el dinero entregado a cuenta. No registra devolución de dinero.' })}>{detalle.tipo === 'anticipo' ? 'Registrar devolución' : 'Corregir liquidación'}</button>}
        </div>
      </section>}
    </>}
    {accion && <PagoComisionDialog accion={accion} pendiente={pendiente} storageKey={storageKey} onClose={() => { setAccion(null); setPendiente(undefined); setRefresh(n => n + 1) }} onSuccess={success} />}
  </div>
}
