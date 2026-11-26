'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { CheckCircle2, TriangleAlert, X } from 'lucide-react'
import { cerrarNotificacion, notificacionesStore } from '@/lib/notificaciones'

export function Notificaciones() {
  const items = useSyncExternalStore(notificacionesStore.subscribe, notificacionesStore.getSnapshot, notificacionesStore.getServerSnapshot)
  return <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
    {items.map(n => <div key={n.id} role="status" className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl ${n.tipo === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
      {n.tipo === 'success' ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />}
      <div className="flex-1 text-sm"><p className="font-medium">{n.mensaje}</p>{n.href && <Link className="mt-2 inline-block underline" href={n.href}>Ver detalle</Link>}</div>
      <button type="button" aria-label="Cerrar notificación" onClick={() => cerrarNotificacion(n.id)} className="rounded p-1 hover:bg-black/5"><X className="size-4" /></button>
    </div>)}
  </div>
}
