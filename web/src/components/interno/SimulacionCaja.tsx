'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPeso, formatFecha } from '@/lib/format'
import {
  simularCaja, CuotaConMeta, PuntoLinea, Quiebre, ResultadoSimulacion,
} from '@/lib/saludFinanciera'
import { Cliente, Cobranza, GastoFijo, InstanciaGasto, Proveedor } from '@/lib/types'

interface SimulacionCajaProps {
  cobranzasPendientes: Cobranza[]
  cuotasProveedorPendientes: CuotaConMeta[]
  instanciasGastoImpagas: InstanciaGasto[]
  clientes: Cliente[]
  proveedores: Proveedor[]
  gastosFijos: GastoFijo[]
}

function diasEntreIso(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const da = new Date(ay, am - 1, ad)
  const db = new Date(by, bm - 1, bd)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function SimulacionCaja({
  cobranzasPendientes, cuotasProveedorPendientes, instanciasGastoImpagas,
  clientes, proveedores, gastosFijos,
}: SimulacionCajaProps) {
  const [cajaStr, setCajaStr] = useState('')
  const [toleranciaStr, setToleranciaStr] = useState('0')
  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null)

  const handleSimular = () => {
    const saldoInicial = parseFloat(cajaStr) || 0
    const diasTolerancia = Math.max(0, parseInt(toleranciaStr, 10) || 0)
    setResultado(simularCaja({
      saldoInicial,
      diasTolerancia,
      cobranzasPendientes,
      cuotasProveedorPendientes,
      instanciasGastoImpagas,
      clientes,
      proveedores,
      gastosFijos,
    }))
  }

  const sinMovimientos = resultado !== null && resultado.eventos.length === 0

  return (
    <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-5 space-y-5">
      <div>
        <h2 className="font-bold text-[oklch(0.25_0.06_240)] flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Simulación de caja
        </h2>
        <p className="text-xs text-[oklch(0.5_0.04_240)] mt-1">
          Ingresá cuánto tenés hoy en caja y cuántos días de margen le das a tus clientes para pagar,
          y te mostramos si vas a poder cubrir tus compromisos con proveedores y gastos fijos.
        </p>
      </div>

      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <Label htmlFor="caja">Dinero en caja ($)</Label>
          <Input
            id="caja"
            type="number"
            step="0.01"
            value={cajaStr}
            onChange={e => setCajaStr(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="tolerancia">Días de tolerancia con clientes</Label>
          <Input
            id="tolerancia"
            type="number"
            min={0}
            step={1}
            value={toleranciaStr}
            onChange={e => setToleranciaStr(e.target.value)}
            placeholder="0"
          />
        </div>
        <Button onClick={handleSimular}>Simular</Button>
      </div>

      {sinMovimientos && (
        <p className="text-center py-6 text-sm text-[oklch(0.55_0.04_240)]">
          No hay cobranzas ni pagos pendientes para simular.
        </p>
      )}

      {resultado && !sinMovimientos && (
        <ResultadoSimulacionView resultado={resultado} />
      )}
    </div>
  )
}

function ResultadoSimulacionView({ resultado }: { resultado: ResultadoSimulacion }) {
  const { quiebres, timeline, huboQuiebre } = resultado
  const saldoMinimo = Math.min(...timeline.map(t => t.saldo))
  const primerQuiebre = quiebres[0]

  return (
    <div className="space-y-4">
      {!huboQuiebre ? (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            Con lo simulado, tu saldo <strong>no baja de {formatPeso(saldoMinimo)}</strong> en todo el período proyectado.
            Llegás a cubrir todos tus compromisos.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">
            No vas a poder cubrir {quiebres.length} pago{quiebres.length !== 1 ? 's' : ''}. El primero es el{' '}
            <strong>{formatFecha(primerQuiebre.fecha)}</strong>: te faltan{' '}
            <strong>{formatPeso(Math.abs(primerQuiebre.saldoResultante))}</strong> para cubrir a{' '}
            <strong>{primerQuiebre.evento.detalle}</strong>.
          </p>
        </div>
      )}

      {quiebres.length > 0 && (
        <div className="rounded-lg border border-[oklch(0.93_0.01_240)] overflow-hidden">
          <div className="px-4 py-2 bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.93_0.01_240)]">
            <h3 className="text-xs font-semibold text-[oklch(0.4_0.04_240)]">Compromisos que no se cubrirían</h3>
          </div>
          <div className="divide-y divide-[oklch(0.95_0.01_240)] max-h-56 overflow-y-auto">
            {quiebres.map((q, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[oklch(0.3_0.06_240)]">{q.evento.detalle}</p>
                  <p className="text-xs text-[oklch(0.55_0.04_240)]">{formatFecha(q.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-sm text-red-600">{formatPeso(q.evento.monto)}</p>
                  <p className="text-xs text-red-500">saldo: {formatPeso(q.saldoResultante)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <GraficoSaldoProyectado timeline={timeline} quiebres={quiebres} />
    </div>
  )
}

function GraficoSaldoProyectado({ timeline, quiebres }: { timeline: PuntoLinea[]; quiebres: Quiebre[] }) {
  if (timeline.length < 2) return null

  const width = 600
  const height = 180
  const padL = 68
  const padR = 16
  const padT = 16
  const padB = 12

  const fechaInicio = timeline[0].fecha
  const fechaFin = timeline[timeline.length - 1].fecha
  const totalDias = Math.max(1, diasEntreIso(fechaInicio, fechaFin))

  const saldos = timeline.map(t => t.saldo)
  const minVal = Math.min(0, ...saldos)
  const maxVal = Math.max(0, ...saldos)
  const rango = maxVal - minVal || 1

  const x = (fecha: string) => padL + (diasEntreIso(fechaInicio, fecha) / totalDias) * (width - padL - padR)
  const y = (saldo: number) => padT + (1 - (saldo - minVal) / rango) * (height - padT - padB)

  const puntos = timeline.map(t => `${x(t.fecha)},${y(t.saldo)}`).join(' ')
  const yZero = y(0)
  const quiebreOrigenes = new Set(quiebres.map(q => q.evento.origenId))

  return (
    <div className="pt-1">
      <h3 className="text-xs font-semibold text-[oklch(0.4_0.04_240)] mb-2">Saldo proyectado en el tiempo</h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Gráfico de saldo de caja proyectado en el tiempo, con los puntos donde el saldo se vuelve negativo marcados en rojo"
      >
        <line x1={padL} y1={yZero} x2={width - padR} y2={yZero} stroke="#c3c2b7" strokeWidth={1} />
        <text x={padL - 8} y={padT + 8} textAnchor="end" fontSize={10} fill="#898781">{formatPeso(maxVal)}</text>
        {/* Etiqueta del mínimo solo si no colisiona con la de $0 (línea de referencia) */}
        {minVal < 0 && Math.abs(yZero - (height - padB)) > 12 ? (
          <>
            <text x={padL - 8} y={yZero + 3} textAnchor="end" fontSize={10} fill="#898781">$0</text>
            <text x={padL - 8} y={height - padB} textAnchor="end" fontSize={10} fill="#898781">{formatPeso(minVal)}</text>
          </>
        ) : (
          <text x={padL - 8} y={yZero + 3} textAnchor="end" fontSize={10} fill="#898781">$0</text>
        )}
        <polyline
          points={puntos}
          fill="none"
          stroke="oklch(0.42 0.14 240)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {timeline.map((t, i) => {
          const esQuiebre = t.evento && t.saldo < 0 && quiebreOrigenes.has(t.evento.origenId)
          if (!esQuiebre) return null
          return (
            <circle key={i} cx={x(t.fecha)} cy={y(t.saldo)} r={5} fill="#dc2626" stroke="#fff" strokeWidth={2}>
              <title>{`${formatFecha(t.fecha)} · ${t.evento?.detalle} · ${formatPeso(t.saldo)}`}</title>
            </circle>
          )
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-[oklch(0.55_0.04_240)]">
        <span style={{ marginLeft: padL }}>{formatFecha(fechaInicio)}</span>
        <span>{formatFecha(fechaFin)}</span>
      </div>
    </div>
  )
}
