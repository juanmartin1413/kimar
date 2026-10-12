'use client'

import { ClienteCandidato } from '@/lib/comisiones'
import { cn } from '@/lib/utils'

interface Props {
  candidatos: ClienteCandidato[]
  seleccionados: string[] | null // null = todos
  onChange: (ids: string[] | null) => void
}

// Selección múltiple de clientes: arrancan todos tildados y el dueño destilda los que no entran en el
// esquema de comisión. null representa "todos" para que un cliente nuevo del vendedor entre solo.
export function ClientesSelector({ candidatos, seleccionados, onChange }: Props) {
  const todosIds = candidatos.map(c => c.cliente.id)
  const estaTildado = (id: string) => seleccionados === null || seleccionados.includes(id)
  const cantidadTildados = seleccionados === null ? todosIds.length : seleccionados.filter(id => todosIds.includes(id)).length

  function toggle(id: string) {
    if (seleccionados === null) {
      onChange(todosIds.filter(x => x !== id))
      return
    }
    const siguiente = seleccionados.includes(id)
      ? seleccionados.filter(x => x !== id)
      : [...seleccionados, id]
    onChange(todosIds.every(x => siguiente.includes(x)) ? null : siguiente)
  }

  if (candidatos.length === 0) {
    return (
      <p className="text-sm text-[oklch(0.55_0.04_240)]">Este vendedor no tiene clientes asignados ni ventas en el período.</p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-[oklch(0.5_0.04_240)]">
          <span className="font-semibold text-[oklch(0.35_0.06_240)]">{cantidadTildados} de {todosIds.length}</span> clientes seleccionados
          {seleccionados !== null && ' · destildá los que no entran en el esquema'}
        </p>
        <div className="flex items-center gap-3 text-xs font-medium">
          <button type="button" onClick={() => onChange(null)} className="text-[oklch(0.42_0.14_240)] hover:underline">Todos</button>
          <button type="button" onClick={() => onChange([])} className="text-[oklch(0.5_0.04_240)] hover:underline">Ninguno</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {candidatos.map(({ cliente, asignado }) => {
          const checked = estaTildado(cliente.id)
          return (
            <label
              key={cliente.id}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border cursor-pointer select-none transition-colors',
                checked
                  ? 'bg-[oklch(0.42_0.14_240)] text-white border-transparent'
                  : 'border-[oklch(0.88_0.02_240)] text-[oklch(0.45_0.04_240)] hover:bg-[oklch(0.95_0.01_240)]',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(cliente.id)}
                className="rounded border-[oklch(0.8_0.02_240)]"
              />
              <span>{cliente.nombre}</span>
              {!asignado && <span className={cn('text-xs', checked ? 'text-white/70' : 'text-[oklch(0.6_0.04_240)]')}>· otro vendedor</span>}
            </label>
          )
        })}
      </div>
    </div>
  )
}
