import { Venta } from './types'
import { api } from './api'

export function downloadRemito(venta: Venta): Promise<void> {
  return api.download(`/api/ventas/${venta.id}/remito/pdf`, `Remito-${venta.nroRemito}.pdf`)
}