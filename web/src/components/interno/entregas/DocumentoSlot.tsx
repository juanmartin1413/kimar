'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Adjunto, TipoAdjunto } from '@/lib/types'
import { parseApiError, tipoAdjuntoLabels } from '@/lib/entregas'
import { comprimirImagen, fileABase64 } from '@/lib/imagen'
import { FotoSlot, FotoState, FOTO_VACIA } from '@/components/interno/FotoSlot'

interface AdjuntoContenido { nombre: string; contentType: string; contenidoBase64: string }

// Un documento tipificado de una venta, visto por el repartidor: muestra el existente (si hay)
// y permite sacar/subir la foto. Subir el remito firmado marca la venta como entregada, por eso pide confirmación.
export function DocumentoSlot({ ventaId, tipo, existente, puedeSubir, onSubido }: {
  ventaId: string
  tipo: TipoAdjunto
  existente?: Adjunto
  puedeSubir: boolean
  onSubido: () => void
}) {
  const [foto, setFoto] = useState<FotoState>({ ...FOTO_VACIA, loading: !!existente })
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    if (!existente) { setFoto(FOTO_VACIA); return }
    setFoto({ ...FOTO_VACIA, loading: true })
    api.get<AdjuntoContenido>(`/api/entregas/${ventaId}/documentos/${existente.id}`)
      .then(c => {
        if (cancelado) return
        setFoto({ adjunto: existente, previewUrl: `data:${c.contentType};base64,${c.contenidoBase64}`, loading: false, subiendo: false })
      })
      .catch(() => { if (!cancelado) setFoto({ adjunto: existente, previewUrl: null, loading: false, subiendo: false }) })
    return () => { cancelado = true }
  }, [ventaId, existente?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFile(file: File) {
    const aviso = tipo === 'remito_firmado'
      ? 'Al subir el remito firmado el pedido se marcará como ENTREGADO. ¿Continuar?'
      : `¿Subir ${tipoAdjuntoLabels[tipo].toLowerCase()}?`
    if (!window.confirm(aviso)) return

    setError('')
    setFoto(f => ({ ...f, subiendo: true }))
    try {
      const comprimido = await comprimirImagen(file)
      const contenidoBase64 = await fileABase64(comprimido)
      await api.post<Adjunto>(`/api/entregas/${ventaId}/documentos`, {
        tipo, nombre: comprimido.name, contentType: comprimido.type, contenidoBase64,
      })
      onSubido()
    } catch (e) {
      setError(parseApiError(e, 'No se pudo subir la foto.'))
      setFoto(f => ({ ...f, subiendo: false }))
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{tipoAdjuntoLabels[tipo]}</p>
      {foto.previewUrl || foto.loading ? (
        <FotoSlot foto={foto} onFile={handleFile} permitirQuitar={false} tamanio="lg" />
      ) : puedeSubir ? (
        <FotoSlot foto={foto} onFile={handleFile} etiqueta="Sacar foto del remito firmado" capture="environment" tamanio="lg" />
      ) : (
        <p className="text-sm text-gray-400">Sin documento</p>
      )}
      {foto.previewUrl && puedeSubir && !foto.subiendo && (
        <FotoSlot foto={FOTO_VACIA} onFile={handleFile} etiqueta="Volver a sacar la foto" capture="environment" tamanio="lg" />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
