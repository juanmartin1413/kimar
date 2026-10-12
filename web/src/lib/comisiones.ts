import { Cliente, Cobranza, Compra, Producto, UnidadProducto, Vendedor, Venta } from './types'
import { Periodo, obtenerUltimoPrecioCompraPorProducto } from './saludFinanciera'

// ────────────────────────────── Vendedores comisionables ──────────────────────────────
// Lista fija por decisión del dueño: solo estos vendedores tienen esquema de comisión.
// Se matchea por nombre (sin distinguir mayúsculas) contra Vendedor.nombre.

export const VENDEDORES_COMISIONABLES = ['Luciano', 'Manolo'] as const

function normalizar(nombre: string): string {
  return nombre.trim().toLowerCase()
}

export function esVendedorComisionable(v: Vendedor): boolean {
  const n = normalizar(v.nombre)
  return VENDEDORES_COMISIONABLES.some(c => normalizar(c) === n)
}

// Incluye inactivos: pueden tener ventas pasadas por liquidar.
export function vendedoresComisionables(vendedores: Vendedor[]): Vendedor[] {
  return vendedores
    .filter(esVendedorComisionable)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

// ────────────────────────────── Período ──────────────────────────────
// 'entrega': la venta entra si su fecha de entrega cae en el período (todas sus cobranzas se muestran).
// 'cobro':   la venta entra si tiene al menos una cobranza cobrada dentro del período; solo esas
//            cobranzas suman como "cobrado en el período" (evita pagar dos veces la misma cobranza
//            al liquidar mes a mes).

export type ModoPeriodo = 'entrega' | 'cobro'

export const MODO_LABEL: Record<ModoPeriodo, string> = {
  entrega: 'Por fecha de entrega',
  cobro: 'Por fecha de cobro',
}

export interface FiltroComisiones {
  vendedorId: string
  periodo: Periodo
  modo: ModoPeriodo
  clienteIds: string[] | null // null = todos los clientes
}

function enPeriodo(fecha: string | undefined, p: Periodo): boolean {
  return !!fecha && fecha >= p.desde && fecha <= p.hasta
}

export function periodoValido(p: Periodo): boolean {
  return !!p.desde && !!p.hasta && p.desde <= p.hasta
}

export function cobranzaCobradaEnPeriodo(c: Cobranza, p: Periodo): boolean {
  return c.estado === 'cobrado' && enPeriodo(c.fechaCobro, p)
}

export function ventaEnPeriodo(v: Venta, p: Periodo, modo: ModoPeriodo): boolean {
  if (modo === 'entrega') return enPeriodo(v.fechaEntrega, p)
  return v.cobranzas.some(c => cobranzaCobradaEnPeriodo(c, p))
}

// Ventas del vendedor en el período, sin filtrar por cliente.
export function ventasDelVendedor(ventas: Venta[], vendedorId: string, p: Periodo, modo: ModoPeriodo): Venta[] {
  return ventas.filter(v => v.vendedorId === vendedorId && ventaEnPeriodo(v, p, modo))
}

// ────────────────────────────── Clientes candidatos ──────────────────────────────
// Unión de los clientes asignados al vendedor y los que aparecen en sus ventas del período
// (una venta puede cargarse con un cliente de otro vendedor; no debe quedar oculta).

export interface ClienteCandidato {
  cliente: Cliente
  asignado: boolean // cliente.vendedorId === vendedorId
}

export function clientesCandidatos(
  ventas: Venta[], clientes: Cliente[], vendedorId: string, p: Periodo, modo: ModoPeriodo,
): ClienteCandidato[] {
  if (!vendedorId) return []
  const porId = new Map(clientes.map(c => [c.id, c]))
  const ids = new Set<string>()
  for (const c of clientes) if (c.vendedorId === vendedorId) ids.add(c.id)
  for (const v of ventasDelVendedor(ventas, vendedorId, p, modo)) ids.add(v.clienteId)

  return [...ids]
    .map(id => porId.get(id))
    .filter((c): c is Cliente => !!c)
    .map(cliente => ({ cliente, asignado: cliente.vendedorId === vendedorId }))
    .sort((a, b) => a.cliente.nombre.localeCompare(b.cliente.nombre, 'es'))
}

// ────────────────────────────── Cálculo principal ──────────────────────────────

export interface VentaComision {
  venta: Venta
  cliente?: Cliente
  cobranzas: Cobranza[] // ordenadas por fecha planificada
  cobradoTotal: number // Σ monto con estado 'cobrado', sin importar la fecha
  cobradoEnPeriodo: number // modo entrega: = cobradoTotal; modo cobro: solo las cobradas dentro del período
  pendiente: number // total − cobradoTotal
  cobranzasEnPeriodoIds: ReadonlySet<string> // para resaltar/atenuar filas en modo cobro
  // Proporción cobrada de la venta (cobradoEnPeriodo / total, 0..1). Regla acordada con el dueño: lo cobrado
  // se reparte entre costo y margen en la misma proporción que tiene la venta ("prorrateo proporcional"),
  // así una venta cobrada al 50% aporta el 50% de su margen a la liquidación.
  ratioCobrado: number
}

export interface ResumenProducto {
  productoId: string
  nombre: string
  unidad: UnidadProducto
  cantidad: number // Σ item.cantidad (kg o unidades según el producto)
  ventaTotal: number // Σ item.subtotal
  cantidadCobrada: number // Σ item.cantidad × ratioCobrado de su venta
  ventaCobrada: number // Σ item.subtotal × ratioCobrado de su venta
}

export interface ResultadoComisiones {
  ventas: VentaComision[]
  resumen: ResumenProducto[]
  totales: { ventaTotal: number; cobrado: number; pendiente: number }
  // Cobranzas cobradas en el período sin venta asociada, de los clientes seleccionados. Informativo:
  // no se puede atribuir a una venta ni a un vendedor, así que no suman.
  cobranzasSinVenta: Cobranza[]
}

const RESULTADO_VACIO: ResultadoComisiones = {
  ventas: [],
  resumen: [],
  totales: { ventaTotal: 0, cobrado: 0, pendiente: 0 },
  cobranzasSinVenta: [],
}

export function calcularComisiones(
  data: { ventas: Venta[]; clientes: Cliente[]; productos: Producto[]; cobranzas: Cobranza[] },
  filtro: FiltroComisiones,
): ResultadoComisiones {
  const { vendedorId, periodo, modo, clienteIds } = filtro
  if (!vendedorId || !periodoValido(periodo)) return RESULTADO_VACIO

  const clientesPorId = new Map(data.clientes.map(c => [c.id, c]))
  const productosPorId = new Map(data.productos.map(p => [p.id, p]))
  const clientesSeleccionados = clienteIds === null ? null : new Set(clienteIds)

  const ventas = ventasDelVendedor(data.ventas, vendedorId, periodo, modo)
    .filter(v => !clientesSeleccionados || clientesSeleccionados.has(v.clienteId))
    .sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega) || (a.nroRemito ?? '').localeCompare(b.nroRemito ?? ''))
    .map((venta): VentaComision => {
      const cobranzas = [...venta.cobranzas].sort((a, b) => a.fecha.localeCompare(b.fecha))
      const enPeriodoIds = new Set(
        cobranzas.filter(c => modo === 'entrega' ? c.estado === 'cobrado' : cobranzaCobradaEnPeriodo(c, periodo)).map(c => c.id),
      )
      const cobradoTotal = cobranzas.filter(c => c.estado === 'cobrado').reduce((s, c) => s + c.monto, 0)
      const cobradoEnPeriodo = cobranzas.filter(c => enPeriodoIds.has(c.id)).reduce((s, c) => s + c.monto, 0)
      return {
        venta,
        cliente: clientesPorId.get(venta.clienteId),
        cobranzas,
        cobradoTotal,
        cobradoEnPeriodo,
        pendiente: venta.total - cobradoTotal,
        cobranzasEnPeriodoIds: enPeriodoIds,
        ratioCobrado: venta.total > 0 ? Math.min(1, cobradoEnPeriodo / venta.total) : 0,
      }
    })

  // Resumen por producto: nombre/unidad del catálogo; si el producto ya no existe, se usa la descripción del ítem.
  const acumulado = new Map<string, ResumenProducto>()
  for (const { venta, ratioCobrado } of ventas) {
    for (const item of venta.items) {
      const producto = productosPorId.get(item.productoId)
      const actual = acumulado.get(item.productoId) ?? {
        productoId: item.productoId,
        nombre: producto?.nombre ?? item.descripcion,
        unidad: producto?.unidad ?? 'kg',
        cantidad: 0,
        ventaTotal: 0,
        cantidadCobrada: 0,
        ventaCobrada: 0,
      }
      actual.cantidad += item.cantidad
      actual.ventaTotal += item.subtotal
      actual.cantidadCobrada += item.cantidad * ratioCobrado
      actual.ventaCobrada += item.subtotal * ratioCobrado
      acumulado.set(item.productoId, actual)
    }
  }
  const resumen = [...acumulado.values()].sort((a, b) => {
    const oa = productosPorId.get(a.productoId)?.orden ?? Number.MAX_SAFE_INTEGER
    const ob = productosPorId.get(b.productoId)?.orden ?? Number.MAX_SAFE_INTEGER
    return oa - ob || a.nombre.localeCompare(b.nombre, 'es')
  })

  const totales = ventas.reduce(
    (t, v) => ({
      ventaTotal: t.ventaTotal + v.venta.total,
      cobrado: t.cobrado + v.cobradoEnPeriodo,
      pendiente: t.pendiente + v.pendiente,
    }),
    { ventaTotal: 0, cobrado: 0, pendiente: 0 },
  )

  const cobranzasSinVenta = modo === 'cobro'
    ? data.cobranzas.filter(c =>
        !c.ventaId
        && cobranzaCobradaEnPeriodo(c, periodo)
        && (clientesSeleccionados ? clientesSeleccionados.has(c.clienteId) : clientesPorId.get(c.clienteId)?.vendedorId === vendedorId))
    : []

  return { ventas, resumen, totales, cobranzasSinVenta }
}

