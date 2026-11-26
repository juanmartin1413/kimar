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
export function fiscalStatusClass(estado: string, acreditada = false) {
  if (acreditada) return 'bg-slate-100 text-slate-700'
  if (estado === 'autorizado') return 'bg-green-100 text-green-800'
  if (['rechazado', 'requiere_atencion'].includes(estado)) return 'bg-red-100 text-red-800'
  return 'bg-amber-100 text-amber-900'
}
export const condicionIvaLabels: Record<number, string> = { 1: 'Responsable inscripto', 6: 'Monotributo', 13: 'Monotributista social', 16: 'Monotributo trabajador independiente promovido' }
export function receptorCliente(c: Cliente): ReceptorFiscal {
  return { razonSocial: c.razonSocial || c.nombre, cuit: c.cuit || '', condicionIva: c.condicionIva || 0,
    domicilio: c.domicilioFiscal || [c.calle, c.altura, c.localidad, c.provincia].filter(Boolean).join(' ') }
}
export function fiscalItems(items: ItemVenta[]) {
  return items.map(i => ({ productoId: i.productoId, calidadId: i.calidadId ?? null, descripcion: i.descripcion, cantidad: i.cantidad, precioUnitario: i.precioUnitario }))
}
export interface DatosFactura {
  receptor: ReceptorFiscal
  descripciones: Record<string, string>
  observaciones: string
}
export function datosFacturaCliente(cliente: Cliente): DatosFactura {
  return { receptor: receptorCliente(cliente), descripciones: {}, observaciones: '' }
}
export function solicitudFactura(clienteId: string, items: ItemVenta[], datos: DatosFactura) {
  return { clienteId, items: fiscalItems(items), receptor: datos.receptor,
    descripciones: items.map(i => datos.descripciones[i.id] ?? i.descripcion), observaciones: datos.observaciones }
}
export function validarDatosFactura(items: ItemVenta[], datos: DatosFactura): string | null {
  const r = datos.receptor
  if (!r.razonSocial.trim()) return 'Completá la razón social en Datos de facturación.'
  if (!r.cuit.trim()) return 'Completá el CUIT en Datos de facturación.'
  if (!condicionIvaLabels[r.condicionIva]) return 'Seleccioná la condición IVA en Datos de facturación.'
  if (!r.domicilio.trim()) return 'Completá el domicilio fiscal en Datos de facturación.'
  if (items.some(i => !(datos.descripciones[i.id] ?? i.descripcion).trim())) return 'Completá las descripciones fiscales de los productos.'
  return null
}
export function roundMoney(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
