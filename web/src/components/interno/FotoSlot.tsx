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

export function FotoSlot({ foto, onFile, onQuitar }: {
  foto: FotoState
  onFile: (f: File) => void
  onQuitar: () => void
}) {
  if (foto.loading) {
    return <div className="h-24 w-24 rounded-lg bg-gray-100 animate-pulse" />
  }

  if (foto.previewUrl) {
    return (
      <div className="relative w-fit">
        <a href={foto.previewUrl} target="_blank" rel="noreferrer" title="Ver en tamaño completo">
          <img
            src={foto.previewUrl}
            alt="Comprobante"
            className={cn('h-24 w-24 rounded-lg border border-gray-200 object-cover', foto.subiendo && 'opacity-50')}
          />
        </a>
        {foto.subiendo ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600 bg-white/60 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onQuitar}
            title="Quitar foto"
            className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 text-gray-500 hover:text-red-500 hover:border-red-300 shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  if (foto.subiendo) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 h-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
      </div>
    )
  }

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg px-3 h-8 cursor-pointer hover:bg-gray-50 w-fit">
      <Upload className="w-4 h-4" />
      Elegir foto
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </label>
  )
}