// ────────────────────────────── Costo de adquisición (calculadora efímera) ──────────────────────────────
// El dueño tipea el costo por producto para ver cuánto le corresponde a KIMAR y cuánto queda de margen.
// Nunca se persiste (misma política que "Dinero en caja" en Salud Financiera); se prellena con el
// último precio de compra conocido cuando lo hay.

export type CostosPorProducto = Record<string, string> // valor crudo del input; '' = vacío

export interface ResumenProductoConCosto extends ResumenProducto {
  costoUnitario: number // 0 si no se pudo interpretar un número > 0
  sinCosto: boolean
  costoTotal: number // cantidad × costoUnitario
  margen: number // ventaTotal − costoTotal (margen total, cobrado o no)
  costoCobrado: number // cantidadCobrada × costoUnitario: parte del cobrado que corresponde a KIMAR
  margenCobrado: number // ventaCobrada − costoCobrado: parte del cobrado que corresponde al vendedor
}

export interface TotalesComisiones {
  ventaTotal: number
  cobrado: number
  pendiente: number
  costoTotal: number
  margenBruto: number // ventaTotal − costoTotal (margen total)
  costoCobrado: number // Σ costoCobrado por producto
  margenCobrado: number // Σ margenCobrado por producto = lo que se liquida al vendedor. Identidad: cobrado = costoCobrado + margenCobrado
  productosSinCosto: number
}

