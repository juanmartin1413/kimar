'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { Cliente, Venta } from '@/lib/types'
import { formatPeso, formatFecha } from '@/lib/format'
import { saldoVenta, saldoCliente, ventasConSaldo } from '@/lib/cuentaCorriente'
import { downloadEstadoCuenta } from '@/lib/estadoCuentaPdf'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Download } from 'lucide-react'

type EstadoBadge = 'debe' | 'cobrado_parcial' | 'pagado'

const estadoConfig: Record<EstadoBadge, { label: string; className: string }> = {
  debe: { label: 'DEBE', className: 'bg-red-100 text-red-700' },
  cobrado_parcial: { label: 'PARCIAL', className: 'bg-orange-100 text-orange-700' },
  pagado: { label: 'PAGADO', className: 'bg-green-100 text-green-700' },
}

function VentaRow({ venta }: { venta: Venta }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = estadoConfig[venta.estado]

  return (
    <>
      <tr
        className={cn(
          'border-b border-[oklch(0.93_0.01_240)] cursor-pointer hover:bg-[oklch(0.98_0.005_240)] transition-colors',
          venta.estado === 'debe' && 'bg-red-50/40',
          venta.estado === 'cobrado_parcial' && 'bg-orange-50/40',
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-4 h-4 text-[oklch(0.5_0.04_240)]" /> : <ChevronRight className="w-4 h-4 text-[oklch(0.5_0.04_240)]" />}
            <span className="text-sm text-[oklch(0.45_0.04_240)]">{formatFecha(venta.fechaEntrega)}</span>
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-[oklch(0.45_0.04_240)]">{venta.nroRemito ?? '—'}</td>
        <td className="py-3 px-4 text-sm text-[oklch(0.45_0.04_240)]">{venta.nroFactura ?? '—'}</td>
        <td className="py-3 px-4 font-semibold text-[oklch(0.25_0.06_240)] tabular-nums">{formatPeso(saldoVenta(venta))}</td>
        <td className="py-3 px-4">
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.className)}>{cfg.label}</span>
        </td>
        <td className="py-3 px-4 text-sm text-[oklch(0.5_0.04_240)]">{venta.observaciones ?? '—'}</td>
      </tr>
      {expanded && (
        <tr className="bg-[oklch(0.97_0.01_240)]">
          <td colSpan={6} className="px-8 py-3">
            <div className="text-xs text-[oklch(0.35_0.06_240)] space-y-1">
              <p className="font-semibold mb-2">Ítems:</p>
              {venta.items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.cantidad} kg × {item.descripcion}</span>
                  <span className="tabular-nums">{formatPeso(item.precioUnitario)}/kg = {formatPeso(item.subtotal)}</span>
                </div>
              ))}
              {venta.cobranzas.length > 0 && (
                <>
                  <p className="font-semibold mt-3 mb-1">Plan de cobro:</p>
                  {venta.cobranzas.map(c => (
                    <div key={c.id} className="flex justify-between">
                      <span>{formatFecha(c.fecha)} — {c.formaPago} — {estadoConfig[c.estado as EstadoBadge]?.label ?? c.estado}</span>
                      <span className="tabular-nums">{formatPeso(c.monto)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function ClienteCard({ cliente, ventas, vendedorNombre }: { cliente: Cliente; ventas: Venta[]; vendedorNombre: string }) {
  const saldo = ventas.reduce((s, v) => s + saldoVenta(v), 0)

  return (
    <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
      {/* Cliente header */}
      <div className="bg-[oklch(0.18_0.06_240)] text-white px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg">{cliente.nombre}</h2>
          <p className="text-xs text-[oklch(0.75_0.08_240)]">Vendedor: {vendedorNombre}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-[oklch(0.75_0.08_240)]">Saldo pendiente</p>
            <p className="font-bold text-xl tabular-nums">
              {saldo > 0 ? formatPeso(saldo) : '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadEstadoCuenta(cliente, ventas)}
            disabled={saldo === 0}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-semibold px-3 py-2 rounded-lg"
            title={saldo > 0 ? 'Descargar estado de cuenta' : 'Sin saldo pendiente'}
          >
            <Download className="w-3.5 h-3.5" />
            Estado de cuenta
          </button>
        </div>
      </div>

      {ventas.length === 0 ? (
        <div className="py-10 text-center text-sm text-[oklch(0.55_0.04_240)]">
          Sin saldo pendiente
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.9_0.01_240)]">
                <th className="text-left py-2.5 px-4 font-semibold text-[oklch(0.4_0.06_240)]">Fecha</th>
                <th className="text-left py-2.5 px-4 font-semibold text-[oklch(0.4_0.06_240)]">Remito</th>
                <th className="text-left py-2.5 px-4 font-semibold text-[oklch(0.4_0.06_240)]">Factura</th>
                <th className="text-left py-2.5 px-4 font-semibold text-[oklch(0.4_0.06_240)]">Saldo</th>
                <th className="text-left py-2.5 px-4 font-semibold text-[oklch(0.4_0.06_240)]">Estado</th>
                <th className="text-left py-2.5 px-4 font-semibold text-[oklch(0.4_0.06_240)]">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <VentaRow key={v.id} venta={v} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function CuentaCorrientePage() {
  const { data } = useData()
  const [search, setSearch] = useState('')
  const [vendedorFilter, setVendedorFilter] = useState('')
  const [mostrarTodos, setMostrarTodos] = useState(false)

  function getVendedorNombre(vendedorId?: string) {
    return data.vendedores.find(v => v.id === vendedorId)?.nombre ?? '—'
  }

  const totalGeneral = data.ventas.reduce((s, v) => s + saldoVenta(v), 0)

  const clientesConSaldo = data.clientes
    .filter(c => c.activo)
    .filter(c => !vendedorFilter || c.vendedorId === vendedorFilter)
    .filter(c => !search || c.nombre.toLowerCase().includes(search.toLowerCase()))
    .map(cliente => ({
      cliente,
      ventas: ventasConSaldo(data.ventas, cliente.id),
      saldo: saldoCliente(data.ventas, cliente.id),
    }))
    .filter(({ saldo }) => mostrarTodos || saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Cuenta Corriente</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">Vista consolidada por cliente</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-center">
            <p className="text-xs text-red-600 font-medium">TOTAL A COBRAR</p>
            <p className="text-xl font-bold text-red-700 tabular-nums">{formatPeso(totalGeneral)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)] min-w-[220px]"
        />
        <select
          value={vendedorFilter}
          onChange={e => setVendedorFilter(e.target.value)}
          className="border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
        >
          <option value="">Todos los vendedores</option>
          {data.vendedores.map(v => (
            <option key={v.id} value={v.id}>{v.nombre}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[oklch(0.4_0.04_240)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarTodos}
            onChange={e => setMostrarTodos(e.target.checked)}
            className="rounded border-[oklch(0.8_0.02_240)]"
          />
          Ver todos los clientes (incluye al día)
        </label>
      </div>

      {clientesConSaldo.length === 0 ? (
        <div className="py-16 text-center text-sm text-[oklch(0.55_0.04_240)]">
          No hay clientes con saldo pendiente.
        </div>
      ) : (
        clientesConSaldo.map(({ cliente, ventas }) => (
          <ClienteCard
            key={cliente.id}
            cliente={cliente}
            ventas={ventas}
            vendedorNombre={getVendedorNombre(cliente.vendedorId)}
          />
        ))
      )}
    </div>
  )
}
