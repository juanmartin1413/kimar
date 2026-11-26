import { FormaPago } from './types'

export interface DeudaPago {
  cobranzaId: string
  ventaId: string
  nroRemito?: string
  nroFactura?: string
  vencimiento: string
  saldo: number
  aplicar: number
}
export interface PreviewPago { version: string; deudas: DeudaPago[] }
export interface ConfirmarPagoPayload {
  operacionId: string
  clienteId: string
  fecha: string
  monto: number
  formaPago: FormaPago
  observaciones: string
  version: string
  imputaciones: { cobranzaId: string; monto: number }[]
}
export interface PagoCliente {
  id: string
  clienteId: string
  clienteNombre: string
  fecha: string
  monto: number
  formaPago: FormaPago
  observaciones?: string
  imputaciones: { cobranzaId: string; ventaId: string; nroRemito?: string; nroFactura?: string; monto: number }[]
}
export const dinero = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(value)
export function distribucionValida(deudas: DeudaPago[], monto: number) {
  return Number.isFinite(monto) && monto > 0 && deudas.every(d => Number.isFinite(d.aplicar) && d.aplicar >= 0 && d.aplicar <= d.saldo && Math.abs(d.aplicar * 100 - Math.round(d.aplicar * 100)) < 0.00001)
    && deudas.reduce((n, d) => n + Math.round(d.aplicar * 100), 0) === Math.round(monto * 100)
}