// Margen de una venta puntual con los costos tipeados, prorrateado por lo cobrado de esa venta.
export interface MargenVenta {
  margen: number
  margenCobrado: number
  sinCosto: boolean // algún ítem de la venta no tiene costo cargado: el margen está sobreestimado
}

export function margenesPorVenta(ventas: VentaComision[], costos: CostosPorProducto): Map<string, MargenVenta> {
  const resultado = new Map<string, MargenVenta>()
  for (const vc of ventas) {
    let margen = 0
    let sinCosto = false
    for (const item of vc.venta.items) {
      const costo = parseCosto(costos[item.productoId])
      if (costo === 0) sinCosto = true
      margen += item.subtotal - item.cantidad * costo
    }
    resultado.set(vc.venta.id, { margen, margenCobrado: margen * vc.ratioCobrado, sinCosto })
  }
  return resultado
}

// Completa solo los productos que todavía no tienen valor tipeado; nunca pisa lo que escribió el dueño.
export function costosIniciales(resumen: ResumenProducto[], compras: Compra[], actuales: CostosPorProducto): CostosPorProducto {
  const faltantes = resumen.filter(r => !(r.productoId in actuales))
  if (faltantes.length === 0) return actuales
  const ultimoPrecio = obtenerUltimoPrecioCompraPorProducto(compras)
  const nuevos = { ...actuales }
  for (const r of faltantes) {
    const precio = ultimoPrecio.get(r.productoId)
    nuevos[r.productoId] = precio !== undefined ? String(precio) : ''
  }
  return nuevos
}

export function parseCosto(valor: string | undefined): number {
  const n = Number(valor)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function aplicarCostos(resumen: ResumenProducto[], costos: CostosPorProducto): ResumenProductoConCosto[] {
  return resumen.map(r => {
    const costoUnitario = parseCosto(costos[r.productoId])
    const costoTotal = r.cantidad * costoUnitario
    const costoCobrado = r.cantidadCobrada * costoUnitario
    return {
      ...r,
      costoUnitario,
      sinCosto: costoUnitario === 0,
      costoTotal,
      margen: r.ventaTotal - costoTotal,
      costoCobrado,
      margenCobrado: r.ventaCobrada - costoCobrado,
    }
  })
}

export function totalesComisiones(r: ResultadoComisiones, conCosto: ResumenProductoConCosto[]): TotalesComisiones {
  const costoTotal = conCosto.reduce((s, p) => s + p.costoTotal, 0)
  const costoCobrado = conCosto.reduce((s, p) => s + p.costoCobrado, 0)
  const margenCobrado = conCosto.reduce((s, p) => s + p.margenCobrado, 0)
  return {
    ...r.totales,
    costoTotal,
    margenBruto: r.totales.ventaTotal - costoTotal,
    costoCobrado,
    margenCobrado,
    productosSinCosto: conCosto.filter(p => p.sinCosto).length,
  }
}

export function unidadLabel(unidad: UnidadProducto): string {
  return unidad === 'unidad' ? 'unid.' : 'kg'
}

export function formatCantidad(cantidad: number, unidad: UnidadProducto): string {
  const n = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(cantidad)
  return `${n} ${unidadLabel(unidad)}`
}
