'use client'

import { useMemo, useState } from 'react'
import { Info, Receipt, Wallet, Scale, Package, TrendingUp, TrendingDown } from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import { formatPeso } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  calcularPorCobrar, calcularPorPagar, calcularBalanceDevengado, calcularBalanceCajaReal,
  calcularBalanceKg, calcularMercaderia, periodoSemanal, periodoMensualActual,
} from '@/lib/saludFinanciera'
import { SimulacionCaja } from './SimulacionCaja'

type PeriodoToggle = 'semana' | 'mes'

export function SaludFinancieraTab() {
  const { data } = useData()
  const [periodoToggle, setPeriodoToggle] = useState<PeriodoToggle>('semana')

  const now = new Date()
  const mes = now.getMonth() + 1
  const anio = now.getFullYear()

  const porCobrar = useMemo(() => calcularPorCobrar(data.cobranzas), [data.cobranzas])
  const porPagar = useMemo(
    () => calcularPorPagar(data.compromisosProveedor, data.instanciasGasto, mes, anio),
    [data.compromisosProveedor, data.instanciasGasto, mes, anio]
  )

  const periodo = periodoToggle === 'semana' ? periodoSemanal() : periodoMensualActual()

  const balanceDevengado = useMemo(
    () => calcularBalanceDevengado(data.ventas, data.compras, periodo),
    [data.ventas, data.compras, periodo]
  )
  const balanceCajaReal = useMemo(
    () => calcularBalanceCajaReal(data.cobranzas, data.compromisosProveedor, periodo),
    [data.cobranzas, data.compromisosProveedor, periodo]
  )
  const balanceKg = useMemo(
    () => calcularBalanceKg(data.ventas, data.compras, data.productos, periodo),
    [data.ventas, data.compras, data.productos, periodo]
  )
  const mercaderia = useMemo(
    () => calcularMercaderia(data.ventas, data.compras, data.productos, periodo),
    [data.ventas, data.compras, data.productos, periodo]
  )

  return (
    <div className="space-y-6">
      {/* Banda explicativa */}
      <div className="flex items-start gap-2 bg-[oklch(0.96_0.02_240)] border border-[oklch(0.9_0.02_240)] rounded-lg px-4 py-3">
        <Info className="w-4 h-4 text-[oklch(0.45_0.1_240)] shrink-0 mt-0.5" />
        <p className="text-xs text-[oklch(0.4_0.04_240)]">
          <strong>Devengado</strong> = lo facturado, aunque todavía no se haya cobrado o pagado.{' '}
          <strong>Caja Real</strong> = lo que efectivamente entró o salió del bolsillo.
        </p>
      </div>

      {/* Por cobrar / Por pagar */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-xs font-medium text-green-600">POR COBRAR</p>
          </div>
          <p className="text-2xl font-bold text-green-700 tabular-nums">{formatPeso(porCobrar.total)}</p>
          <p className="text-xs text-green-600 mt-1">
            {porCobrar.pendientes.length} cobranza{porCobrar.pendientes.length !== 1 ? 's' : ''} pendiente{porCobrar.pendientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <p className="text-xs font-medium text-red-600">POR PAGAR</p>
          </div>
          <p className="text-2xl font-bold text-red-700 tabular-nums">{formatPeso(porPagar.total)}</p>
          <p className="text-xs text-red-600 mt-1">
            Proveedores: {formatPeso(porPagar.totalCuotas)} · Gastos: {formatPeso(porPagar.totalGastos)}
          </p>
        </div>
      </div>

      {/* Toggle semana/mes */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[oklch(0.25_0.06_240)]">Balance del período</h2>
        <div className="flex rounded-lg border border-[oklch(0.88_0.02_240)] overflow-hidden text-xs font-semibold">
          {(['semana', 'mes'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriodoToggle(p)}
              className={cn(
                'px-3 py-1.5 transition-colors capitalize',
                periodoToggle === p ? 'bg-[oklch(0.42_0.14_240)] text-white' : 'text-[oklch(0.5_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]'
              )}
            >
              {p === 'semana' ? 'Últimos 7 días' : 'Mes actual'}
            </button>
          ))}
        </div>
      </div>

      {/* 3 balances */}
      <div className="grid lg:grid-cols-3 gap-4">
        <BalanceCard
          titulo="Balance Devengado"
          subtitulo="Ventas − Compras (facturado)"
          tooltip="Suma el total de las Ventas facturadas menos el total de las Compras registradas en el período, sin importar si ya se cobró o se pagó. Mide el volumen del negocio."
          valor={formatPeso(balanceDevengado.balance)}
          positivo={balanceDevengado.balance >= 0}
          icon={<Receipt className="w-5 h-5" />}
          acento="violeta"
          detalle={`Ventas ${formatPeso(balanceDevengado.totalVentas)} · Compras ${formatPeso(balanceDevengado.totalCompras)}`}
        />
        <BalanceCard
          titulo="Balance Caja Real"
          subtitulo="Cobrado − Pagado (efectivo)"
          tooltip="Suma lo que efectivamente se cobró de los clientes menos lo que efectivamente se pagó a proveedores en el período. Mide el movimiento real de dinero."
          valor={formatPeso(balanceCajaReal.balance)}
          positivo={balanceCajaReal.balance >= 0}
          icon={<Wallet className="w-5 h-5" />}
          acento="semaforo"
          detalle={`Cobrado ${formatPeso(balanceCajaReal.totalCobrado)} · Pagado ${formatPeso(balanceCajaReal.totalPagado)}`}
        />
        <BalanceCard
          titulo="Balance en Kg"
          subtitulo="Vendido − Comprado"
          tooltip="Kilos vendidos menos kilos comprados en el período (solo productos que se manejan por kg). Positivo = salió más mercadería de la que entró."
          valor={`${balanceKg.balance >= 0 ? '+' : ''}${balanceKg.balance.toFixed(1)} kg`}
          positivo={balanceKg.balance >= 0}
          icon={<Scale className="w-5 h-5" />}
          acento="ambar"
          detalle={`Vendido ${balanceKg.kgVendidos.toFixed(1)} kg · Comprado ${balanceKg.kgComprados.toFixed(1)} kg`}
        />
      </div>

      {/* Mercadería */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-5 h-5 text-amber-700" />
          <p className="text-xs font-medium text-amber-700">MATERIA PRIMA / MERCADERÍA</p>
          <span title="Kilos comprados menos kilos vendidos en el período, valorizados al último precio de compra de cada producto. No es 'bueno o malo': explica dónde está la plata cuando el Balance Devengado se ve negativo.">
            <Info className="w-3.5 h-3.5 text-amber-600" />
          </span>
        </div>
        <p className="text-2xl font-bold text-amber-800 tabular-nums">
          {mercaderia.deltaKg >= 0 ? '+' : ''}{mercaderia.deltaKg.toFixed(1)} kg
          <span className="text-base font-semibold text-amber-700 ml-2">
            ({mercaderia.valorDelta >= 0 ? '+' : ''}{formatPeso(mercaderia.valorDelta)})
          </span>
        </p>
        <p className="text-sm text-amber-800 mt-2">
          {mercaderia.deltaKg > 0
            ? `Compraste ${mercaderia.deltaKg.toFixed(1)} kg más de los que vendiste. Ese dinero no se perdió — quedó invertido en mercadería, valorizada a su último precio de compra.`
            : mercaderia.deltaKg < 0
              ? `Vendiste ${Math.abs(mercaderia.deltaKg).toFixed(1)} kg más de los que compraste. El stock bajó — revisá si hace falta reponer.`
              : 'Compraste y vendiste la misma cantidad de kg en el período.'}
        </p>
        {mercaderia.productosSinPrecio.length > 0 && (
          <p className="text-xs text-amber-600 mt-2">
            {mercaderia.productosSinPrecio.length} producto{mercaderia.productosSinPrecio.length !== 1 ? 's' : ''} sin historial de compra, no incluido{mercaderia.productosSinPrecio.length !== 1 ? 's' : ''} en la valorización.
          </p>
        )}
      </div>

      {/* Simulación de caja */}
      <SimulacionCaja
        cobranzasPendientes={porCobrar.pendientes}
        cuotasProveedorPendientes={porPagar.cuotasPendientes}
        instanciasGastoImpagas={porPagar.gastosImpagos}
        clientes={data.clientes}
        proveedores={data.proveedores}
        gastosFijos={data.gastosFijos}
      />
    </div>
  )
}

const ACENTOS = {
  violeta: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', iconText: 'text-indigo-600' },
  ambar: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconText: 'text-amber-600' },
} as const

function BalanceCard({
  titulo, subtitulo, tooltip, valor, positivo, icon, acento, detalle,
}: {
  titulo: string
  subtitulo: string
  tooltip: string
  valor: string
  positivo: boolean
  icon: React.ReactNode
  acento: 'violeta' | 'semaforo' | 'ambar'
  detalle: string
}) {
  const semaforo = positivo
    ? { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconText: 'text-green-600' }
    : { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconText: 'text-red-600' }
  const estilo = acento === 'semaforo' ? semaforo : ACENTOS[acento]

  return (
    <div className={cn('border rounded-xl p-5', estilo.bg, estilo.border)}>
      <div className="flex items-center gap-2 mb-1">
        <span className={estilo.iconText}>{icon}</span>
        <p className={cn('text-xs font-medium', estilo.iconText)}>{titulo.toUpperCase()}</p>
        <span title={tooltip}>
          <Info className={cn('w-3.5 h-3.5', estilo.iconText)} />
        </span>
      </div>
      <p className={cn('text-2xl font-bold tabular-nums', estilo.text)}>{valor}</p>
      <p className="text-xs text-[oklch(0.5_0.04_240)] mt-1">{subtitulo}</p>
      <p className="text-xs text-[oklch(0.55_0.04_240)] mt-1">{detalle}</p>
    </div>
  )
}
