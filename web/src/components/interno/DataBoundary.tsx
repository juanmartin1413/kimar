'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { resourcesForRoute, resourceView } from '@/lib/dataResources'
import { QueryState } from './QueryState'

export function DataBoundary({ children }: { children: ReactNode }) {
  const path = usePathname(); const { usuario } = useAuth()
  const { resourceStates, reloadResource } = useData()
  const view = resourceView(resourcesForRoute(path, usuario?.rol), resourceStates)
  const retry = () => { view.failed.forEach(key => { void reloadResource(key) }) }
  if (view.blocked) return <QueryState error="No se pudo cargar la información de esta sección." retry={retry} />
  if (view.pending) return <QueryState loading />
  return <><div aria-live="polite">
    {view.updating && <p role="status" className="mb-3 text-sm text-blue-700">Actualizando…</p>}
    {!!view.failed.length && <QueryState error="No se pudo actualizar. Se muestran los últimos datos disponibles." retry={retry} />}
  </div>{children}</>
}
