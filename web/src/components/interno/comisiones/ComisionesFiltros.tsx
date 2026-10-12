'use client'

import { Info } from 'lucide-react'
import { Vendedor } from '@/lib/types'
import { Periodo } from '@/lib/saludFinanciera'
import { MODO_LABEL, ModoPeriodo } from '@/lib/comisiones'
import { cn } from '@/lib/utils'

interface Props {
  vendedores: Vendedor[]
  vendedorId: string
  onVendedor: (id: string) => void
  modo: ModoPeriodo
  onModo: (m: ModoPeriodo) => void
  periodo: Periodo
  onPeriodo: (p: Periodo) => void
  periodoInvalido: boolean
}

const fieldClass = 'border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]'

const explicacion: Record<ModoPeriodo, string> = {
  entrega: 'Entran las ventas entregadas dentro del período. Se muestran todas sus cobranzas y se considera cobrado lo que esté cobrado al día de hoy.',
  cobro: 'Entran las ventas con al menos una cobranza cobrada dentro del período. Solo esas cobranzas suman como "cobrado": sirve para liquidar mes a mes sin pagar dos veces la misma cobranza.',
}

export function ComisionesFiltros({ vendedores, vendedorId, onVendedor, modo, onModo, periodo, onPeriodo, periodoInvalido }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-5 space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(200px,1fr)_auto_auto]">
        <label className="flex flex-col gap-1 text-xs font-medium text-[oklch(0.4_0.06_240)]">
          Vendedor
          <select value={vendedorId} onChange={e => onVendedor(e.target.value)} className={fieldClass}>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nombre}{!v.activo ? ' (inactivo)' : ''}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[oklch(0.4_0.06_240)]">
          Desde
          <input type="date" value={periodo.desde} onChange={e => onPeriodo({ ...periodo, desde: e.target.value })} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[oklch(0.4_0.06_240)]">
          Hasta
          <input type="date" value={periodo.hasta} onChange={e => onPeriodo({ ...periodo, hasta: e.target.value })} className={fieldClass} />
        </label>
      </div>
      {periodoInvalido && (
        <p className="text-xs text-red-600 font-medium">La fecha &quot;desde&quot; debe ser anterior o igual a la fecha &quot;hasta&quot;.</p>
      )}

      <div className="space-y-2">
        <div className="flex gap-1 bg-[oklch(0.95_0.01_240)] rounded-lg p-1 max-w-md">
          {(Object.keys(MODO_LABEL) as ModoPeriodo[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => onModo(m)}
              className={cn(
                'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all',
                modo === m
                  ? 'bg-white text-[oklch(0.2_0.06_240)] shadow-sm'
                  : 'text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.3_0.06_240)]',
              )}
            >
              {MODO_LABEL[m]}
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2 bg-[oklch(0.96_0.02_240)] border border-[oklch(0.9_0.02_240)] rounded-lg px-4 py-3">
          <Info className="w-4 h-4 text-[oklch(0.45_0.1_240)] shrink-0 mt-0.5" />
          <p className="text-xs text-[oklch(0.4_0.04_240)]">{explicacion[modo]}</p>
        </div>
      </div>
    </div>
  )
}
