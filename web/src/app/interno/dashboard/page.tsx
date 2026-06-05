'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatPeso, formatFecha, today } from '@/lib/format'
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'resumen' | 'ventas' | 'cobranzas' | 'vendedores'

export default function DashboardPage() {
  const { isAdmin, usuario } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('resumen')

  useEffect(() => {
    if (usuario && !isAdmin) {
      router.replace(usuario.rol === 'gestor' ? '/interno/cuenta-corriente' : '/interno/pedidos')
    }
  }, [usuario, isAdmin, router])

  if (!usuario || !isAdmin) return null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'ventas', label: 'Ventas' },
    { key: 'cobranzas', label: 'Cobranzas' },
    { key: 'vendedores', label: 'Vendedores' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Dashboard</h1>
        <p className="text-sm text-[oklch(0.5_0.04_240)]">Resumen del negocio en tiempo real</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[oklch(0.95_0.01_240)] rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === t.key
                ? 'bg-white text-[oklch(0.2_0.06_240)] shadow-sm'
                : 'text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.3_0.06_240)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumen' && <ResumenTab />}
      {activeTab === 'ventas' && <VentasTab />}
      {activeTab === 'cobranzas' && <CobranzasTab />}
      {activeTab === 'vendedores' && <VendedoresTab />}
    </div>
  )
}

