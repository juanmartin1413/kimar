'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { notificar } from '@/lib/notificaciones'
import { useData } from '@/contexts/DataContext'

const mensajes: Record<string, { texto: string; color: string }> = {
  sin_factura: { texto: 'Venta registrada correctamente.', color: 'bg-green-50 text-green-800 border-green-200' },
  autorizado: { texto: 'Venta registrada y factura autorizada.', color: 'bg-green-50 text-green-800 border-green-200' },
  pendiente: { texto: 'Venta registrada. La factura continúa pendiente; podés consultar su estado desde la venta.', color: 'bg-amber-50 text-amber-900 border-amber-200' },
  requiere_revision: { texto: 'Venta registrada. La factura requiere revisión. Abrí la venta para consultar el motivo.', color: 'bg-red-50 text-red-800 border-red-200' },
}

export function ResultadoRegistroVenta() {
  const params = useSearchParams()
  const router = useRouter()
  const { refresh } = useData()
  const refreshed = useRef('')
  const estado = params.get('registro') ?? ''
  const ventaId = params.get('venta') ?? ''
  const notice = mensajes[estado]
  const validId = /^[a-f0-9-]{36}$/i.test(ventaId)
  useEffect(() => {
    if (notice && validId && refreshed.current !== ventaId) {
      refreshed.current = ventaId
      refresh()
      notificar(notice.texto, estado === 'pendiente' || estado === 'requiere_revision' ? 'warning' : 'success', `/interno/ventas/${ventaId}`)
      router.replace('/interno/ventas', { scroll: false })
    }
  }, [notice, validId, ventaId, refresh, estado, router])
  return null
}
