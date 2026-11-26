'use client'

import { useState } from 'react'
import { addDaysIso, today } from '@/lib/format'

type Periodo = 'todas' | 'hoy' | 'ayer'
const TAMANO = 30

export function useListadoPaginado<T>(items: T[], fecha: (item: T) => string) {
  const [periodo, setPeriodo] = useState<Periodo>('todas')
  const [paginaSolicitada, setPagina] = useState(1)
  const hoy = today()
  const dia = periodo === 'ayer' ? addDaysIso(hoy, -1) : hoy
  const filtrados = periodo === 'todas' ? items : items.filter(item => fecha(item) === dia)
  const total = filtrados.length
  const paginas = Math.max(1, Math.ceil(total / TAMANO))
  const pagina = Math.min(paginaSolicitada, paginas)
  const inicio = (pagina - 1) * TAMANO
  return {
    items: filtrados.slice(inicio, inicio + TAMANO), total, paginas, pagina,
    desde: total ? inicio + 1 : 0, hasta: Math.min(inicio + TAMANO, total), periodo,
    cambiarPeriodo: (value: Periodo) => { setPeriodo(value); setPagina(1) },
    cambiarPagina: (value: number) => setPagina(Math.max(1, Math.min(value, paginas))),
  }
}

type Controles = Omit<ReturnType<typeof useListadoPaginado>, 'items'>

export function FiltrosFecha({ listado, fechaLabel }: { listado: Controles; fechaLabel: string }) {
  return <div className="flex flex-wrap items-center gap-3">
    <div role="group" aria-label={`Filtrar por ${fechaLabel}`} className="flex gap-2">
      {(['todas', 'hoy', 'ayer'] as const).map(periodo => <button key={periodo} type="button"
        aria-pressed={listado.periodo === periodo} onClick={() => listado.cambiarPeriodo(periodo)}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${listado.periodo === periodo ? 'border-blue-800 bg-blue-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-blue-50'}`}>
        {periodo === 'todas' ? 'Todas' : periodo === 'hoy' ? 'Hoy' : 'Ayer'}
      </button>)}
    </div>
    <span className="text-xs text-slate-500">Por {fechaLabel}</span>
  </div>
}

export function PaginacionListado({ listado }: { listado: Controles }) {
  const button = 'rounded-lg border px-3 py-2 text-sm hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed'
  return <nav aria-label="Paginación del listado" className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
    <p role="status" className="text-sm text-slate-600">{listado.total ? `Mostrando ${listado.desde}–${listado.hasta} de ${listado.total}` : '0 registros'}</p>
    <div className="flex items-center gap-3">
      <button type="button" className={button} disabled={listado.pagina <= 1} onClick={() => listado.cambiarPagina(listado.pagina - 1)}>Anterior</button>
      <span className="text-sm text-slate-600">Página {listado.pagina} de {listado.paginas}</span>
      <button type="button" className={button} disabled={listado.pagina >= listado.paginas} onClick={() => listado.cambiarPagina(listado.pagina + 1)}>Siguiente</button>
    </div>
  </nav>
}
