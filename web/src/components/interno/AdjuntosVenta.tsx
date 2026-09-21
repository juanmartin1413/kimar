'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { Adjunto } from '@/lib/types'
import { formatFechaHora, tipoAdjuntoLabels } from '@/lib/entregas'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { FileImage, Loader2, Trash2 } from 'lucide-react'

interface Fila { adjunto: Adjunto; previewUrl: string | null }

// "Documentos adjuntos" de una venta (detalle de venta, admin/gestor): lista tipificada de lo que
// subió el repartidor (remito firmado) y, a futuro, la factura. Lectura + eliminación; la carga
// se hace desde el módulo de entregas para que la regla "remito firmado ⇒ entregado" viva en un solo lugar.
export function AdjuntosVenta({ ventaId }: { ventaId: string }) {
  const { getAdjuntos, getAdjuntoContenido, eliminarAdjunto } = useData()
  const { canManageData } = useAuth()
  const [filas, setFilas] = useState<Fila[] | null>(null)
  const [ampliada, setAmpliada] = useState<Fila | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      const lista = await getAdjuntos('Venta', ventaId)
      const conPreview = await Promise.all(lista.map(async adjunto => {
        try {
          const c = await getAdjuntoContenido(adjunto.id)
          return { adjunto, previewUrl: `data:${c.contentType};base64,${c.contenidoBase64}` }
        } catch {
          return { adjunto, previewUrl: null }
        }
      }))
      if (!cancelado) setFilas(conPreview)
    }
    cargar()
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaId])

  async function handleEliminar(a: Adjunto) {
    if (!window.confirm(`¿Eliminar "${tipoAdjuntoLabels[a.tipo] ?? a.tipo}"? Esta acción no se puede deshacer.`)) return
    setEliminando(a.id)
    try {
      await eliminarAdjunto(a.id)
      setFilas(f => (f ?? []).filter(x => x.adjunto.id !== a.id))
    } finally {
      setEliminando(null)
    }
  }

  if (filas === null) {
    return <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando documentos…</p>
  }

  if (filas.length === 0) {
    return <p className="text-sm text-[oklch(0.5_0.04_240)]">Sin documentos adjuntos.</p>
  }

  return (
    <>
      <ul className="divide-y divide-[oklch(0.95_0.01_240)]">
        {filas.map(f => (
          <li key={f.adjunto.id} className="py-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() => f.previewUrl && setAmpliada(f)}
              disabled={!f.previewUrl}
              className="shrink-0 rounded-lg overflow-hidden border border-gray-200 h-20 w-20 flex items-center justify-center bg-gray-50 disabled:cursor-default"
              title={f.previewUrl ? 'Ver en grande' : 'Archivo no disponible'}
            >
              {f.previewUrl
                ? <img src={f.previewUrl} alt={f.adjunto.nombre} className="h-20 w-20 object-cover" />
                : <FileImage className="w-6 h-6 text-gray-400" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[oklch(0.25_0.06_240)]">{tipoAdjuntoLabels[f.adjunto.tipo] ?? f.adjunto.tipo}</p>
              <p className="text-xs text-[oklch(0.5_0.04_240)] truncate">{f.adjunto.nombre}</p>
              <p className="text-xs text-[oklch(0.5_0.04_240)]">
                {formatFechaHora(f.adjunto.fechaCreacion)}
                {f.adjunto.usuarioNombre ? ` · Subido por ${f.adjunto.usuarioNombre}` : ''}
              </p>
            </div>
            {canManageData && (
              <button
                type="button"
                onClick={() => handleEliminar(f.adjunto)}
                disabled={eliminando === f.adjunto.id}
                className="p-2 rounded-lg text-[oklch(0.55_0.04_240)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                title="Eliminar documento"
              >
                {eliminando === f.adjunto.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={!!ampliada} onOpenChange={open => { if (!open) setAmpliada(null) }}>
        <DialogContent className="sm:max-w-3xl p-2">
          <DialogTitle className="sr-only">{ampliada ? tipoAdjuntoLabels[ampliada.adjunto.tipo] : 'Documento'}</DialogTitle>
          {ampliada?.previewUrl && (
            <img src={ampliada.previewUrl} alt={ampliada.adjunto.nombre} className="max-h-[80vh] w-auto mx-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
