'use client'

import { ConfirmarPagoPayload } from '@/lib/cobranzas'

import { createContext, useContext } from 'react'
import { useResourceStore } from './useResourceStore'
import { Resource, ResourceStates } from '@/lib/dataResources'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import {
  Adjunto, AppData, Calidad, Cliente, Compra, CompromisoProveedor,
  CreateCompraPayload, CreateFormaPagoPayload, CreateProductoPayload, FormaPagoProveedor,
  GastoFijo, InstanciaGasto, MovimientoStock, Pedido,
  Producto, ProductoProveedor, Proveedor, StockRealRegistrado,
  UpdateVentaCompletaPayload, Vendedor, Venta,
} from '@/lib/types'
import { generateId } from '@/lib/storage'

const EMPTY: AppData = {
  usuarios: [], vendedores: [], clientes: [], productos: [], pedidos: [],
  ventas: [], cobranzas: [], proveedores: [], compromisosProveedor: [],
  formasPagoProveedor: [], compras: [],
  productosProveedores: [], movimientosStock: [], stockPorProducto: [],
  stockRealRegistrado: [], gastosFijos: [], instanciasGasto: [], calidades: [],
}

interface DataContextValue {
  data: AppData
  isLoading: boolean
  resourceStates: ResourceStates
  reloadResource: (key: Resource) => Promise<void>
  refresh: () => void
  addCliente: (c: Omit<Cliente, 'id' | 'fechaCreacion' | 'activo'>) => void
  updateCliente: (id: string, c: Partial<Cliente>) => void
  deleteCliente: (id: string) => void
  updateProductoPrecio: (id: string, precio: number) => void
  updateProducto: (id: string, p: Partial<Omit<Producto, 'id'>>) => void
  addProducto: (p: CreateProductoPayload) => void
  reorderProductos: (items: { id: string; orden: number }[]) => void
  addPedido: (p: Omit<Pedido, 'id' | 'fechaCreacion' | 'estado'>) => Promise<string>
  updatePedido: (id: string, p: Partial<Pedido>) => Promise<void>
  updatePedidoCompleto: (id: string, p: Omit<Pedido, 'id' | 'fechaCreacion' | 'estado'>) => Promise<void>
  addVenta: (v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas' | 'estadoEntrega' | 'repartidorId' | 'repartidorNombre' | 'fechaEntregado' | 'medioEnvio'>) => Promise<{ id: string; estadoFiscal: string }>
  // Remito / factura / observaciones (admin y gestor)
  updateVentaDatos: (id: string, d: { nroRemito?: string; nroFactura?: string; observaciones?: string }) => Promise<void>
  // Ítems (con ajuste de stock), cabecera y compromiso automático (solo admin)
  updateVentaCompleta: (id: string, payload: UpdateVentaCompletaPayload) => Promise<void>
  refrescarCobros: () => Promise<void>
  registrarPago: (p: ConfirmarPagoPayload) => Promise<{ id: string }>
  addVendedor: (v: Omit<Vendedor, 'id'>) => void
  updateVendedor: (id: string, v: Partial<Vendedor>) => void
  addProveedor: (p: Omit<Proveedor, 'id' | 'fechaCreacion' | 'activo'>) => void
  updateProveedor: (id: string, p: Partial<Proveedor>) => void
  addCompromisoProveedor: (c: Omit<CompromisoProveedor, 'id' | 'fechaCreacion'>) => void
  updateCompromisoProveedor: (id: string, c: Partial<CompromisoProveedor>) => void
  pagarCuotaProveedor: (compromisoId: string, cuotaId: string, pago?: { montoPagado?: number; formaPagoReal?: string }) => void
  crearFormaPagoProveedor: (proveedorId: string, req: CreateFormaPagoPayload) => Promise<void>
  getFormaPagoVigente: (proveedorId: string) => FormaPagoProveedor | undefined
  getHistorialFormaPago: (proveedorId: string) => FormaPagoProveedor[]
  registrarCompra: (req: CreateCompraPayload) => Promise<Compra>
  subirAdjunto: (entidadTipo: string, entidadId: string, tipo: string, file: File) => Promise<Adjunto>
  getAdjuntos: (entidadTipo: string, entidadId: string) => Promise<Adjunto[]>
  getAdjuntoContenido: (id: string) => Promise<{ nombre: string; contentType: string; contenidoBase64: string }>
  eliminarAdjunto: (id: string) => Promise<void>
  addGastoFijo: (g: Omit<GastoFijo, 'id' | 'fechaCreacion' | 'activo'>) => void
  updateGastoFijo: (id: string, g: Partial<GastoFijo>) => void
  deleteGastoFijo: (id: string) => void
  generarInstanciasMensuales: (mes: number, anio: number) => void
  pagarInstanciaGasto: (id: string) => void
  updateInstanciaGasto: (id: string, g: Partial<InstanciaGasto>) => void
  addMovimientoStock: (m: Omit<MovimientoStock, 'id' | 'fechaCreacion'>) => void
  updateMovimientoStock: (id: string, m: Partial<MovimientoStock>) => void
  deleteMovimientoStock: (id: string) => void
  getStockActual: (productoId: string, calidadId?: string) => number
  getStockTotal: (productoId: string) => number
  addProductoProveedor: (pp: Omit<ProductoProveedor, 'id'>) => void
  updateProductoProveedor: (id: string, pp: Partial<ProductoProveedor>) => void
  deleteProductoProveedor: (id: string) => void
  getProveedoresDelProducto: (productoId: string) => ProductoProveedor[]
  updateStockMinimo: (productoId: string, minimo: number, calidadId?: string) => void
  isStockBajo: (productoId: string) => boolean
  addStockRealRegistrado: (srr: Omit<StockRealRegistrado, 'id'>) => Promise<void>
  getStockRealPorProducto: (productoId: string) => StockRealRegistrado | null
  getCalidadesDelProducto: (productoId: string) => Calidad[]
  addCalidad: (productoId: string, nombre: string) => Promise<void>
  updateCalidad: (id: string, c: Partial<Pick<Calidad, 'nombre' | 'activo'>>) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  return <DataSession key={(usuario?.id || 'anonymous') + ':' + (usuario?.rol || '')}>{children}</DataSession>
}

function DataSession({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  const { data, setData, resourceStates, reloadResource, loadAll, isLoading } = useResourceStore(EMPTY, usuario?.rol)
  const rClientes = () => reloadResource('clientes')
  const rProductos = () => reloadResource('productos')
  const rVendedores = () => reloadResource('vendedores')
  const rPedidos = () => reloadResource('pedidos')
  const rVentas = () => Promise.all([reloadResource('ventas'), reloadResource('cobranzas')])
  const rStock = () => reloadResource('stockPorProducto')
  const rMovimientos = () => reloadResource('movimientosStock')
  const rProveedoresYCompromisos = () => Promise.all([reloadResource('proveedores'), reloadResource('compromisosProveedor')])
  const rFormaPago = () => reloadResource('formasPagoProveedor')
  const rCompras = () => reloadResource('compras')
  const rGastos = () => Promise.all([reloadResource('gastosFijos'), reloadResource('instanciasGasto')])

  // ── Clientes ─────────────────────────────────────────────────────────────────
  async function addCliente(c: Omit<Cliente, 'id' | 'fechaCreacion' | 'activo'>) {
    await api.post('/api/clientes', c)
    await rClientes()
  }

  async function updateCliente(id: string, c: Partial<Cliente>) {
    await api.put(`/api/clientes/${id}`, c)
    await rClientes()
  }

  async function deleteCliente(id: string) {
    await api.put(`/api/clientes/${id}`, { activo: false })
    await rClientes()
  }

  // ── Productos ────────────────────────────────────────────────────────────────
  async function updateProductoPrecio(id: string, precio: number) {
    await api.put(`/api/productos/${id}`, { precioKg: precio })
    await rProductos()
  }

  async function updateProducto(id: string, p: Partial<Omit<Producto, 'id'>>) {
    await api.put(`/api/productos/${id}`, p)
    await rProductos()
  }

  async function addProducto(p: CreateProductoPayload) {
    await api.post('/api/productos', p)
    await rProductos()
  }

  async function reorderProductos(items: { id: string; orden: number }[]) {
    setData(prev => ({
      ...prev,
      productos: prev.productos.map(p => {
        const item = items.find(i => i.id === p.id)
        return item ? { ...p, orden: item.orden } : p
      }),
    }))
    await api.put('/api/productos/reorden', items)
  }

  // ── Pedidos ──────────────────────────────────────────────────────────────────
  async function addPedido(p: Omit<Pedido, 'id' | 'fechaCreacion' | 'estado'>): Promise<string> {
    const res = await api.post<{ id: string }>('/api/pedidos', {
      clienteId: p.clienteId,
      vendedorId: p.vendedorId,
      fecha: p.fecha,
      fechaEntrega: p.fechaEntrega, horaEntregaDesde: p.horaEntregaDesde ? p.horaEntregaDesde.slice(0,5) + ":00" : null, horaEntregaHasta: p.horaEntregaHasta ? p.horaEntregaHasta.slice(0,5) + ":00" : null,
      observaciones: p.observaciones ?? null,
      items: p.items.map(i => ({
        productoId: i.productoId,
        productoNombre: i.productoNombre,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    })
    await rPedidos()
    return res.id
  }

  async function updatePedidoCompleto(id: string, p: Omit<Pedido, 'id' | 'fechaCreacion' | 'estado'>) {
    await api.put('/api/pedidos/' + id + '/completo', {
      ...p,
      horaEntregaDesde: p.horaEntregaDesde ? p.horaEntregaDesde.slice(0, 5) + ':00' : null,
      horaEntregaHasta: p.horaEntregaHasta ? p.horaEntregaHasta.slice(0, 5) + ':00' : null,
      observaciones: p.observaciones ?? null,
    })
    await rPedidos()
  }

  async function updatePedido(id: string, p: Partial<Pedido>) {
    await api.put(`/api/pedidos/${id}`, { estado: p.estado, observaciones: p.observaciones ?? null })
    await rPedidos()
  }

  // ── Ventas ───────────────────────────────────────────────────────────────────
  async function addVenta(
    v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas' | 'estadoEntrega' | 'repartidorId' | 'repartidorNombre' | 'fechaEntregado' | 'medioEnvio'>
  ): Promise<{ id: string; estadoFiscal: string }> {
    const result = await api.post<{ id: string; estadoFiscal: string }>('/api/ventas', {
      emitirFactura: v.emitirFactura ?? false, borradorFiscalId: v.borradorFiscalId ?? null, operacionId: v.operacionId ?? null,
      pedidoId: v.pedidoId ?? null,
      clienteId: v.clienteId,
      vendedorId: v.vendedorId,
      fechaEntrega: v.fechaEntrega,
      horaEntregaDesde: v.horaEntregaDesde ? v.horaEntregaDesde.slice(0,5) + ':00' : null, horaEntregaHasta: v.horaEntregaHasta ? v.horaEntregaHasta.slice(0,5) + ':00' : null,
      nroRemito: v.nroRemito ?? null,
      nroFactura: v.nroFactura ?? null,
      observaciones: v.observaciones ?? null,
      items: v.items.map(i => ({
        productoId: i.productoId,
        calidadId: i.calidadId ?? null,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    })
    // The sale is already committed. A refresh failure must not present it as a failed registration.
    void Promise.allSettled([rVentas(), rStock(), rPedidos()])
    return result
  }

  async function updateVentaDatos(id: string, d: { nroRemito?: string; nroFactura?: string; observaciones?: string }): Promise<void> {
    await api.put(`/api/ventas/${id}`, {
      nroRemito: d.nroRemito ?? null,
      nroFactura: d.nroFactura ?? null,
      observaciones: d.observaciones ?? null,
    })
    await rVentas()
  }

  async function updateVentaCompleta(id: string, payload: UpdateVentaCompletaPayload): Promise<void> {
    await api.put(`/api/ventas/${id}/completa`, {
      clienteId: payload.clienteId,
      vendedorId: payload.vendedorId,
      fechaEntrega: payload.fechaEntrega,
      horaEntregaDesde: payload.horaEntregaDesde ? payload.horaEntregaDesde.slice(0,5) + ':00' : null, horaEntregaHasta: payload.horaEntregaHasta ? payload.horaEntregaHasta.slice(0,5) + ':00' : null,
      nroRemito: payload.nroRemito ?? null,
      nroFactura: payload.nroFactura ?? null,
      observaciones: payload.observaciones ?? null,
      items: payload.items.map(i => ({
        productoId: i.productoId,
        calidadId: i.calidadId ?? null,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    })
    // Cambian ventas + cobranzas, stock actual y movimientos
    await Promise.all([rVentas(), rStock(), rMovimientos()])
  }

  // ── Cobranzas ────────────────────────────────────────────────────────────────
  async function refrescarCobros() {
    await rVentas()
  }

  async function registrarPago(p: ConfirmarPagoPayload) {
    const result = await api.post<{ id: string }>('/api/cobranzas/pagos', p)
    await refrescarCobros().catch(() => undefined)
    return result
  }

  async function addVendedor(v: Omit<Vendedor, 'id'>) {
    await api.post('/api/vendedores', { nombre: v.nombre, usuarioId: v.usuarioId ?? null })
    await rVendedores()
  }

  async function updateVendedor(id: string, v: Partial<Vendedor>) {
    await api.put(`/api/vendedores/${id}`, { nombre: v.nombre, activo: v.activo })
    await rVendedores()
  }

  // ── Proveedores ──────────────────────────────────────────────────────────────
  async function addProveedor(p: Omit<Proveedor, 'id' | 'fechaCreacion' | 'activo'>) {
    await api.post('/api/proveedores', p)
    await rProveedoresYCompromisos()
  }

  async function updateProveedor(id: string, p: Partial<Proveedor>) {
    await api.put(`/api/proveedores/${id}`, p)
    await rProveedoresYCompromisos()
  }

  async function addCompromisoProveedor(c: Omit<CompromisoProveedor, 'id' | 'fechaCreacion'>) {
    await api.post('/api/proveedores/compromisos', {
      proveedorId: c.proveedorId,
      concepto: c.concepto,
      observaciones: c.observaciones ?? null,
      cuotas: c.cuotas.map(q => ({ fecha: q.fecha, monto: q.monto, formaPago: q.formaPago })),
    })
    await rProveedoresYCompromisos()
  }

  function updateCompromisoProveedor(id: string, c: Partial<CompromisoProveedor>) {
    setData(prev => ({
      ...prev,
      compromisosProveedor: prev.compromisosProveedor.map(x => x.id === id ? { ...x, ...c } : x),
    }))
  }

  async function pagarCuotaProveedor(
    compromisoId: string, cuotaId: string,
    pago?: { montoPagado?: number; formaPagoReal?: string }
  ) {
    await api.post(`/api/proveedores/cuotas/${cuotaId}/pagar`, pago ?? {})
    await reloadResource('compromisosProveedor')
  }

  // ── Forma de pago negociada ──────────────────────────────────────────────────
  async function crearFormaPagoProveedor(proveedorId: string, req: CreateFormaPagoPayload) {
    await api.post(`/api/proveedores/${proveedorId}/forma-pago`, req)
    await rFormaPago()
  }

  function getFormaPagoVigente(proveedorId: string): FormaPagoProveedor | undefined {
    return data.formasPagoProveedor.find(f => f.proveedorId === proveedorId && !f.fechaHasta)
  }

  function getHistorialFormaPago(proveedorId: string): FormaPagoProveedor[] {
    return data.formasPagoProveedor
      .filter(f => f.proveedorId === proveedorId)
      .sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde))
  }

  // ── Compras a proveedores ────────────────────────────────────────────────────
  async function registrarCompra(req: CreateCompraPayload): Promise<Compra> {
    const compra = await api.post<Compra>('/api/compras', req)
    await Promise.all([rCompras(), rStock(), rMovimientos(), rProveedoresYCompromisos()])
    return compra
  }

  // ── Adjuntos (remitos, facturas, otros comprobantes) ─────────────────────────
  async function subirAdjunto(entidadTipo: string, entidadId: string, tipo: string, file: File): Promise<Adjunto> {
    if (entidadTipo === 'PagoCliente' && (file.size === 0 || file.size > 8 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type))) throw new Error('Adjuntá PDF, JPG, PNG o WebP de hasta 8 MB.')
    const contenidoBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    return api.post<Adjunto>('/api/adjuntos', {
      entidadTipo, entidadId, tipo, nombre: file.name, contentType: file.type, contenidoBase64,
    })
  }

  async function getAdjuntos(entidadTipo: string, entidadId: string): Promise<Adjunto[]> {
    return api.get<Adjunto[]>(`/api/adjuntos?entidadTipo=${entidadTipo}&entidadId=${entidadId}`)
  }

  async function getAdjuntoContenido(id: string): Promise<{ nombre: string; contentType: string; contenidoBase64: string }> {
    return api.get(`/api/adjuntos/${id}`)
  }

  async function eliminarAdjunto(id: string) {
    await api.delete(`/api/adjuntos/${id}`)
  }

  // ── Gastos Fijos ─────────────────────────────────────────────────────────────
  async function addGastoFijo(g: Omit<GastoFijo, 'id' | 'fechaCreacion' | 'activo'>) {
    await api.post('/api/gastos', g)
    await rGastos()
  }

  async function updateGastoFijo(id: string, g: Partial<GastoFijo>) {
    await api.put(`/api/gastos/${id}`, g)
    await rGastos()
  }

  async function deleteGastoFijo(id: string) {
    await api.put(`/api/gastos/${id}`, { activo: false })
    await rGastos()
  }

  async function generarInstanciasMensuales(mes: number, anio: number) {
    await api.post(`/api/gastos/generar-mensuales?mes=${mes}&anio=${anio}`)
    await rGastos()
  }

  async function pagarInstanciaGasto(id: string) {
    await api.post(`/api/gastos/instancias/${id}/pagar`)
    await reloadResource('instanciasGasto')
  }

  function updateInstanciaGasto(id: string, g: Partial<InstanciaGasto>) {
    setData(prev => ({
      ...prev,
      instanciasGasto: prev.instanciasGasto.map(x => x.id === id ? { ...x, ...g } : x),
    }))
  }

  // ── Stock ─────────────────────────────────────────────────────────────────────
  async function addMovimientoStock(m: Omit<MovimientoStock, 'id' | 'fechaCreacion'>) {
    if (m.tipo === 'entrada') {
      await api.post('/api/stock/entrada', {
        productoId: m.productoId,
        calidadId: m.calidadId ?? null,
        cantidad: m.cantidad,
        proveedorId: m.proveedorId ?? null,
        fecha: m.fecha,
        observaciones: m.observaciones ?? null,
      })
    } else {
      await api.post('/api/stock/salida', {
        productoId: m.productoId,
        calidadId: m.calidadId ?? null,
        cantidad: m.cantidad,
        motivo: m.motivo,
        fecha: m.fecha,
        observaciones: m.observaciones ?? null,
      })
    }
    await Promise.all([rStock(), rMovimientos()])
  }

  function updateMovimientoStock(id: string, m: Partial<MovimientoStock>) {
    setData(prev => ({
      ...prev,
      movimientosStock: prev.movimientosStock.map(x => x.id === id ? { ...x, ...m } : x),
    }))
  }

  function deleteMovimientoStock(id: string) {
    setData(prev => ({
      ...prev,
      movimientosStock: prev.movimientosStock.filter(x => x.id !== id),
    }))
  }

  function getStockActual(productoId: string, calidadId?: string): number {
    const stock = data.stockPorProducto.find(s => s.productoId === productoId && s.calidadId === calidadId)
    return stock ? stock.cantidad : 0
  }

  function getStockTotal(productoId: string): number {
    return data.stockPorProducto
      .filter(s => s.productoId === productoId)
      .reduce((sum, s) => sum + s.cantidad, 0)
  }

  async function updateStockMinimo(productoId: string, minimo: number, calidadId?: string) {
    await api.put(`/api/stock/${productoId}/minimo`, { stockMinimo: minimo, calidadId: calidadId ?? null })
    await rStock()
  }

  function isStockBajo(productoId: string): boolean {
    const stock = data.stockPorProducto.find(s => s.productoId === productoId)
    return stock ? stock.cantidad < stock.stockMinimo : false
  }

  function addProductoProveedor(pp: Omit<ProductoProveedor, 'id'>) {
    setData(prev => ({ ...prev, productosProveedores: [...prev.productosProveedores, { ...pp, id: generateId() }] }))
  }

  function updateProductoProveedor(id: string, pp: Partial<ProductoProveedor>) {
    setData(prev => ({ ...prev, productosProveedores: prev.productosProveedores.map(x => x.id === id ? { ...x, ...pp } : x) }))
  }

  function deleteProductoProveedor(id: string) {
    setData(prev => ({ ...prev, productosProveedores: prev.productosProveedores.filter(x => x.id !== id) }))
  }

  function getProveedoresDelProducto(productoId: string): ProductoProveedor[] {
    return data.productosProveedores.filter(pp => pp.productoId === productoId && pp.activo)
  }

  async function addStockRealRegistrado(srr: Omit<StockRealRegistrado, 'id'>) {
    await api.post('/api/stock/real', srr)
    setData(prev => ({ ...prev, stockRealRegistrado: [...prev.stockRealRegistrado, { ...srr, id: generateId() }] }))
  }

  function getStockRealPorProducto(productoId: string): StockRealRegistrado | null {
    const registros = data.stockRealRegistrado.filter(sr => sr.productoId === productoId)
    return registros.length > 0 ? registros[registros.length - 1] : null
  }

  // ── Calidades (variantes internas de stock, nunca visibles al cliente) ────────
  function getCalidadesDelProducto(productoId: string): Calidad[] {
    return data.calidades.filter(c => c.productoId === productoId)
  }

  async function addCalidad(productoId: string, nombre: string) {
    const dto = await api.post<Calidad>('/api/productos/calidades', { productoId, nombre })
    setData(prev => ({ ...prev, calidades: [...prev.calidades, dto] }))
  }

  async function updateCalidad(id: string, c: Partial<Pick<Calidad, 'nombre' | 'activo'>>) {
    const dto = await api.put<Calidad>(`/api/productos/calidades/${id}`, c)
    setData(prev => ({ ...prev, calidades: prev.calidades.map(x => x.id === id ? dto : x) }))
  }

  return (
    <DataContext.Provider value={{
      data, isLoading, resourceStates, reloadResource, refresh: loadAll,
      addCliente, updateCliente, deleteCliente,
      updateProductoPrecio, updateProducto, addProducto, reorderProductos,
      addPedido, updatePedido, updatePedidoCompleto,
      addVenta, updateVentaDatos, updateVentaCompleta,
      registrarPago, refrescarCobros,
      addVendedor, updateVendedor,
      addProveedor, updateProveedor, addCompromisoProveedor, updateCompromisoProveedor, pagarCuotaProveedor,
      crearFormaPagoProveedor, getFormaPagoVigente, getHistorialFormaPago,
      registrarCompra, subirAdjunto, getAdjuntos, getAdjuntoContenido, eliminarAdjunto,
      addGastoFijo, updateGastoFijo, deleteGastoFijo, generarInstanciasMensuales, pagarInstanciaGasto, updateInstanciaGasto,
      addMovimientoStock, updateMovimientoStock, deleteMovimientoStock,
      getStockActual, getStockTotal, addProductoProveedor, updateProductoProveedor, deleteProductoProveedor, getProveedoresDelProducto,
      updateStockMinimo, isStockBajo, addStockRealRegistrado, getStockRealPorProducto,
      getCalidadesDelProducto, addCalidad, updateCalidad,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be inside DataProvider')
  return ctx
}
