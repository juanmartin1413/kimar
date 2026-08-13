import {
  Cliente, Cobranza, Compra, CompromisoProveedor, CuotaProveedor,
  GastoFijo, InstanciaGasto, Producto, Proveedor, Venta,
} from './types'
import { today } from './format'

export interface Periodo {
  desde: string
  hasta: string
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function enPeriodo(fecha: string, p: Periodo): boolean {
  return fecha >= p.desde && fecha <= p.hasta
}

export function periodoSemanal(hoyStr: string = today()): Periodo {
  return { desde: addDaysIso(hoyStr, -6), hasta: hoyStr }
}

export function periodoMensualActual(hoyStr: string = today()): Periodo {
  const [y, m] = hoyStr.split('-')
  return { desde: `${y}-${m}-01`, hasta: hoyStr }
}

// ────────────────────────────── Por cobrar / Por pagar ──────────────────────────────
// Misma lógica que ya usaba ResumenTab en dashboard/page.tsx, extraída para reuso.

export interface PorCobrarResult {
  pendientes: Cobranza[]
  total: number
}

export function calcularPorCobrar(cobranzas: Cobranza[]): PorCobrarResult {
  const pendientes = cobranzas.filter(c => c.estado === 'pendiente')
  return { pendientes, total: pendientes.reduce((s, c) => s + c.monto, 0) }
}

export interface CuotaConMeta extends CuotaProveedor {
  proveedorId: string
  concepto: string
}

export interface PorPagarResult {
  cuotasPendientes: CuotaConMeta[]
  totalCuotas: number
  gastosImpagos: InstanciaGasto[]
  totalGastos: number
  total: number
}

export function calcularPorPagar(
  compromisos: CompromisoProveedor[],
  instanciasGasto: InstanciaGasto[],
  mes: number,
  anio: number
): PorPagarResult {
  const cuotasPendientes: CuotaConMeta[] = compromisos.flatMap(c =>
    c.cuotas
      .filter(cu => cu.estado === 'pendiente')
      .map(cu => ({ ...cu, proveedorId: c.proveedorId, concepto: c.concepto }))
  )
  const totalCuotas = cuotasPendientes.reduce((s, cu) => s + cu.monto, 0)
  const gastosImpagos = instanciasGasto.filter(i => !i.pagado && i.mes === mes && i.anio === anio)
  const totalGastos = gastosImpagos.reduce((s, i) => s + i.monto, 0)
  return { cuotasPendientes, totalCuotas, gastosImpagos, totalGastos, total: totalCuotas + totalGastos }
}

// ────────────────────────────── Balances ──────────────────────────────
// Nota: los kg NO se calculan desde movimientosStock — el backend registra la salida
// de stock por venta con la fecha de HOY (fecha de registro), no con Venta.fechaEntrega,
// lo que daría un número inconsistente con el balance en $ del mismo período. Se usan
// directamente ItemVenta/ItemCompra, filtrando por fechaEntrega/fechaRecepcion.

export interface BalanceDevengado {
  totalVentas: number
  totalCompras: number
  balance: number
}

export function calcularBalanceDevengado(ventas: Venta[], compras: Compra[], p: Periodo): BalanceDevengado {
  const totalVentas = ventas
    .filter(v => enPeriodo(v.fechaEntrega, p))
    .reduce((s, v) => s + v.total, 0)
  const totalCompras = compras
    .filter(c => c.estado !== 'anulada' && enPeriodo(c.fechaRecepcion, p))
    .reduce((s, c) => s + c.total, 0)
  return { totalVentas, totalCompras, balance: totalVentas - totalCompras }
}

export interface BalanceCajaReal {
  totalCobrado: number
  totalPagado: number
  balance: number
}

export function calcularBalanceCajaReal(
  cobranzas: Cobranza[],
  compromisos: CompromisoProveedor[],
  p: Periodo
): BalanceCajaReal {
  const totalCobrado = cobranzas
    .filter(c => c.estado === 'cobrado' && enPeriodo(c.fecha, p))
    .reduce((s, c) => s + c.monto, 0)
  const totalPagado = compromisos
    .flatMap(c => c.cuotas)
    .filter((cu): cu is CuotaProveedor & { fechaPago: string } =>
      cu.estado === 'pagado' && !!cu.fechaPago && enPeriodo(cu.fechaPago, p))
    .reduce((s, cu) => s + (cu.montoPagado ?? cu.monto), 0)
  return { totalCobrado, totalPagado, balance: totalCobrado - totalPagado }
}

function esProductoKg(productoId: string, productos: Producto[]): boolean {
  return productos.find(p => p.id === productoId)?.unidad === 'kg'
}

export interface BalanceKg {
  kgVendidos: number
  kgComprados: number
  balance: number
}

export function calcularBalanceKg(ventas: Venta[], compras: Compra[], productos: Producto[], p: Periodo): BalanceKg {
  const kgVendidos = ventas
    .filter(v => enPeriodo(v.fechaEntrega, p))
    .flatMap(v => v.items)
    .filter(i => esProductoKg(i.productoId, productos))
    .reduce((s, i) => s + i.cantidad, 0)

  const kgComprados = compras
    .filter(c => c.estado !== 'anulada' && enPeriodo(c.fechaRecepcion, p))
    .flatMap(c => c.items)
    .filter(i => esProductoKg(i.productoId, productos))
    .reduce((s, i) => s + i.cantidad, 0)

  return { kgVendidos, kgComprados, balance: kgVendidos - kgComprados }
}

// ────────────────────────────── Mercadería ──────────────────────────────
// Explica por qué el balance en $ puede verse negativo cuando en realidad se compró
// más stock del que se vendió: ese dinero no se perdió, quedó invertido en mercadería.

export function obtenerUltimoPrecioCompraPorProducto(compras: Compra[]): Map<string, number> {
  const precio = new Map<string, number>()
  const fechaUltima = new Map<string, string>()
  for (const compra of compras) {
    if (compra.estado === 'anulada') continue
    for (const item of compra.items) {
      const anterior = fechaUltima.get(item.productoId)
      if (!anterior || compra.fechaRecepcion >= anterior) {
        fechaUltima.set(item.productoId, compra.fechaRecepcion)
        precio.set(item.productoId, item.precioUnitario)
      }
    }
  }
  return precio
}

export interface Mercaderia {
  kgComprados: number
  kgVendidos: number
  deltaKg: number // comprados - vendidos: positivo = el stock creció
  valorDelta: number
  productosSinPrecio: string[]
}

export function calcularMercaderia(ventas: Venta[], compras: Compra[], productos: Producto[], p: Periodo): Mercaderia {
  const productosKg = new Set(productos.filter(pr => pr.unidad === 'kg').map(pr => pr.id))

  const compradoPorProducto = new Map<string, number>()
  for (const compra of compras) {
    if (compra.estado === 'anulada' || !enPeriodo(compra.fechaRecepcion, p)) continue
    for (const item of compra.items) {
      if (!productosKg.has(item.productoId)) continue
      compradoPorProducto.set(item.productoId, (compradoPorProducto.get(item.productoId) ?? 0) + item.cantidad)
    }
  }

  const vendidoPorProducto = new Map<string, number>()
  for (const venta of ventas) {
    if (!enPeriodo(venta.fechaEntrega, p)) continue
    for (const item of venta.items) {
      if (!productosKg.has(item.productoId)) continue
      vendidoPorProducto.set(item.productoId, (vendidoPorProducto.get(item.productoId) ?? 0) + item.cantidad)
    }
  }

  const precioPorProducto = obtenerUltimoPrecioCompraPorProducto(compras)
  const productoIds = new Set([...compradoPorProducto.keys(), ...vendidoPorProducto.keys()])

  let kgComprados = 0
  let kgVendidos = 0
  let valorDelta = 0
  const productosSinPrecio: string[] = []

  for (const productoId of productoIds) {
    const comprado = compradoPorProducto.get(productoId) ?? 0
    const vendido = vendidoPorProducto.get(productoId) ?? 0
    kgComprados += comprado
    kgVendidos += vendido
    const delta = comprado - vendido
    const precio = precioPorProducto.get(productoId)
    if (precio === undefined) {
      if (delta !== 0) productosSinPrecio.push(productoId)
      continue
    }
    valorDelta += delta * precio
  }

  return { kgComprados, kgVendidos, deltaKg: kgComprados - kgVendidos, valorDelta, productosSinPrecio }
}

// ────────────────────────────── Simulación de caja ──────────────────────────────

export function fechaInstanciaGasto(inst: InstanciaGasto, gasto?: GastoFijo): string {
  if (inst.fechaVencimiento) return inst.fechaVencimiento
  const diaPago = gasto?.diaPago ?? 1
  const ultimoDiaMes = new Date(inst.anio, inst.mes, 0).getDate()
  const dia = Math.min(diaPago, ultimoDiaMes)
  return `${inst.anio}-${String(inst.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export interface EventoCaja {
  fecha: string
  tipo: 'ingreso' | 'egreso'
  monto: number
  detalle: string
  origenId: string
}

export interface PuntoLinea {
  fecha: string
  saldo: number
  evento?: EventoCaja
}

export interface Quiebre {
  fecha: string
  saldoResultante: number
  evento: EventoCaja
}

export interface ResultadoSimulacion {
  eventos: EventoCaja[]
  timeline: PuntoLinea[]
  quiebres: Quiebre[]
  saldoFinal: number
  huboQuiebre: boolean
}

export function simularCaja(params: {
  saldoInicial: number
  diasTolerancia: number
  cobranzasPendientes: Cobranza[]
  cuotasProveedorPendientes: CuotaConMeta[]
  instanciasGastoImpagas: InstanciaGasto[]
  clientes: Cliente[]
  proveedores: Proveedor[]
  gastosFijos: GastoFijo[]
  hoyStr?: string
}): ResultadoSimulacion {
  const {
    saldoInicial, cobranzasPendientes, cuotasProveedorPendientes, instanciasGastoImpagas,
    clientes, proveedores, gastosFijos,
  } = params
  const hoyStr = params.hoyStr ?? today()
  const diasTolerancia = Math.max(0, params.diasTolerancia)

  // Un compromiso ya vencido pero aún pendiente sigue siendo una obligación real "desde hoy":
  // la simulación no reconstruye el pasado, arranca siempre en el presente.
  const clampAHoy = (fecha: string) => (fecha < hoyStr ? hoyStr : fecha)

  const ingresos: EventoCaja[] = cobranzasPendientes.map(c => {
    const cliente = clientes.find(cl => cl.id === c.clienteId)
    return {
      fecha: clampAHoy(addDaysIso(c.fecha, diasTolerancia)),
      tipo: 'ingreso',
      monto: c.monto,
      detalle: cliente?.nombre ?? 'Cliente',
      origenId: c.id,
    }
  })

  const egresosProveedor: EventoCaja[] = cuotasProveedorPendientes.map(cu => {
    const prov = proveedores.find(p => p.id === cu.proveedorId)
    return {
      fecha: clampAHoy(cu.fecha),
      tipo: 'egreso',
      monto: cu.monto,
      detalle: `${prov?.nombre ?? 'Proveedor'} · ${cu.concepto}`,
      origenId: cu.id,
    }
  })

  const egresosGasto: EventoCaja[] = instanciasGastoImpagas.map(inst => {
    const gasto = gastosFijos.find(g => g.id === inst.gastoFijoId)
    return {
      fecha: clampAHoy(fechaInstanciaGasto(inst, gasto)),
      tipo: 'egreso',
      monto: inst.monto,
      detalle: gasto?.nombre ?? 'Gasto fijo',
      origenId: inst.id,
    }
  })

  // Orden cronológico; en empate, egresos antes que ingresos (regla conservadora:
  // no asumir que la plata ya entró antes de que salga el mismo día).
  const eventos = [...ingresos, ...egresosProveedor, ...egresosGasto].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
    if (a.tipo === b.tipo) return 0
    return a.tipo === 'egreso' ? -1 : 1
  })

  let saldo = saldoInicial
  const timeline: PuntoLinea[] = [{ fecha: hoyStr, saldo }]
  const quiebres: Quiebre[] = []

  for (const evento of eventos) {
    saldo += evento.tipo === 'ingreso' ? evento.monto : -evento.monto
    timeline.push({ fecha: evento.fecha, saldo, evento })
    if (evento.tipo === 'egreso' && saldo < 0) {
      quiebres.push({ fecha: evento.fecha, saldoResultante: saldo, evento })
    }
  }

  return { eventos, timeline, quiebres, saldoFinal: saldo, huboQuiebre: quiebres.length > 0 }
}
