'use client'

import { useState } from 'react'
import { QueryState, useApiQuery } from '@/components/interno/QueryState'
import { DocumentosVenta } from '@/components/interno/DocumentosVenta'
import { ComisionesPendientesCobro, formatComision } from '@/lib/comisiones'
import { formatFecha } from '@/lib/format'
import { estadoEntregaConfig } from '@/lib/entregas'

export function PendientesCobro({ vendedorId, revision }: { vendedorId: string; revision: number }) {
  const [cliente, setCliente] = useState('')
  const [estado, setEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const params = new URLSearchParams({ vendedorId, pagina: String(pagina) })
  if (cliente) params.set('clienteId', cliente)
  if (estado) params.set('estadoEntrega', estado)
  const query = useApiQuery<ComisionesPendientesCobro>(`/api/comisiones/pendientes-cobro?${params}`, revision)
  const data = query.data
  const button = 'rounded-lg border px-4 py-2 text-sm disabled:opacity-40'
  return <section className="space-y-4" aria-label="Comisiones pendientes de cobro">
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 space-y-2">
      <h2 className="font-semibold">Comisiones estimadas pendientes del cobro al cliente</h2>
      <p className="text-sm">No son importes disponibles para liquidar y pueden variar por cambios en la venta. Incluye ventas desde su registro, aunque todavía no estén entregadas.</p>
      <p className="text-sm">Los anticipos no se descuentan de este resumen: se compensan al liquidar.</p>
    </div>
    <div className="flex flex-wrap gap-4 rounded-xl border bg-white p-4">
      <label className="text-sm">Cliente<select className="mt-1 block rounded-lg border bg-white px-3 py-2" value={cliente} onChange={e => { setCliente(e.target.value); setPagina(1) }}>
        <option value="">Todos los clientes</option>
        {cliente && !data?.clientes.some(c => c.id === cliente) && <option value={cliente}>Cliente seleccionado</option>}
        {data?.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select></label>
      <label className="text-sm">Estado de entrega<select className="mt-1 block rounded-lg border bg-white px-3 py-2" value={estado} onChange={e => { setEstado(e.target.value); setPagina(1) }}>
        <option value="">Todos los estados</option><option value="pendiente">En preparación</option><option value="listo">Listo para entrega</option><option value="entregado">Entregado</option>
      </select></label>
    </div>
    <QueryState loading={query.loading} error={query.error} retry={query.retry} />
    {!query.loading && !query.error && data && <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-600">Ventas pendientes de cobro</p><strong className="text-2xl">{data.total}</strong></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm text-amber-900">Comisión pendiente del cobro al cliente</p><strong className="text-2xl text-amber-950">{formatComision(data.comisionPendiente)}</strong></div>
      </div>
      {!data.total && <p className="rounded-xl border bg-white p-6 text-slate-600">No hay comisiones pendientes de cobro con estos filtros. Las ventas totalmente cobradas se consultan en las liquidaciones.</p>}
      {data.items.map(row => {
        const v = row.venta
        const entrega = estadoEntregaConfig[row.estadoEntrega]
        return <article key={v.ventaId} className="rounded-xl border bg-white p-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold">{v.cliente}</h3><div className="text-sm text-slate-600"><DocumentosVenta nroRemito={v.remito} nroFactura={v.factura} /></div></div>
            <div className="space-y-1 text-sm"><p>Entrega prevista: {formatFecha(v.fecha)}</p><span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${entrega.className}`}>{entrega.label}</span></div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            {([
              ['Kilos', `${v.kilos.toLocaleString('es-AR')} kg`], ['Tarifa por kg', formatComision(v.tarifa)], ['Comisión total estimada', formatComision(v.total)],
              ['Total de la venta', formatComision(v.totalVenta)], ['Cobrado al cliente', formatComision(v.cobrado)], ['Saldo por cobrar al cliente', formatComision(row.saldoCliente)],
              ['Comisión asociada a lo cobrado', formatComision(row.comisionSobreCobros)], ['Comisión ya liquidada', formatComision(v.liquidada)],
            ] as const).map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="font-medium">{value}</dd></div>)}
            <div className="rounded-lg bg-amber-50 p-2"><dt className="text-amber-900">Comisión pendiente de cobro</dt><dd className="font-bold text-amber-950">{formatComision(row.pendienteCobro)}</dd></div>
          </dl>
          <p className="text-xs text-slate-500">La comisión asociada a cobros no representa un pago nuevo: puede estar liquidada o sujeta a compensaciones y a las condiciones de liquidación.</p>
          <details className="border-t pt-3"><summary className="cursor-pointer text-sm font-medium text-blue-800">Ver productos y cobros</summary>
            <ul className="mt-3 space-y-2 text-sm">{v.items.map((item, index) => <li key={index}>{item.nombre} · {item.cantidad} {item.unidad} · Comisión: {formatComision(item.comision)}{item.unidad !== 'kg' && ' (sin comisión por kilo)'}</li>)}</ul>
            <h4 className="mt-4 font-medium text-sm">Cobros registrados</h4>
            {v.cobros.length ? <ul className="mt-2 space-y-1 text-sm">{v.cobros.map(c => <li key={c.id}>{c.fecha ? formatFecha(c.fecha) : 'Sin fecha'} · {formatComision(c.monto)}</li>)}</ul> : <p className="text-sm text-slate-500">Sin cobros registrados.</p>}
          </details>
        </article>
      })}
      <nav aria-label="Páginas de comisiones pendientes" className="flex flex-wrap items-center gap-3">
        <button type="button" className={button} disabled={data.pagina <= 1} onClick={() => setPagina(data.pagina - 1)}>Anterior</button>
        <span className="text-sm">Página {data.pagina} de {Math.max(1, Math.ceil(data.total / 30))} · {data.total} ventas</span>
        <button type="button" className={button} disabled={data.pagina * 30 >= data.total} onClick={() => setPagina(data.pagina + 1)}>Siguiente</button>
      </nav>
    </>}
  </section>
}
