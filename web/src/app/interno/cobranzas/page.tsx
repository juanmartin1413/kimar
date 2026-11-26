'use client'

import { useEffect, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Cobranza } from '@/lib/types'
import { api } from '@/lib/api'
import { PagoCliente, dinero } from '@/lib/cobranzas'
import { formatFecha, today } from '@/lib/format'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { CobranzaForm } from '@/components/interno/CobranzaForm'
import { AdjuntosPago } from '@/components/interno/AdjuntosPago'

export default function CobranzasPage() {
  const { data, refrescarCobros } = useData()
  const { canManageData } = useAuth()
  const [tab, setTab] = useState('agenda')
  const [filter, setFilter] = useState('todos')
  const [forma, setForma] = useState('')
  const [cliente, setCliente] = useState('')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [initial, setInitial] = useState<Cobranza>()
  const [pagos, setPagos] = useState<PagoCliente[]>([])
  const [detalle, setDetalle] = useState<PagoCliente | null>(null)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    if (canManageData) Promise.all([api.get<PagoCliente[]>('/api/cobranzas/pagos'), refrescarCobros()]).then(([p]) => { if (active) { setPagos(p); setError('') } }).catch(() => { if (active) setError('No se pudo actualizar la agenda y el historial. Reintentá para consultar los saldos actuales.') })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, canManageData])
  const pendientes = data.cobranzas.filter(c => c.estado === 'pendiente')
  const filas = pendientes.filter(c => (!cliente || c.clienteId === cliente) && (filter === 'todos' || (filter === 'vencido' ? c.fecha < today() : filter === 'hoy' ? c.fecha === today() : c.fecha > today()))).sort((a,b) => a.fecha.localeCompare(b.fecha))
  const historial = pagos.filter(p => (!cliente || p.clienteId === cliente) && (!forma || p.formaPago === forma))
  const button = 'rounded-lg border px-4 py-2 text-sm'
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Cobranzas</h1><p className="text-sm text-gray-600">Compromisos y pagos recibidos</p></div>
      <p className="rounded-lg bg-amber-50 border border-amber-200 p-3">Pendiente a cobrar: <strong>{dinero(pendientes.reduce((n,c) => n + c.monto, 0))}</strong></p>
      {canManageData && <button className={button + ' bg-blue-800 text-white'} onClick={() => { setInitial(undefined); setOpen(true) }}>Nueva cobranza</button>}
    </div>
    <div className="flex flex-wrap gap-2">
      <button className={button + (tab === 'agenda' ? ' bg-blue-100' : '')} onClick={() => setTab('agenda')}>Agenda de cobros</button>
      <button className={button + (tab === 'pagos' ? ' bg-blue-100' : '')} onClick={() => setTab('pagos')}>Pagos recibidos</button>
      <select aria-label="Filtrar por cliente" className={button} value={cliente} onChange={e => setCliente(e.target.value)}><option value="">Todos los clientes</option>{data.clientes.map(c => <option value={c.id} key={c.id}>{c.nombre}</option>)}</select>
      {tab === 'agenda' ? <select aria-label="Filtrar vencimientos" className={button} value={filter} onChange={e => setFilter(e.target.value)}><option value="todos">Todos los pendientes</option><option value="vencido">Vencidos</option><option value="hoy">Hoy</option><option value="proximo">Próximos</option></select>
        : <select aria-label="Filtrar medio de pago" className={button} value={forma} onChange={e => setForma(e.target.value)}><option value="">Todos los medios</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="cheque">Cheque</option></select>}
    </div>
    {error && <p role="alert" className="text-red-700">{error} <button className="underline" onClick={() => setRevision(n => n+1)}>Reintentar</button></p>}
    <div className="rounded-xl border bg-white overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="text-left bg-gray-50"><th className="p-3">{tab === 'agenda' ? 'Vencimiento' : 'Fecha de pago'}</th><th>Cliente</th><th>{tab === 'agenda' ? 'Saldo pendiente' : 'Monto recibido'}</th><th>{tab === 'agenda' ? 'Venta / estado' : 'Medio'}</th><th /></tr></thead>
      <tbody>{tab === 'agenda' ? filas.map(c => {
        const venta = data.ventas.find(v => v.id === c.ventaId)
        const parcial = venta?.estado === 'cobrado_parcial'
        return <tr key={c.id} className="border-t"><td className="p-3">{formatFecha(c.fecha)}</td><td>{data.clientes.find(x => x.id === c.clienteId)?.nombre}</td><td className="font-semibold">{dinero(c.monto)}</td>
          <td>Remito {venta?.nroRemito ?? '—'}<p className={c.fecha < today() ? 'text-red-700' : 'text-amber-800'}>{c.fecha < today() ? 'Vencido' : 'Pendiente'}{parcial ? ' · Pago parcial' : ''}</p></td>
          <td className="p-3">{canManageData && <button className="text-blue-800 underline" onClick={() => { setInitial(c); setOpen(true) }}>Cobrar</button>}</td></tr>
      }) : historial.map(p => <tr key={p.id} className="border-t"><td className="p-3">{formatFecha(p.fecha)}</td><td>{p.clienteNombre}</td><td className="font-semibold">{dinero(p.monto)}</td><td>{p.formaPago}</td><td className="p-3"><button className="text-blue-800 underline" onClick={() => setDetalle(p)}>Detalle y comprobantes</button></td></tr>)}
      {(tab === 'agenda' ? !filas.length : !historial.length) && <tr><td colSpan={5} className="p-10 text-center text-gray-500">Sin registros en esta categoría.</td></tr>}
      </tbody></table></div>
    <Dialog open={open} onOpenChange={v => { if (!busy) setOpen(v) }}><DialogContent showCloseButton={!busy} className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"><DialogTitle>{initial ? 'Cobrar compromiso' : 'Nueva cobranza'}</DialogTitle>
      <CobranzaForm initial={initial} onBusy={setBusy} onDone={() => { setOpen(false); setRevision(n => n + 1) }} />
    </DialogContent></Dialog>
    <Dialog open={!!detalle} onOpenChange={v => { if (!v) setDetalle(null) }}><DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto"><DialogTitle>Detalle del pago</DialogTitle>
      {detalle && <><p>{detalle.clienteNombre} · {formatFecha(detalle.fecha)} · {detalle.formaPago}</p><p className="font-bold">{dinero(detalle.monto)}</p>{detalle.observaciones && <p>{detalle.observaciones}</p>}
        {detalle.imputaciones.map(i => <p key={i.cobranzaId}>Remito {i.nroRemito ?? '—'}: {dinero(i.monto)}</p>)}<AdjuntosPago pagoId={detalle.id} /></>}
    </DialogContent></Dialog>
  </div>
}
