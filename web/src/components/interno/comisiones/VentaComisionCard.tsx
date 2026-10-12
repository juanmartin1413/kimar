'use client'

import Link from 'next/link'
import { Download, Pencil } from 'lucide-react'
import { Producto, Vendedor } from '@/lib/types'
import { ModoPeriodo, VentaComision, formatCantidad } from '@/lib/comisiones'
import { formatFecha, formatPeso } from '@/lib/format'
import { downloadRemito } from '@/lib/remitoPdf'
import { cn } from '@/lib/utils'

interface Props {
  item: VentaComision
  modo: ModoPeriodo
  vendedor: Vendedor
  productos: Producto[]
}

const estadoVentaConfig = {
  debe: { label: 'DEBE', className: 'bg-red-100 text-red-700' },
  cobrado_parcial: { label: 'PARCIAL', className: 'bg-orange-100 text-orange-700' },
  pagado: { label: 'PAGADO', className: 'bg-green-100 text-green-700' },
}

const estadoCobranzaConfig = {
  pendiente: { label: 'PENDIENTE', className: 'bg-yellow-100 text-yellow-700' },
  cobrado: { label: 'COBRADO', className: 'bg-green-100 text-green-700' },
  vencido: { label: 'VENCIDO', className: 'bg-red-100 text-red-700' },
}

const formaPagoLabel = { efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque' }

const thClass = 'text-left py-2 px-3 text-xs font-semibold text-[oklch(0.4_0.06_240)]'
const tdClass = 'py-2 px-3 text-sm text-[oklch(0.35_0.04_240)]'

export function VentaComisionCard({ item, modo, vendedor, productos }: Props) {
  const { venta, cliente, cobranzas } = item
  const cfg = estadoVentaConfig[venta.estado]
  const puedeDescargarRemito = !!venta.nroRemito && !!cliente

  return (
    <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
      <div className="bg-[oklch(0.18_0.06_240)] text-white px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold tabular-nums">{formatFecha(venta.fechaEntrega)}</span>
          <span className="font-bold">{cliente?.nombre ?? '—'}</span>
          <span className="text-xs text-[oklch(0.75_0.08_240)]">
            Remito {venta.nroRemito ?? '—'}{venta.nroFactura ? ` · Factura ${venta.nroFactura}` : ''}
          </span>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.className)}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <p className="text-[oklch(0.75_0.08_240)]">Total</p>
              <p className="font-bold text-sm tabular-nums">{formatPeso(venta.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-[oklch(0.75_0.08_240)]">{modo === 'cobro' ? 'Cobrado en período' : 'Cobrado'}</p>
              <p className="font-bold text-sm tabular-nums text-green-300">{formatPeso(item.cobradoEnPeriodo)}</p>
            </div>
            <div className="text-right">
              <p className="text-[oklch(0.75_0.08_240)]">Pendiente</p>
              <p className={cn('font-bold text-sm tabular-nums', item.pendiente > 0 ? 'text-red-300' : 'text-white/60')}>{formatPeso(item.pendiente)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l border-white/20 pl-4">
            <button
              type="button"
              onClick={() => puedeDescargarRemito && downloadRemito(venta, cliente!, vendedor, productos)}
              disabled={!puedeDescargarRemito}
              className="text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={puedeDescargarRemito ? 'Descargar remito' : 'Sin N° de remito asignado'}
            >
              <Download className="w-4 h-4" />
            </button>
            <Link href={`/interno/ventas/${venta.id}`} className="text-white/80 hover:text-white transition-colors" title="Ver / editar venta">
              <Pencil className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[oklch(0.93_0.01_240)]">
        <table className="w-full">
          <thead>
            <tr className="bg-[oklch(0.97_0.01_240)]">
              <th className={thClass}>Producto</th>
              <th className={cn(thClass, 'text-right')}>Cantidad</th>
              <th className={cn(thClass, 'text-right')}>Precio</th>
              <th className={cn(thClass, 'text-right')}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venta.items.map(it => {
              const unidad = productos.find(p => p.id === it.productoId)?.unidad ?? 'kg'
              return (
                <tr key={it.id} className="border-t border-[oklch(0.95_0.01_240)]">
                  <td className={cn(tdClass, 'font-medium text-[oklch(0.25_0.06_240)]')}>{it.descripcion}</td>
                  <td className={cn(tdClass, 'text-right tabular-nums')}>{formatCantidad(it.cantidad, unidad)}</td>
                  <td className={cn(tdClass, 'text-right tabular-nums')}>{formatPeso(it.precioUnitario)}</td>
                  <td className={cn(tdClass, 'text-right tabular-nums font-semibold')}>{formatPeso(it.subtotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <table className="w-full">
          <thead>
            <tr className="bg-[oklch(0.97_0.01_240)]">
              <th className={thClass}>Vencimiento</th>
              <th className={thClass}>Cobrada el</th>
              <th className={thClass}>Forma</th>
              <th className={thClass}>Estado</th>
              <th className={cn(thClass, 'text-right')}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {cobranzas.length === 0 ? (
              <tr><td colSpan={5} className={cn(tdClass, 'text-center italic text-[oklch(0.55_0.04_240)]')}>Sin plan de cobro registrado</td></tr>
            ) : cobranzas.map(c => {
              const fueraDelPeriodo = modo === 'cobro' && c.estado === 'cobrado' && !item.cobranzasEnPeriodoIds.has(c.id)
              const ccfg = estadoCobranzaConfig[c.estado] ?? estadoCobranzaConfig.pendiente
              return (
                <tr key={c.id} className={cn('border-t border-[oklch(0.95_0.01_240)]', fueraDelPeriodo && 'opacity-50')} title={fueraDelPeriodo ? 'Cobrada fuera del período seleccionado' : undefined}>
                  <td className={cn(tdClass, 'tabular-nums')}>{formatFecha(c.fecha)}</td>
                  <td className={cn(tdClass, 'tabular-nums')}>{c.fechaCobro ? formatFecha(c.fechaCobro) : '—'}</td>
                  <td className={tdClass}>{formaPagoLabel[c.formaPago] ?? c.formaPago}</td>
                  <td className={tdClass}>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', ccfg.className)}>{ccfg.label}</span>
                    {fueraDelPeriodo && <span className="ml-1 text-xs text-[oklch(0.55_0.04_240)]">fuera del período</span>}
                  </td>
                  <td className={cn(tdClass, 'text-right tabular-nums font-semibold')}>{formatPeso(c.monto)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
