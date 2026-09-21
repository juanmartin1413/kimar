'use client'

import { Adjunto } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Upload, X, Loader2 } from 'lucide-react'

// Estado de una foto (remito/factura/otro): puede venir de un blob local recién elegido
// (RegistrarCompraModal, antes de subir) o de un data: URL traído del servidor (AdjuntosCompra).
// A la vista le da igual — ambos son un previewUrl que se puede meter en un <img>.
export interface FotoState {
  adjunto: Adjunto | null
  previewUrl: string | null
  loading: boolean
  subiendo: boolean
}

export const FOTO_VACIA: FotoState = { adjunto: null, previewUrl: null, loading: false, subiendo: false }

export function FotoSlot({
  foto, onFile, onQuitar,
  etiqueta = 'Elegir foto',
  capture,
  permitirQuitar = true,
  tamanio = 'sm',
}: {
  foto: FotoState
  onFile: (f: File) => void
  onQuitar?: () => void
  etiqueta?: string
  // 'environment' abre directamente la cámara trasera en celulares (remito firmado en la calle).
  capture?: 'environment' | 'user'
  permitirQuitar?: boolean
  // 'lg' = versión ancha para uso con el dedo (pantalla del repartidor); 'sm' = miniatura de escritorio.
  tamanio?: 'sm' | 'lg'
}) {
  const grande = tamanio === 'lg'

  if (foto.loading) {
    return <div className={cn('rounded-lg bg-gray-100 animate-pulse', grande ? 'h-40 w-full' : 'h-24 w-24')} />
  }

  if (foto.previewUrl) {
    return (
      <div className={cn('relative', grande ? 'w-full' : 'w-fit')}>
        <a href={foto.previewUrl} target="_blank" rel="noreferrer" title="Ver en tamaño completo">
          <img
            src={foto.previewUrl}
            alt="Comprobante"
            className={cn(
              'rounded-lg border border-gray-200',
              grande ? 'h-40 w-full object-contain bg-gray-50' : 'h-24 w-24 object-cover',
              foto.subiendo && 'opacity-50'
            )}
          />
        </a>
        {foto.subiendo ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600 bg-white/60 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : permitirQuitar && onQuitar ? (
          <button
            type="button"
            onClick={onQuitar}
            title="Quitar foto"
            className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 text-gray-500 hover:text-red-500 hover:border-red-300 shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
    )
  }

  if (foto.subiendo) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-gray-500', grande ? 'h-11 justify-center' : 'h-8')}>
        <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
      </div>
    )
  }

  return (
    <label className={cn(
      'flex items-center gap-2 text-gray-600 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50',
      grande ? 'h-11 w-full justify-center text-base font-medium px-4' : 'h-8 w-fit text-sm px-3'
    )}>
      <Upload className={grande ? 'w-5 h-5' : 'w-4 h-4'} />
      {etiqueta}
      <input
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
      />
    </label>
  )
}
