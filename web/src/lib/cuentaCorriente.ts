import { Venta } from './types'

// Saldo real de una venta: el total menos lo que ya se cobró (una venta "cobrado_parcial"
// no debe contar como deuda su monto completo).
export function saldoVenta(venta: Venta): number {
  const cobrado = venta.cobranzas
    .filter(c => c.estado === 'cobrado')
    .reduce((s, c) => s + c.monto, 0)
  return venta.total - cobrado
}

// Fecha de la cuota pendiente más próxima de la venta, si tiene alguna planificada.
export function proximoVencimiento(venta: Venta): string | undefined {
  const pendientes = venta.cobranzas
    .filter(c => c.estado === 'pendiente')
    .map(c => c.fecha)
    .sort()
  return pendientes[0]
}

export function ventasConSaldo(ventas: Venta[], clienteId: string): Venta[] {
  return ventas.filter(v => v.clienteId === clienteId && saldoVenta(v) > 0)
}

export function saldoCliente(ventas: Venta[], clienteId: string): number {
  return ventasConSaldo(ventas, clienteId).reduce((s, v) => s + saldoVenta(v), 0)
}