// ========== RESUMEN TAB ==========
function ResumenTab() {
  const { data } = useData()
  const todayStr = today()

  // Por cobrar
  const cobranzasPendientes = data.cobranzas.filter(c => c.estado === 'pendiente')
  const totalPorCobrar = cobranzasPendientes.reduce((s, c) => s + c.monto, 0)

  // Por pagar: cuotas proveedor pendientes + gastos del mes impagos
  const now = new Date()
  const mes = now.getMonth() + 1
  const anio = now.getFullYear()
  const cuotasProvPend = data.compromisosProveedor.flatMap(c =>
    c.cuotas.filter(cu => cu.estado === 'pendiente').map(cu => ({
      ...cu,
      proveedorId: c.proveedorId,
      concepto: c.concepto,
    }))
  )
  const totalCuotasProv = cuotasProvPend.reduce((s, cu) => s + cu.monto, 0)
  const gastosImpagos = data.instanciasGasto.filter(i => i.mes === mes && i.anio === anio && !i.pagado)
  const totalGastosImpagos = gastosImpagos.reduce((s, i) => s + i.monto, 0)
  const totalPorPagar = totalCuotasProv + totalGastosImpagos

  // Balance mensual: lo que se proyecta cobrar menos lo que se proyecta pagar
  const balance = totalPorCobrar - totalPorPagar

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-xs font-medium text-green-600">POR COBRAR</p>
          </div>
          <p className="text-2xl font-bold text-green-700 tabular-nums">{formatPeso(totalPorCobrar)}</p>
          <p className="text-xs text-green-600 mt-1">{cobranzasPendientes.length} cobranza{cobranzasPendientes.length !== 1 ? 's' : ''} pendiente{cobranzasPendientes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <p className="text-xs font-medium text-red-600">POR PAGAR</p>
          </div>
          <p className="text-2xl font-bold text-red-700 tabular-nums">{formatPeso(totalPorPagar)}</p>
          <p className="text-xs text-red-600 mt-1">Proveedores: {formatPeso(totalCuotasProv)} · Gastos: {formatPeso(totalGastosImpagos)}</p>
        </div>
        <div className={cn('border rounded-xl p-5', balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={cn('w-5 h-5', balance >= 0 ? 'text-green-600' : 'text-red-600')} />
            <p className={cn('text-xs font-medium', balance >= 0 ? 'text-green-600' : 'text-red-600')}>BALANCE MENSUAL</p>
          </div>
          <p className={cn('text-2xl font-bold tabular-nums', balance >= 0 ? 'text-green-700' : 'text-red-700')}>{balance >= 0 ? '+' : ''}{formatPeso(balance)}</p>
          <p className="text-xs text-[oklch(0.5_0.04_240)] mt-1">Cobrar {formatPeso(totalPorCobrar)} — Pagar {formatPeso(totalPorPagar)}</p>
        </div>
      </div>

      {/* Por cobrar detalle */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[oklch(0.93_0.01_240)]">
            <h2 className="font-bold text-[oklch(0.25_0.06_240)]">Nos deben</h2>
          </div>
          {cobranzasPendientes.length === 0 ? (
            <p className="text-center py-8 text-sm text-[oklch(0.55_0.04_240)]">Sin cobranzas pendientes</p>
          ) : (
            <div className="divide-y divide-[oklch(0.95_0.01_240)] max-h-64 overflow-y-auto">
              {cobranzasPendientes.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 10).map(c => {
                const cliente = data.clientes.find(x => x.id === c.clienteId)
                const isVencido = c.fecha < todayStr
                return (
                  <div key={c.id} className={cn('px-5 py-3 flex items-center justify-between', isVencido && 'bg-red-50/40')}>
                    <div>
                      <p className="text-sm font-medium text-[oklch(0.3_0.06_240)]">{cliente?.nombre ?? '—'}</p>
                      <p className={cn('text-xs', isVencido ? 'text-red-500 font-medium' : 'text-[oklch(0.55_0.04_240)]')}>
                        {formatFecha(c.fecha)} · {c.formaPago}
                        {isVencido && ' · VENCIDO'}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums text-sm">{formatPeso(c.monto)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[oklch(0.93_0.01_240)]">
            <h2 className="font-bold text-[oklch(0.25_0.06_240)]">Debemos</h2>
          </div>
          {cuotasProvPend.length === 0 && gastosImpagos.length === 0 ? (
            <p className="text-center py-8 text-sm text-[oklch(0.55_0.04_240)]">Sin pagos pendientes</p>
          ) : (
            <div className="divide-y divide-[oklch(0.95_0.01_240)] max-h-64 overflow-y-auto">
              {cuotasProvPend.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 8).map(cu => {
                const prov = data.proveedores.find(p => p.id === cu.proveedorId)
                return (
                  <div key={cu.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[oklch(0.3_0.06_240)]">{prov?.nombre ?? '—'}</p>
                      <p className="text-xs text-[oklch(0.55_0.04_240)]">{cu.concepto} · {formatFecha(cu.fecha)} · {cu.formaPago}</p>
                    </div>
                    <span className="font-semibold tabular-nums text-sm text-red-600">{formatPeso(cu.monto)}</span>
                  </div>
                )
              })}
              {gastosImpagos.map(inst => {
                const gasto = data.gastosFijos.find(g => g.id === inst.gastoFijoId)
                return (
                  <div key={inst.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[oklch(0.3_0.06_240)]">{gasto?.nombre ?? '—'}</p>
                      <p className="text-xs text-[oklch(0.55_0.04_240)]">Gasto fijo · {gasto?.tipo}</p>
                    </div>
                    <span className="font-semibold tabular-nums text-sm text-red-600">{formatPeso(inst.monto)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ========== VENTAS TAB ==========
function VentasTab() {
  const { data } = useData()
  const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensual'>('semanal')

  const chartData = useMemo(() => {
    const now = new Date()
    if (periodo === 'diario') {
      // Last 30 days
      const days: { label: string; total: number }[] = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const total = data.ventas.filter(v => v.fechaCreacion === dateStr).reduce((s, v) => s + v.total, 0)
        days.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total })
      }
      return days
    } else if (periodo === 'semanal') {
      // Last 12 weeks
      const weeks: { label: string; total: number }[] = []
      for (let i = 11; i >= 0; i--) {
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() - i * 7)
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() - 6)
        const startStr = weekStart.toISOString().split('T')[0]
        const endStr = weekEnd.toISOString().split('T')[0]
        const total = data.ventas.filter(v => v.fechaCreacion >= startStr && v.fechaCreacion <= endStr).reduce((s, v) => s + v.total, 0)
        weeks.push({ label: `S${12 - i}`, total })
      }
      return weeks
    } else {
      // Last 12 months
      const months: { label: string; total: number }[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const total = data.ventas.filter(v => v.fechaCreacion.startsWith(prefix)).reduce((s, v) => s + v.total, 0)
        months.push({ label: `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`, total })
      }
      return months
    }
  }, [data.ventas, periodo])

  const maxVal = Math.max(...chartData.map(d => d.total), 1)
  const totalPeriodo = chartData.reduce((s, d) => s + d.total, 0)
  const cantVentas = data.ventas.length
  const ticketPromedio = cantVentas > 0 ? totalPeriodo / chartData.filter(d => d.total > 0).length : 0

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[oklch(0.5_0.04_240)]" />
          <div className="flex rounded-lg border border-[oklch(0.88_0.02_240)] overflow-hidden text-xs font-semibold">
            {(['diario', 'semanal', 'mensual'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={cn('px-3 py-1.5 transition-colors capitalize', periodo === p ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-[oklch(0.5_0.04_240)]">Total periodo: <span className="font-bold text-[oklch(0.25_0.06_240)]">{formatPeso(totalPeriodo)}</span></span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6">
        <div className="flex items-end gap-1 h-48">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className={cn('w-full rounded-t transition-all', d.total > 0 ? 'bg-[oklch(0.42_0.14_240)]' : 'bg-[oklch(0.92_0.02_240)]')}
                style={{ height: `${Math.max((d.total / maxVal) * 100, 2)}%` }}
                title={`${d.label}: ${formatPeso(d.total)}`}
              />
              <span className="text-[10px] text-[oklch(0.5_0.04_240)] mt-1 truncate w-full text-center">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-[oklch(0.95_0.03_240)] rounded-xl p-4">
          <p className="text-xs font-medium text-[oklch(0.5_0.04_240)]">Total vendido (periodo)</p>
          <p className="text-xl font-bold text-[oklch(0.25_0.06_240)] tabular-nums">{formatPeso(totalPeriodo)}</p>
        </div>
        <div className="bg-[oklch(0.95_0.03_240)] rounded-xl p-4">
          <p className="text-xs font-medium text-[oklch(0.5_0.04_240)]">Ticket promedio</p>
          <p className="text-xl font-bold text-[oklch(0.25_0.06_240)] tabular-nums">{formatPeso(ticketPromedio || 0)}</p>
        </div>
        <div className="bg-[oklch(0.95_0.03_240)] rounded-xl p-4">
          <p className="text-xs font-medium text-[oklch(0.5_0.04_240)]">Ventas totales</p>
          <p className="text-xl font-bold text-[oklch(0.25_0.06_240)]">{cantVentas}</p>
        </div>
      </div>
    </div>
  )
}

// ========== COBRANZAS TAB ==========
function CobranzasTab() {
  const { data } = useData()
  const todayStr = today()

  const pendientes = data.cobranzas.filter(c => c.estado === 'pendiente')
  const vencidas = pendientes.filter(c => c.fecha < todayStr)
  const totalPendiente = pendientes.reduce((s, c) => s + c.monto, 0)
  const totalVencido = vencidas.reduce((s, c) => s + c.monto, 0)

  // Cobrado esta semana
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]
  const cobradoSemana = data.cobranzas
    .filter(c => c.estado === 'cobrado' && c.fecha >= weekAgoStr)
    .reduce((s, c) => s + c.monto, 0)

  // Próximos 7 días
  const weekFromNow = new Date()
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  const weekFromNowStr = weekFromNow.toISOString().split('T')[0]
  const proximas = pendientes
    .filter(c => c.fecha >= todayStr && c.fecha <= weekFromNowStr)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Desglose por forma
  const porForma = {
    efectivo: pendientes.filter(c => c.formaPago === 'efectivo').reduce((s, c) => s + c.monto, 0),
    transferencia: pendientes.filter(c => c.formaPago === 'transferencia').reduce((s, c) => s + c.monto, 0),
    cheque: pendientes.filter(c => c.formaPago === 'cheque').reduce((s, c) => s + c.monto, 0),
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <p className="text-xs font-medium text-yellow-600">PENDIENTE TOTAL</p>
          <p className="text-2xl font-bold text-yellow-700 tabular-nums mt-1">{formatPeso(totalPendiente)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-xs font-medium text-red-600">VENCIDO</p>
          <p className="text-2xl font-bold text-red-700 tabular-nums mt-1">{formatPeso(totalVencido)}</p>
          <p className="text-xs text-red-500 mt-1">{vencidas.length} cobranza{vencidas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-xs font-medium text-green-600">COBRADO ESTA SEMANA</p>
          <p className="text-2xl font-bold text-green-700 tabular-nums mt-1">{formatPeso(cobradoSemana)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximos 7 días */}
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[oklch(0.93_0.01_240)]">
            <h2 className="font-bold text-[oklch(0.25_0.06_240)]">Próximos 7 días ({proximas.length})</h2>
          </div>
          {proximas.length === 0 ? (
            <p className="text-center py-8 text-sm text-[oklch(0.55_0.04_240)]">Sin cobranzas esta semana</p>
          ) : (
            <div className="divide-y divide-[oklch(0.95_0.01_240)] max-h-56 overflow-y-auto">
              {proximas.map(c => {
                const cliente = data.clientes.find(x => x.id === c.clienteId)
                return (
                  <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[oklch(0.3_0.06_240)]">{cliente?.nombre ?? '—'}</p>
                      <p className="text-xs text-[oklch(0.55_0.04_240)]">{formatFecha(c.fecha)} · {c.formaPago}</p>
                    </div>
                    <span className="font-semibold tabular-nums text-sm">{formatPeso(c.monto)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Desglose por forma */}
        <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-[oklch(0.25_0.06_240)]">Pendiente por forma de pago</h2>
          <div className="space-y-3">
            {([['Efectivo', porForma.efectivo], ['Transferencia', porForma.transferencia], ['Cheque', porForma.cheque]] as const).map(([label, monto]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-[oklch(0.4_0.04_240)]">{label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-[oklch(0.93_0.01_240)] rounded-full overflow-hidden">
                    <div className="h-full bg-[oklch(0.42_0.14_240)] rounded-full" style={{ width: `${totalPendiente > 0 ? (monto / totalPendiente) * 100 : 0}%` }} />
                  </div>
                  <span className="font-semibold tabular-nums text-sm w-28 text-right">{formatPeso(monto)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ========== VENDEDORES TAB ==========
function VendedoresTab() {
  const { data } = useData()
  const now = new Date()
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const vendedorStats = data.vendedores.filter(v => v.activo).map(vendedor => {
    const deuda = data.ventas
      .filter(x => x.vendedorId === vendedor.id && x.estado !== 'pagado')
      .reduce((s, x) => s + x.total, 0)
    const ventasMes = data.ventas
      .filter(v => v.vendedorId === vendedor.id && v.fechaCreacion >= startOfMonth)
      .reduce((s, v) => s + v.total, 0)
    const cobranzasMes = data.cobranzas
      .filter(c => {
        const venta = data.ventas.find(v => v.id === c.ventaId)
        return venta?.vendedorId === vendedor.id && c.estado === 'cobrado' && c.fecha >= startOfMonth
      })
      .reduce((s, c) => s + c.monto, 0)
    return { vendedor, deuda, ventasMes, cobranzasMes }
  }).sort((a, b) => b.deuda - a.deuda)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.9_0.01_240)]">
              <th className="text-left py-3 px-5 font-semibold text-[oklch(0.35_0.06_240)]">Vendedor</th>
              <th className="text-left py-3 px-5 font-semibold text-[oklch(0.35_0.06_240)]">Cartera (deuda)</th>
              <th className="text-left py-3 px-5 font-semibold text-[oklch(0.35_0.06_240)]">Ventas del mes</th>
              <th className="text-left py-3 px-5 font-semibold text-[oklch(0.35_0.06_240)]">Cobrado del mes</th>
            </tr>
          </thead>
          <tbody>
            {vendedorStats.map(({ vendedor, deuda, ventasMes, cobranzasMes }) => (
              <tr key={vendedor.id} className="border-b border-[oklch(0.93_0.01_240)] hover:bg-[oklch(0.98_0.005_240)]">
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[oklch(0.18_0.06_240)] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{vendedor.nombre.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-[oklch(0.3_0.06_240)]">{vendedor.nombre}</span>
                  </div>
                </td>
                <td className="py-4 px-5">
                  <span className={cn('font-bold tabular-nums', deuda > 0 ? 'text-red-600' : 'text-green-600')}>
                    {deuda > 0 ? formatPeso(deuda) : '$ 0'}
                  </span>
                </td>
                <td className="py-4 px-5 font-semibold tabular-nums text-[oklch(0.25_0.06_240)]">{formatPeso(ventasMes)}</td>
                <td className="py-4 px-5 font-semibold tabular-nums text-green-600">{formatPeso(cobranzasMes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
