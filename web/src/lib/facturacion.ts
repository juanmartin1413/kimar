import { Cliente, ItemVenta } from './types'

export interface ReceptorFiscal { razonSocial: string; cuit: string; condicionIva: number; domicilio: string }
export interface EmisorFiscal { id: string; cuit: string; razonSocial: string; domicilio: string; ingresosBrutos: string; inicioActividades: string; puntoVenta: number }
export interface ItemFiscal { descripcion: string; cantidad: number; unidad: string; precio: number; neto: number; iva: number }
export interface ComprobanteFiscal {
  id: string; ventaId?: string; emisorId: string; ambiente: string; tipo: number; puntoVenta: number; numero?: number
  numeroCompleto?: string; fecha: string; neto: number; iva: number; total: number; estado: string
  cae?: string; vencimientoCae?: string; datos: { emisor: EmisorFiscal; receptor: ReceptorFiscal; items: ItemFiscal[]; observaciones?: string }
  comprobanteOrigenId?: string; reemplazaId?: string; motivo?: string; efectoComercial?: string; ultimoError?: string
  observacionesArca?: string; intentos: number; proximoIntento?: string; ultimoIntento?: string; fechaCreacion: string; pdfDisponible: boolean; errorPdf?: string
}
export interface FiscalConfig { ambiente: string; emisor?: EmisorFiscal; reintentoMinutos: number; error?: string }
export const fiscalLabels: Record<string, string> = {
  borrador: 'Borrador', pendiente: 'Pendiente de emisión', en_proceso: 'Emitiendo', desconocido: 'Verificando emisión',
  autorizado: 'Autorizado', rechazado: 'Rechazado: corregir datos', requiere_atencion: 'Requiere intervención',
}
export const condicionIvaLabels: Record<number, string> = { 1: 'Responsable inscripto', 6: 'Monotributo', 13: 'Monotributista social', 16: 'Monotributo trabajador independiente promovido' }
export function receptorCliente(c: Cliente): ReceptorFiscal {
  return { razonSocial: c.razonSocial || c.nombre, cuit: c.cuit || '', condicionIva: c.condicionIva || 0,
    domicilio: c.domicilioFiscal || [c.calle, c.altura, c.localidad, c.provincia].filter(Boolean).join(' ') }
}
export function fiscalItems(items: ItemVenta[]) {
  return items.map(i => ({ productoId: i.productoId, calidadId: i.calidadId ?? null, descripcion: i.descripcion, cantidad: i.cantidad, precioUnitario: i.precioUnitario }))
}
export function roundMoney(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
