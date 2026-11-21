export interface ComisionItem { nombre: string; unidad: string; cantidad: number; tarifa: number; comision: number }
export interface ComisionVenta {
  ventaId: string; clienteId: string; cliente: string; fecha: string; remito?: string; factura?: string
  totalVenta: number; cobrado: number; kilos: number; tarifa: number; total: number; habilitada: number
  liquidada: number; pendiente: number; incluida: boolean; items: ComisionItem[]
  cobros: { id: string; fecha: string; monto: number }[]
}
export interface ComisionAnticipo { id: string; numero: number; fecha: string; monto: number; pendiente: number }
export interface ComisionFiltro { vendedorId: string; hasta: string; desde: string | null; clienteIds: string[] | null; ventaIds: string[] | null }
export interface ComisionPreview {
  vendedorId: string; vendedor: string; tarifa: number; ventas: ComisionVenta[]; total: number; habilitada: number
  liquidada: number; pagado: number; anticiposPendientes: number; ajusteAnterior: number; comision: number
  compensado: number; neto: number; limiteAnticipo: number; anticipos: ComisionAnticipo[]; huella: string
}
export interface ComisionDocumento {
  id: string; numero: number; vendedorId: string; tipo: string; fecha: string; creado: string; usuarioId: string
  origenId?: string; comision: number; pago: number; compensado: number; formaPago?: string; referencia?: string; motivo?: string
  datos: { vendedor: string; tarifa: number; ventas: ComisionVenta[]; saldoAnterior: number; aplicaciones: ComisionAnticipo[]; compensarAdelantos?: boolean }
}
export interface ComisionSaldo { pagado: number; liquidada: number; anticiposPendientes: number; ajusteAnterior: number; anticipos: ComisionAnticipo[] }
export const tipoDocumento: Record<string, string> = {
  liquidacion: 'Liquidación', anticipo: 'Pago a cuenta', contrapartida: 'Contrapartida', devolucion: 'Devolución de anticipo',
}
export const numeroDocumento = (numero: number) => String(numero).padStart(8, '0')
export const formatComision = (valor: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor)
export const hoyComisiones = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
