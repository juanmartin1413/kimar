'use client'

import { ComisionVenta, formatComision as formatPeso } from '@/lib/comisiones'
import { formatFecha } from '@/lib/format'

export function VentaComisionCard({ venta: v, expanded, onToggle, selected, onSelect }: {
  venta: ComisionVenta; expanded: boolean; onToggle: () => void; selected?: boolean; onSelect?: () => void
}) {
  return <article className="rounded-xl border bg-white overflow-hidden">
    <div className="bg-slate-900 text-white px-4 py-3 flex gap-3 items-start flex-wrap">
      {onSelect && <input aria-label={`Incluir venta ${v.remito ?? v.cliente}`} type="checkbox" checked={selected} onChange={onSelect} disabled={v.pendiente < 0} className="mt-1" />}
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="text-left flex-1 min-w-48">
        <strong>{expanded ? '▾' : '▸'} {v.cliente}</strong>
        <span className="block text-xs text-slate-300">{formatFecha(v.fecha)} · Remito {v.remito ?? '—'} · {v.kilos.toLocaleString('es-AR')} kg</span>
        <span className="text-xs">{v.cobrado >= v.totalVenta ? 'Cobrado' : v.cobrado > 0 ? 'Cobro parcial' : 'Pendiente de cobro'} · {expanded ? 'Ocultar detalle' : 'Ver detalle'}</span>
      </button>
      <div className="text-xs flex flex-wrap gap-4">
        <span>Comisión total<strong className="block text-sm">{formatPeso(v.total)}</strong></span>
        <span>Comisión sobre lo cobrado<strong className="block text-sm">{formatPeso(v.habilitada)}</strong></span>
        <span>Ya liquidado<strong className="block text-sm">{formatPeso(v.liquidada)}</strong></span>
        <span>{v.pendiente < 0 ? 'Ajuste a recuperar' : 'En esta liquidación'}<strong className="block text-sm text-amber-200">{formatPeso(v.pendiente)}</strong></span>
      </div>
    </div>
    {expanded && <div className="p-4 space-y-3 overflow-x-auto">
      <p className="text-sm">Venta: {formatPeso(v.totalVenta)} · Cobrado: {formatPeso(v.cobrado)} · Factura: {v.factura ?? '—'}</p>
      <table className="w-full text-sm"><thead><tr className="text-left border-b"><th>Producto</th><th>Cantidad</th><th>Tarifa/kg</th><th>Comisión total</th></tr></thead>
        <tbody>{v.items.map((i, n) => <tr key={n} className="border-b"><td className="py-2">{i.nombre}</td><td>{i.cantidad} {i.unidad}</td><td>{i.unidad === 'kg' ? formatPeso(i.tarifa) : 'No aplica'}</td><td>{i.unidad === 'kg' ? formatPeso(i.comision) : 'Excluido: por unidad'}</td></tr>)}</tbody>
      </table>
      <p className="font-medium text-sm">Cobros considerados</p>
      {v.cobros.length ? v.cobros.map(c => <p className="text-sm" key={c.id}>{formatFecha(c.fecha)} · {formatPeso(c.monto)}</p>) : <p className="text-sm text-slate-500">Sin cobros registrados al corte.</p>}
    </div>}
  </article>
}
