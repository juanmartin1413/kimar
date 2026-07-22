'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import {
  AppData, Calidad, Cliente, Cobranza, CompromisoProveedor,
  GastoFijo, InstanciaGasto, MovimientoStock, Pedido,
  Producto, ProductoProveedor, Proveedor, StockPorProducto, StockRealRegistrado,
  Vendedor, Venta,
} from '@/lib/types'
import { today } from '@/lib/format'
import { generateId } from '@/lib/storage'

const EMPTY: AppData = {
  usuarios: [], vendedores: [], clientes: [], productos: [], pedidos: [],
  ventas: [], cobranzas: [], proveedores: [], compromisosProveedor: [],
  productosProveedores: [], movimientosStock: [], stockPorProducto: [],
  stockRealRegistrado: [], gastosFijos: [], instanciasGasto: [], calidades: [],
}

interface DataContextValue {
  data: AppData
  isLoading: boolean
  refresh: () => void
  addCliente: (c: Omit<Cliente, 'id' | 'fechaCreacion' | 'activo'>) => void
  updateCliente: (id: string, c: Partial<Cliente>) => void
  deleteCliente: (id: string) => void
  updateProductoPrecio: (id: string, precio: number) => void
  updateProducto: (id: string, p: Partial<Omit<Producto, 'id'>>) => void
  addProducto: (p: Omit<Producto, 'id'>) => void
  addPedido: (p: Omit<Pedido, 'id' | 'fechaCreacion' | 'estado'>) => Promise<string>
  updatePedido: (id: string, p: Partial<Pedido>) => void
  addVenta: (v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas'>, cobranzas: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[]) => Promise<void>
  updateVentaCompleta: (id: string, v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas'>, cobranzas: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[]) => void
  addCobranza: (c: Omit<Cobranza, 'id' | 'fechaCreacion'>) => void
  updateCobranza: (id: string, c: Partial<Omit<Cobranza, 'id' | 'fechaCreacion'>>) => void
  cobrarCobranza: (id: string) => void
  addVendedor: (v: Omit<Vendedor, 'id'>) => void
  updateVendedor: (id: string, v: Partial<Vendedor>) => void
  addProveedor: (p: Omit<Proveedor, 'id' | 'fechaCreacion' | 'activo'>) => void
  updateProveedor: (id: string, p: Partial<Proveedor>) => void
  addCompromisoProveedor: (c: Omit<CompromisoProveedor, 'id' | 'fechaCreacion'>) => void
  updateCompromisoProveedor: (id: string, c: Partial<CompromisoProveedor>) => void
  pagarCuotaProveedor: (compromisoId: string, cuotaId: string) => void
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

function mapStock(raw: any[]): StockPorProducto[] {
  return raw.map(d => ({
    id: `${d.productoId}:${d.calidadId ?? 'base'}`,
    productoId: String(d.productoId),
    calidadId: d.calidadId ?? undefined,
    calidadNombre: d.calidadNombre ?? undefined,
    cantidad: d.cantidad,
    stockMinimo: d.stockMinimo,
    fechaActualizacion: d.fechaActualizacion
      ? String(d.fechaActualizacion).slice(0, 10)
      : today(),
  }))
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  const [data, setData] = useState<AppData>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [clientes, productos, vendedores, pedidos, ventas, cobranzas, proveedores, gastosFijos, movimientosStock] =
        await Promise.all([
          api.get<Cliente[]>('/api/clientes').catch(() => [] as Cliente[]),
          api.get<Producto[]>('/api/productos').catch(() => [] as Producto[]),
          api.get<Vendedor[]>('/api/vendedores').catch(() => [] as Vendedor[]),
          api.get<Pedido[]>('/api/pedidos').catch(() => [] as Pedido[]),
          api.get<Venta[]>('/api/ventas').catch(() => [] as Venta[]),
          api.get<Cobranza[]>('/api/cobranzas').catch(() => [] as Cobranza[]),
          api.get<Proveedor[]>('/api/proveedores').catch(() => [] as Proveedor[]),
          api.get<GastoFijo[]>('/api/gastos').catch(() => [] as GastoFijo[]),
          api.get<MovimientoStock[]>('/api/stock/movimientos').catch(() => [] as MovimientoStock[]),
        ])

      const [stockRaw, instanciasGasto] = await Promise.all([
        api.get<any[]>('/api/stock/actual').catch(() => [] as any[]),
        api.get<InstanciaGasto[]>('/api/gastos/instancias').catch(() => [] as InstanciaGasto[]),
      ])

      const [compromisosPorProv, calidadesPorProducto] = await Promise.all([
        Promise.all(
          proveedores.map(p =>
            api.get<CompromisoProveedor[]>(`/api/proveedores/${p.id}/compromisos`).catch(() => [] as CompromisoProveedor[])
          )
        ),
        Promise.all(
          productos.map(p =>
            api.get<Calidad[]>(`/api/productos/${p.id}/calidades`).catch(() => [] as Calidad[])
          )
        ),
      ])

      setData({
        usuarios: [],
        vendedores,
        clientes,
        productos,
        pedidos,
        ventas,
        cobranzas,
        proveedores,
        compromisosProveedor: compromisosPorProv.flat(),
        productosProveedores: [],
        movimientosStock,
        stockPorProducto: mapStock(stockRaw),
        stockRealRegistrado: [],
        gastosFijos,
        instanciasGasto,
        calidades: calidadesPorProducto.flat(),
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!usuario) {
      setData(EMPTY)
      setIsLoading(false)
      return
    }
    loadAll()
  }, [usuario?.id, loadAll])

  // ── refresh helpers ──────────────────────────────────────────────────────────
  async function rClientes() {
    const list = await api.get<Cliente[]>('/api/clientes').catch(() => null)
    if (list) setData(p => ({ ...p, clientes: list }))
  }

  async function rProductos() {
    const list = await api.get<Producto[]>('/api/productos').catch(() => null)
    if (list) setData(p => ({ ...p, productos: list }))
  }

  async function rVendedores() {
    const list = await api.get<Vendedor[]>('/api/vendedores').catch(() => null)
    if (list) setData(p => ({ ...p, vendedores: list }))
  }

  async function rPedidos() {
    const list = await api.get<Pedido[]>('/api/pedidos').catch(() => null)
    if (list) setData(p => ({ ...p, pedidos: list }))
  }

  async function rVentas() {
    const [ventas, cobranzas] = await Promise.all([
      api.get<Venta[]>('/api/ventas').catch(() => null),
      api.get<Cobranza[]>('/api/cobranzas').catch(() => null),
    ])
    setData(p => ({
      ...p,
      ...(ventas ? { ventas } : {}),
      ...(cobranzas ? { cobranzas } : {}),
    }))
  }

  async function rCobranzas() {
    const list = await api.get<Cobranza[]>('/api/cobranzas').catch(() => null)
    if (list) setData(p => ({ ...p, cobranzas: list }))
  }

  async function rStock() {
    const raw = await api.get<any[]>('/api/stock/actual').catch(() => null)
    if (raw) setData(p => ({ ...p, stockPorProducto: mapStock(raw) }))
  }

  async function rMovimientos() {
    const list = await api.get<MovimientoStock[]>('/api/stock/movimientos').catch(() => null)
    if (list) setData(p => ({ ...p, movimientosStock: list }))
  }

  async function rProveedoresYCompromisos() {
    const provs = await api.get<Proveedor[]>('/api/proveedores').catch(() => null)
    if (!provs) return
    const compromisosPorProv = await Promise.all(
      provs.map(p =>
        api.get<CompromisoProveedor[]>(`/api/proveedores/${p.id}/compromisos`).catch(() => [] as CompromisoProveedor[])
      )
    )
    setData(p => ({ ...p, proveedores: provs, compromisosProveedor: compromisosPorProv.flat() }))
  }

  async function rGastos() {
    const [gastosFijos, instanciasGasto] = await Promise.all([
      api.get<GastoFijo[]>('/api/gastos').catch(() => null),
      api.get<InstanciaGasto[]>('/api/gastos/instancias').catch(() => null),
    ])
    setData(p => ({
      ...p,
      ...(gastosFijos ? { gastosFijos } : {}),
      ...(instanciasGasto ? { instanciasGasto } : {}),
    }))
  }

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

  async function addProducto(p: Omit<Producto, 'id'>) {
    await api.post('/api/productos', p)
    await rProductos()
  }

  // ── Pedidos ──────────────────────────────────────────────────────────────────
  async function addPedido(p: Omit<Pedido, 'id' | 'fechaCreacion' | 'estado'>): Promise<string> {
    const res = await api.post<{ id: string }>('/api/pedidos', {
      clienteId: p.clienteId,
      vendedorId: p.vendedorId,
      fecha: p.fecha,
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

  async function updatePedido(id: string, p: Partial<Pedido>) {
    await api.put(`/api/pedidos/${id}`, { estado: p.estado, observaciones: p.observaciones ?? null })
    await rPedidos()
  }

  // ── Ventas ───────────────────────────────────────────────────────────────────
  async function addVenta(
    v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas'>,
    cobranzasInput: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[]
  ): Promise<void> {
    await api.post('/api/ventas', {
      pedidoId: v.pedidoId ?? null,
      clienteId: v.clienteId,
      vendedorId: v.vendedorId,
      fechaEntrega: v.fechaEntrega,
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
      cobranzas: cobranzasInput.map(c => ({
        fecha: c.fecha,
        monto: c.monto,
        formaPago: c.formaPago,
        estado: c.estado,
        observaciones: c.observaciones ?? null,
      })),
    })
    await Promise.all([rVentas(), rStock(), rPedidos()])
  }

  async function updateVentaCompleta(
    id: string,
    v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas'>,
    _cobranzas: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[]
  ) {
    await api.put(`/api/ventas/${id}`, {
      nroRemito: v.nroRemito ?? null,
      nroFactura: v.nroFactura ?? null,
      observaciones: v.observaciones ?? null,
    })
    await rVentas()
  }

  // ── Cobranzas ────────────────────────────────────────────────────────────────
  async function addCobranza(c: Omit<Cobranza, 'id' | 'fechaCreacion'>) {
    await api.post(`/api/cobranzas?clienteId=${c.clienteId}${c.ventaId ? `&ventaId=${c.ventaId}` : ''}`, {
      fecha: c.fecha,
      monto: c.monto,
      formaPago: c.formaPago,
      estado: c.estado,
      observaciones: c.observaciones ?? null,
    })
    await Promise.all([rCobranzas(), rVentas()])
  }

  async function updateCobranza(id: string, changes: Partial<Omit<Cobranza, 'id' | 'fechaCreacion'>>) {
    await api.put(`/api/cobranzas/${id}`, {
      fecha: changes.fecha,
      monto: changes.monto,
      formaPago: changes.formaPago,
      estado: changes.estado,
      observaciones: changes.observaciones ?? null,
    })
    await Promise.all([rCobranzas(), rVentas()])
  }

  async function cobrarCobranza(id: string) {
    await api.post(`/api/cobranzas/${id}/cobrar`)
    await Promise.all([rCobranzas(), rVentas()])
  }

  // ── Vendedores ───────────────────────────────────────────────────────────────
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

  async function pagarCuotaProveedor(compromisoId: string, cuotaId: string) {
    await api.post(`/api/proveedores/cuotas/${cuotaId}/pagar`)
    const compromiso = data.compromisosProveedor.find(c => c.id === compromisoId)
    if (compromiso) {
      const refreshed = await api.get<CompromisoProveedor[]>(
        `/api/proveedores/${compromiso.proveedorId}/compromisos`
      ).catch(() => null)
      if (refreshed) {
        setData(prev => ({
          ...prev,
          compromisosProveedor: [
            ...prev.compromisosProveedor.filter(c => c.proveedorId !== compromiso.proveedorId),
            ...refreshed,
          ],
        }))
      }
    }
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
    const list = await api.get<InstanciaGasto[]>('/api/gastos/instancias').catch(() => null)
    if (list) setData(p => ({ ...p, instanciasGasto: list }))
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
      data, isLoading, refresh: loadAll,
      addCliente, updateCliente, deleteCliente,
      updateProductoPrecio, updateProducto, addProducto,
      addPedido, updatePedido,
      addVenta, updateVentaCompleta,
      addCobranza, updateCobranza, cobrarCobranza,
      addVendedor, updateVendedor,
      addProveedor, updateProveedor, addCompromisoProveedor, updateCompromisoProveedor, pagarCuotaProveedor,
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
