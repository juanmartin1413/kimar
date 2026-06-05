'use client'

import { useData } from '@/contexts/DataContext'
import { formatPeso, formatFecha } from '@/lib/format'
import { Plus, ArrowRight, Pencil, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const estadoConfig = {
  debe: { label: 'DEBE', className: 'bg-red-100 text-red-700' },
  cobrado_parcial: { label: 'PARCIAL', className: 'bg-orange-100 text-orange-700' },
  pagado: { label: 'PAGADO', className: 'bg-green-100 text-green-700' },
}

export default function VentasPage() {
  const { data } = useData()

  const sorted = [...data.ventas].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))

  // Pedidos pendientes that don't have a sale associated
  const pedidosPendientes = data.pedidos.filter(p =>
    p.estado === 'pendiente' && !data.ventas.some(v => v.pedidoId === p.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Ventas</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">{data.ventas.length} ventas registradas</p>
        </div>
        <Link
          href="/interno/ventas/nueva"
          className="flex items-center gap-2 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva venta
        </Link>
      </div>

      {/* Pedidos pendientes section */}
      {pedidosPendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-amber-800">Pedidos pendientes sin venta ({pedidosPendientes.length})</h2>
          </div>
          <div className="grid gap-2">
            {pedidosPendientes.map(pedido => {
              const cliente = data.clientes.find(c => c.id === pedido.clienteId)
              const vendedor = data.vendedores.find(v => v.id === pedido.vendedorId)
              const totalEstimado = pedido.items.reduce((s, i) => s + i.subtotal, 0)
              return (
                <div key={pedido.id} className="flex items-center justify-between bg-white rounded-lg border border-amber-200 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-[oklch(0.25_0.06_240)]">{cliente?.nombre ?? '—'}</p>
                      <p className="text-xs text-[oklch(0.5_0.04_240)]">{vendedor?.nombre ?? '—'} · {formatFecha(pedido.fecha)} · {pedido.items.length} ítem(s)</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[oklch(0.35_0.06_240)]">{formatPeso(totalEstimado)}</span>
                  </div>
                  <Link
                    href={`/interno/ventas/nueva?pedidoId=${pedido.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Crear venta <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.9_0.01_240)]">
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Fecha</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Vendedor</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">N° Remito</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">N° Factura</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Estado</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[oklch(0.55_0.04_240)]">Sin ventas registradas</td></tr>
              ) : sorted.map(v => {
                const cliente = data.clientes.find(c => c.id === v.clienteId)
                const vendedor = data.vendedores.find(x => x.id === v.vendedorId)
                const cfg = estadoConfig[v.estado]
                return (
                  <tr key={v.id} className={cn('border-b border-[oklch(0.93_0.01_240)] hover:bg-[oklch(0.98_0.005_240)]', v.estado === 'debe' && 'bg-red-50/30')}>
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{formatFecha(v.fechaEntrega)}</td>
                    <td className="py-3 px-4 font-medium text-[oklch(0.25_0.06_240)]">{cliente?.nombre ?? '—'}</td>
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{vendedor?.nombre ?? '—'}</td>
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{v.nroRemito ?? '—'}</td>
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{v.nroFactura ?? '—'}</td>
                    <td className="py-3 px-4 font-semibold tabular-nums">{formatPeso(v.total)}</td>
                    <td className="py-3 px-4">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.className)}>{cfg.label}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/interno/ventas/${v.id}`}
                        className="text-[oklch(0.55_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors"
                        title="Editar venta"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
