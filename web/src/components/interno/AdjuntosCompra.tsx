'use client'

import { useEffect, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { Label } from '@/components/ui/label'
import { FotoSlot, FotoState, FOTO_VACIA } from '@/components/interno/FotoSlot'

// Ver/subir/borrar/reemplazar las fotos de remito y factura de una compra ya registrada.
// Las existentes se traen del servidor (data: URL armado con el base64 de /api/adjuntos/{id});
// las nuevas usan el mismo FotoSlot que RegistrarCompraModal, que no distingue el origen del preview.
export function AdjuntosCompra({ compraId }: { compraId: string }) {
  const { getAdjuntos, getAdjuntoContenido, subirAdjunto, eliminarAdjunto } = useData()
  const [remitoFoto, setRemitoFoto] = useState<FotoState>({ ...FOTO_VACIA, loading: true })
  const [facturaFoto, setFacturaFoto] = useState<FotoState>({ ...FOTO_VACIA, loading: true })

  useEffect(() => {
    let cancelado = false

    async function cargarTipo(tipo: 'remito' | 'factura', lista: Awaited<ReturnType<typeof getAdjuntos>>) {
      const setFoto = tipo === 'remito' ? setRemitoFoto : setFacturaFoto
      const encontrado = lista.find(a => a.tipo === tipo)
      if (!encontrado) { if (!cancelado) setFoto(FOTO_VACIA); return }
      const contenido = await getAdjuntoContenido(encontrado.id)
      if (cancelado) return
      setFoto({
        adjunto: encontrado,
        previewUrl: `data:${contenido.contentType};base64,${contenido.contenidoBase64}`,
        loading: false,
        subiendo: false,
      })
    }

    async function cargar() {
      const lista = await getAdjuntos('Compra', compraId)
      await Promise.all([cargarTipo('remito', lista), cargarTipo('factura', lista)])
    }
    cargar()

    return () => { cancelado = true }
    // Solo se re-fetchea cuando cambia la compra que se está mostrando, no cuando cambia la
    // identidad de las funciones del contexto (se recrean en cada render del DataProvider).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compraId])

  async function handleSubir(tipo: 'remito' | 'factura', file: File) {
    const setFoto = tipo === 'remito' ? setRemitoFoto : setFacturaFoto
    setFoto(f => ({ ...f, subiendo: true }))
    try {
      const adjunto = await subirAdjunto('Compra', compraId, tipo, file)
      const contenido = await getAdjuntoContenido(adjunto.id)
      setFoto({
        adjunto,
        previewUrl: `data:${contenido.contentType};base64,${contenido.contenidoBase64}`,
        loading: false,
        subiendo: false,
      })
    } catch {
      setFoto(FOTO_VACIA)
    }
  }

  async function handleQuitar(tipo: 'remito' | 'factura') {
    const foto = tipo === 'remito' ? remitoFoto : facturaFoto
    const setFoto = tipo === 'remito' ? setRemitoFoto : setFacturaFoto
    if (!foto.adjunto) return
    setFoto(f => ({ ...f, subiendo: true }))
    await eliminarAdjunto(foto.adjunto.id)
    setFoto(FOTO_VACIA)
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs">Foto de remito</Label>
        <FotoSlot foto={remitoFoto} onFile={f => handleSubir('remito', f)} onQuitar={() => handleQuitar('remito')} />
      </div>
      <div>
        <Label className="text-xs">Foto de factura</Label>
        <FotoSlot foto={facturaFoto} onFile={f => handleSubir('factura', f)} onQuitar={() => handleQuitar('factura')} />
      </div>
    </div>
  )
}
