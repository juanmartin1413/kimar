'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { api } from '@/lib/api'
import { Adjunto, TipoAdjunto } from '@/lib/types'
import { parseApiError, tipoAdjuntoLabels } from '@/lib/entregas'
import { comprimirImagen, fileABase64 } from '@/lib/imagen'
import { FotoSlot, FotoState, FOTO_VACIA } from '@/components/interno/FotoSlot'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Camera, ImagePlus, Loader2 } from 'lucide-react'

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
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [legible, setLegible] = useState(false)
  const [otraFoto, setOtraFoto] = useState(false)
  const gate = useRef(false)

  useEffect(() => {
    if (!archivo) { setPreview(''); return }
    const url = URL.createObjectURL(archivo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  function seleccionar(file?: File) {
    if (!file || gate.current) return
    if (!file.type.startsWith('image/') || !file.size) {
      setError('Seleccioná una foto válida.'); return
    }
    setError(''); setLegible(false); setArchivo(file); setOtraFoto(false)
  }

  function cancelar() {
    if (gate.current) return
    setArchivo(null); setLegible(false); setOtraFoto(false); setError('')
  }

  function selectores() {
    return <fieldset disabled={foto.subiendo} className="grid gap-2 sm:grid-cols-2">
      <label className="relative flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-3 text-sm font-medium text-blue-900 focus-within:ring-2 focus-within:ring-blue-600">
        <Camera className="h-5 w-5 shrink-0" aria-hidden="true" />Tomar foto (cámara)
        <input aria-label="Tomar foto con la cámara" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" type="file" accept="image/*" capture="environment"
          onChange={e => { seleccionar(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      <label className="relative flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium focus-within:ring-2 focus-within:ring-blue-600">
        <ImagePlus className="h-5 w-5 shrink-0" aria-hidden="true" />Adjuntar foto (galería)
        <input aria-label="Adjuntar foto desde la galería" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" type="file" accept="image/*"
          onChange={e => { seleccionar(e.target.files?.[0]); e.target.value = '' }} />
      </label>
    </fieldset>
  }

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

  async function confirmar() {
    if (!archivo || !legible || gate.current) return
    gate.current = true
    setError('')
    setFoto(f => ({ ...f, subiendo: true }))
    try {
      const comprimido = await comprimirImagen(archivo)
      if (comprimido.size > 8 * 1024 * 1024) throw new Error('La foto supera los 8 MB. Elegí otra foto más liviana.')
      const contenidoBase64 = await fileABase64(comprimido)
      await api.post<Adjunto>(`/api/entregas/${ventaId}/documentos`, {
        tipo, nombre: comprimido.name, contentType: comprimido.type, contenidoBase64,
      })
      setArchivo(null)
      onSubido()
    } catch (e) {
      setError(parseApiError(e, 'No se pudo subir la foto.'))
    } finally {
      gate.current = false
      setFoto(f => ({ ...f, subiendo: false }))
    }
  }

  return <div className="space-y-3">
    <p className="text-sm font-medium text-gray-700">{tipoAdjuntoLabels[tipo]}</p>
    {(foto.previewUrl || foto.loading) && <FotoSlot foto={foto} onFile={seleccionar} permitirQuitar={false} tamanio="lg" />}
    {puedeSubir ? <>
      <p className="text-sm text-slate-500">Fotografiá el remito firmado. Podrás revisarlo antes de confirmar la entrega.</p>
      {selectores()}
    </> : !foto.previewUrl && !foto.loading && <p className="text-sm text-gray-400">Sin documento</p>}
    {error && !archivo && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <Dialog open={!!archivo} onOpenChange={open => { if (!open) cancelar() }}>
      <DialogContent showCloseButton={!foto.subiendo} className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogTitle>¿Marcar pedido como entregado?</DialogTitle>
        <DialogDescription>Revisá que el remito y la firma se lean bien. La foto se guardará únicamente al confirmar. Si elegís otra, reemplazará esta foto.</DialogDescription>
        {preview && <Image unoptimized width={1600} height={1600} key={preview} src={preview} alt="Vista previa del remito firmado" className="max-h-[45dvh] w-full rounded-lg border bg-slate-50 object-contain"
          onLoad={() => setLegible(true)} onError={() => { setLegible(false); setError('No se puede visualizar esta foto. Seleccioná otra en JPG, PNG o WebP.') }} />}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="button" disabled={foto.subiendo || !legible} onClick={confirmar} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-3 font-semibold text-white disabled:opacity-50">
          {foto.subiendo && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}{foto.subiendo ? 'Guardando entrega…' : 'Sí, marcar como entregado'}
        </button>
        <button type="button" disabled={foto.subiendo} onClick={() => setOtraFoto(true)} className="min-h-12 rounded-lg border px-4 py-3 font-medium disabled:opacity-50">Adjuntar otra foto</button>
        {otraFoto && selectores()}
        <button type="button" disabled={foto.subiendo} onClick={cancelar} className="min-h-12 rounded-lg border px-4 py-3 disabled:opacity-50">Cancelar</button>
      </DialogContent>
    </Dialog>
  </div>
}
