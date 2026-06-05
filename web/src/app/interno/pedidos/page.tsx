'use client'

import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatPeso, formatFecha } from '@/lib/format'
import { Plus, Eye, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const estadoColors = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-green-100 text-green-700',
  cancelado: 'bg-gray-100 text-gray-600',
}

export default function PedidosPage() {
  const { data, updatePedido } = useData()
  const { usuario, canManageData } = useAuth()

  const vendedorId = data.vendedores.find(v => v.usuarioId === usuario?.id)?.id

  const pedidosVisibles = usuario?.rol === 'vendedor' && vendedorId
    ? data.pedidos.filter(p => p.vendedorId === vendedorId)
    : data.pedidos

  const sorted = [...pedidosVisibles].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Pedidos</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">{pedidosVisibles.filter(p => p.estado === 'pendiente').length} pendientes de confirmar</p>
        </div>
        <Link
          href="/interno/pedidos/nuevo"
          className="flex items-center gap-2 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo pedido
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.9_0.01_240)]">
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Fecha</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Vendedor</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Ítems</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Total est.</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Estado</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[oklch(0.55_0.04_240)]">Sin pedidos registrados</td>
                </tr>
              ) : sorted.map(p => {
                const cliente = data.clientes.find(c => c.id === p.clienteId)
                const vendedor = data.vendedores.find(v => v.id === p.vendedorId)
                const total = p.items.reduce((s, i) => s + i.subtotal, 0)
                return (
                  <tr key={p.id} className="border-b border-[oklch(0.93_0.01_240)] hover:bg-[oklch(0.98_0.005_240)]">
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{formatFecha(p.fecha)}</td>
                    <td className="py-3 px-4 font-medium text-[oklch(0.25_0.06_240)]">{cliente?.nombre ?? '—'}</td>
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{vendedor?.nombre ?? '—'}</td>
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)]">{p.items.length} ítem{p.items.length !== 1 ? 's' : ''}</td>
                    <td className="py-3 px-4 font-semibold tabular-nums">{formatPeso(total)}</td>
                    <td className="py-3 px-4">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', estadoColors[p.estado])}>
                        {p.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/interno/pedidos/${p.id}`}
                          className="flex items-center gap-1 text-xs text-[oklch(0.42_0.14_240)] hover:text-[oklch(0.32_0.12_240)] font-medium transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                          {p.estado === 'pendiente' ? 'Ver / Editar' : 'Ver detalle'}
                        </Link>
                        {canManageData && p.estado === 'pendiente' && (
                          <button
                            onClick={() => updatePedido(p.id, { estado: 'cancelado' })}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Cancelar pedido"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
