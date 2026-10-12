'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { medioEnvioLabels, parseApiError } from '@/lib/entregas'
import { comprimirImagen, fileABase64 } from '@/lib/imagen'
import { MedioEnvio } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FotoSlot, FOTO_VACIA } from '@/components/interno/FotoSlot'
import { Loader2 } from 'lucide-react'

export interface VentaACerrar {
  id: string
  clienteNombre: string
  nroRemito?: string
  medioEnvio: MedioEnvio
}

// Cierre manual de un envío por Uber/Remis: no hay repartidor que suba el remito firmado.
// La foto es opcional (por ejemplo, si el chofer la manda por WhatsApp). Marcar entregado es final.
export function MarcarEntregadoDialog({ venta, onClose, onDone }: {
  venta: VentaACerrar | null
  onClose: () => void
  onDone: () => void
}) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setArchivo(null)
    setError('')
  }, [venta?.id])

  useEffect(() => {
    if (!archivo) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(archivo)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  async function confirmar() {
    if (!venta) return
    setGuardando(true)
    setError('')
    try {
      let body: { nombre?: string; contentType?: string; contenidoBase64?: string } = {}
      if (archivo) {
        const comprimido = await comprimirImagen(archivo)
        body = { nombre: comprimido.name, contentType: comprimido.type, contenidoBase64: await fileABase64(comprimido) }
      }
      await api.post(`/api/entregas/${venta.id}/entregado`, body)
      onDone()
    } catch (e) {
      setError(parseApiError(e, 'No se pudo marcar el pedido como entregado.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={!!venta} onOpenChange={open => { if (!open && !guardando) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar entregado</DialogTitle>
          <DialogDescription>
            {venta?.clienteNombre}
            {venta?.nroRemito ? ` · Remito ${venta.nroRemito}` : ''}
            {venta ? ` · ${medioEnvioLabels[venta.medioEnvio]}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[oklch(0.35_0.06_240)]">Foto del remito firmado (opcional)</p>
            <FotoSlot
              foto={{ ...FOTO_VACIA, previewUrl, subiendo: guardando && !!archivo }}
              onFile={setArchivo}
              onQuitar={() => setArchivo(null)}
              etiqueta="Agregar foto"
              tamanio="lg"
            />
          </div>

          <p className="text-xs text-gray-500">Una vez marcado como entregado no se puede volver atrás.</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={guardando}>Cancelar</Button>
            <Button onClick={confirmar} disabled={guardando}>
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              Marcar entregado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
