'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { parseApiError } from '@/lib/entregas'
import { RepartidorLite, VentaPreparacion } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

const fieldClass = 'w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]'

// Marca un pedido como "Listo para entrega" con repartidor opcional. Sobre un pedido ya listo
// funciona como "cambiar repartidor" (el endpoint es idempotente).
export function MarcarListoDialog({ venta, repartidores, onClose, onDone }: {
  venta: VentaPreparacion | null
  repartidores: RepartidorLite[]
  onClose: () => void
  onDone: () => void
}) {
  const [repartidorId, setRepartidorId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setRepartidorId(venta?.repartidorId ?? '')
    setError('')
  }, [venta?.id, venta?.repartidorId])

  const reasignando = venta?.estadoEntrega === 'listo'

  async function confirmar() {
    if (!venta) return
    setGuardando(true)
    setError('')
    try {
      await api.post(`/api/entregas/${venta.id}/listo`, { repartidorId: repartidorId || null })
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
          <DialogTitle>{reasignando ? 'Cambiar repartidor' : 'Listo para entrega'}</DialogTitle>
          <DialogDescription>
            {venta?.clienteNombre}
            {venta?.nroRemito ? ` · Remito ${venta.nroRemito}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Repartidor (opcional)</label>
            <select value={repartidorId} onChange={e => setRepartidorId(e.target.value)} className={fieldClass}>
              <option value="">Sin asignar · cualquier repartidor puede tomarlo</option>
              {repartidores.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            {repartidores.length === 0 && (
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
