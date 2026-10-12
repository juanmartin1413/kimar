'use client'

import { AlertTriangle } from 'lucide-react'
import { CostosPorProducto, ResumenProductoConCosto, TotalesComisiones, formatCantidad, unidadLabel } from '@/lib/comisiones'
import { formatPeso } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  resumen: ResumenProductoConCosto[]
  costos: CostosPorProducto
  onCosto: (productoId: string, valor: string) => void
  totales: TotalesComisiones
}

const thClass = 'py-2.5 px-4 text-xs font-semibold text-[oklch(0.4_0.06_240)]'
const tdClass = 'py-2.5 px-4 text-sm text-[oklch(0.35_0.04_240)]'

export function ComisionesResumen({ resumen, costos, onCosto, totales }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[oklch(0.93_0.01_240)] flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-lg text-[oklch(0.2_0.06_240)]">Resumen por producto</h2>
          <p className="text-xs text-[oklch(0.5_0.04_240)]">
            Cantidades vendidas en el período. El costo de adquisición es una calculadora: se prellena con el último precio de compra y <strong>no se guarda</strong>.
          </p>
        </div>
        {totales.productosSinCosto > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {totales.productosSinCosto} producto{totales.productosSinCosto !== 1 ? 's' : ''} sin costo cargado
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[oklch(0.97_0.01_240)]">
              <th className={cn(thClass, 'text-left')}>Producto</th>
              <th className={cn(thClass, 'text-right')}>Cantidad</th>
              <th className={cn(thClass, 'text-right')}>Venta</th>
              <th className={cn(thClass, 'text-right')}>Costo adquisición</th>
              <th className={cn(thClass, 'text-right')}>Costo total</th>
              <th className={cn(thClass, 'text-right')}>Margen total</th>
              <th className={cn(thClass, 'text-right')} title="Margen prorrateado por lo cobrado de cada venta">Margen cobrado</th>
            </tr>
          </thead>
          <tbody>
            {resumen.length === 0 ? (
              <tr><td colSpan={7} className={cn(tdClass, 'text-center py-8 text-[oklch(0.55_0.04_240)]')}>Sin productos en el período</td></tr>
            ) : resumen.map(r => (
              <tr key={r.productoId} className="border-t border-[oklch(0.95_0.01_240)]">
                <td className={cn(tdClass, 'font-medium text-[oklch(0.25_0.06_240)]')}>{r.nombre}</td>
                <td className={cn(tdClass, 'text-right tabular-nums font-semibold')}>{formatCantidad(r.cantidad, r.unidad)}</td>
                <td className={cn(tdClass, 'text-right tabular-nums')}>{formatPeso(r.ventaTotal)}</td>
                <td className={cn(tdClass, 'text-right')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs text-[oklch(0.55_0.04_240)]">$</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={costos[r.productoId] ?? ''}
                      onChange={e => onCosto(r.productoId, e.target.value)}
                      placeholder="0"
                      className={cn(
                        'w-28 border rounded-lg px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]',
                        r.sinCosto ? 'border-amber-300 bg-amber-50' : 'border-[oklch(0.88_0.02_240)]',
                      )}
                    />
                    <span className="text-xs text-[oklch(0.55_0.04_240)] w-10">/{unidadLabel(r.unidad)}</span>
                  </div>
                </td>
                <td className={cn(tdClass, 'text-right tabular-nums')}>
                  {r.sinCosto
                    ? <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">sin costo</span>
                    : formatPeso(r.costoTotal)}
                </td>
                <td className={cn(tdClass, 'text-right tabular-nums', r.margen < 0 ? 'text-red-600' : 'text-[oklch(0.35_0.04_240)]')}>
                  {formatPeso(r.margen)}
                </td>
                <td className={cn(tdClass, 'text-right tabular-nums font-semibold', r.margenCobrado < 0 ? 'text-red-600' : 'text-[oklch(0.25_0.06_240)]')}>
                  {formatPeso(r.margenCobrado)}
                </td>
              </tr>
            ))}
          </tbody>
          {resumen.length > 0 && (
            <tfoot>
              <tr className="bg-[oklch(0.97_0.01_240)] border-t-2 border-[oklch(0.88_0.02_240)] font-bold text-[oklch(0.2_0.06_240)]">
                <td className={tdClass}>Totales</td>
                <td className={tdClass} />
                <td className={cn(tdClass, 'text-right tabular-nums')}>{formatPeso(totales.ventaTotal)}</td>
                <td className={tdClass} />
                <td className={cn(tdClass, 'text-right tabular-nums')}>{formatPeso(totales.costoTotal)}</td>
                <td className={cn(tdClass, 'text-right tabular-nums font-normal', totales.margenBruto < 0 && 'text-red-600')}>{formatPeso(totales.margenBruto)}</td>
                <td className={cn(tdClass, 'text-right tabular-nums', totales.margenCobrado < 0 && 'text-red-600')}>{formatPeso(totales.margenCobrado)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
