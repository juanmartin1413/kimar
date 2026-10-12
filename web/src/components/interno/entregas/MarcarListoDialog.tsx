'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { esEnvioExterno, medioEnvioLabels, parseApiError } from '@/lib/entregas'
import { MedioEnvio, RepartidorLite, VentaPreparacion } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

const fieldClass = 'w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]'

// Un solo <select> para repartidor y envío externo: '' = sin asignar, 'medio:uber' / 'medio:remis'
// = envío externo, cualquier otro valor = id del repartidor.
const PREFIJO_MEDIO = 'medio:'
const MEDIOS_EXTERNOS: MedioEnvio[] = ['uber', 'remis']

function valorInicial(v: VentaPreparacion | null): string {
  if (!v) return ''
  if (esEnvioExterno(v.medioEnvio)) return PREFIJO_MEDIO + v.medioEnvio
  return v.repartidorId ?? ''
}

// Marca un pedido como "Listo para entrega" con repartidor opcional o envío por Uber/Remis.
// Sobre un pedido ya listo funciona como "cambiar envío" (el endpoint es idempotente).
export function MarcarListoDialog({ venta, repartidores, onClose, onDone }: {
  venta: VentaPreparacion | null
  repartidores: RepartidorLite[]
  onClose: () => void
  onDone: () => void
}) {
  const [seleccion, setSeleccion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSeleccion(valorInicial(venta))
    setError('')
  }, [venta?.id, venta?.repartidorId, venta?.medioEnvio]) // eslint-disable-line react-hooks/exhaustive-deps

  const reasignando = venta?.estadoEntrega === 'listo'

  async function confirmar() {
    if (!venta) return
    const medioEnvio: MedioEnvio = seleccion.startsWith(PREFIJO_MEDIO)
      ? seleccion.slice(PREFIJO_MEDIO.length) as MedioEnvio
      : 'reparto'
    const repartidorId = medioEnvio === 'reparto' && seleccion ? seleccion : null
    setGuardando(true)
    setError('')
    try {
      await api.post(`/api/entregas/${venta.id}/listo`, { repartidorId, medioEnvio })
      onDone()
    } catch (e) {
      setError(parseApiError(e, 'No se pudo actualizar el pedido.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={!!venta} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{reasignando ? 'Cambiar envío' : 'Listo para entrega'}</DialogTitle>
          <DialogDescription>
            {venta?.clienteNombre}
            {venta?.nroRemito ? ` · Remito ${venta.nroRemito}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Repartidor o envío</label>
            <select value={seleccion} onChange={e => setSeleccion(e.target.value)} className={fieldClass}>
              <option value="">Sin asignar · cualquier repartidor puede tomarlo</option>
              {repartidores.length > 0 && (
                <optgroup label="Repartidores">
                  {repartidores.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Envío externo">
                {MEDIOS_EXTERNOS.map(m => (
                  <option key={m} value={PREFIJO_MEDIO + m}>{medioEnvioLabels[m]}</option>
                ))}
              </optgroup>
            </select>
            {seleccion.startsWith(PREFIJO_MEDIO) ? (
              <p className="text-xs text-gray-500 mt-1">
                No aparece a los repartidores. Cuando llegue, marcalo como entregado desde acá.
              </p>
            ) : repartidores.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No hay repartidores activos cargados.</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={guardando}>Cancelar</Button>
            <Button onClick={confirmar} disabled={guardando}>
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              {reasignando ? 'Guardar' : 'Marcar listo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
