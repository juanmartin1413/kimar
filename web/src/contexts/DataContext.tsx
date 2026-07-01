'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { AppData, Cliente, Cobranza, CompromisoProveedor, EstadoVenta, GastoFijo, InstanciaGasto, Pedido, Producto, Proveedor, Vendedor, Venta, MovimientoStock, ProductoProveedor, StockPorProducto, StockRealRegistrado } from '@/lib/types'
import { loadData, saveData, generateId } from '@/lib/storage'
import { today } from '@/lib/format'

interface DataContextValue {
  data: AppData
  refresh: () => void
  // Clientes
  addCliente: (c: Omit<Cliente, 'id' | 'fechaCreacion' | 'activo'>) => void
  updateCliente: (id: string, c: Partial<Cliente>) => void
  deleteCliente: (id: string) => void
  // Productos
  updateProductoPrecio: (id: string, precio: number) => void
  updateProducto: (id: string, p: Partial<Omit<Producto, 'id'>>) => void
  addProducto: (p: Omit<Producto, 'id'>) => void
  // Pedidos
  addPedido: (p: Omit<Pedido, 'id' | 'fechaCreacion' | 'estado'>) => string
  updatePedido: (id: string, p: Partial<Pedido>) => void
  // Ventas
  addVenta: (v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas'>, cobranzas: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[]) => void
  updateVentaCompleta: (id: string, v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas'>, cobranzas: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[]) => void
  // Cobranzas
  addCobranza: (c: Omit<Cobranza, 'id' | 'fechaCreacion'>) => void
  updateCobranza: (id: string, c: Partial<Omit<Cobranza, 'id' | 'fechaCreacion'>>) => void
  cobrarCobranza: (id: string) => void
  // Vendedores
  addVendedor: (v: Omit<Vendedor, 'id'>) => void
  updateVendedor: (id: string, v: Partial<Vendedor>) => void
  // Proveedores
  addProveedor: (p: Omit<Proveedor, 'id' | 'fechaCreacion' | 'activo'>) => void
  updateProveedor: (id: string, p: Partial<Proveedor>) => void
  addCompromisoProveedor: (c: Omit<CompromisoProveedor, 'id' | 'fechaCreacion'>) => void
  updateCompromisoProveedor: (id: string, c: Partial<CompromisoProveedor>) => void
  pagarCuotaProveedor: (compromisoId: string, cuotaId: string) => void
  // Gastos
  addGastoFijo: (g: Omit<GastoFijo, 'id' | 'fechaCreacion' | 'activo'>) => void
  updateGastoFijo: (id: string, g: Partial<GastoFijo>) => void
  deleteGastoFijo: (id: string) => void
  generarInstanciasMensuales: (mes: number, anio: number) => void
  pagarInstanciaGasto: (id: string) => void
  updateInstanciaGasto: (id: string, g: Partial<InstanciaGasto>) => void
  // Stock
  addMovimientoStock: (m: Omit<any, 'id' | 'fechaCreacion'>) => void
  updateMovimientoStock: (id: string, m: Partial<any>) => void
  deleteMovimientoStock: (id: string) => void
  getStockActual: (productoId: string) => number
  addProductoProveedor: (pp: Omit<any, 'id'>) => void
  updateProductoProveedor: (id: string, pp: Partial<any>) => void
  deleteProductoProveedor: (id: string) => void
  getProveedoresDelProducto: (productoId: string) => any[]
  updateStockMinimo: (productoId: string, minimo: number) => void
  isStockBajo: (productoId: string) => boolean
  addStockRealRegistrado: (srr: Omit<any, 'id'>) => void
  getStockRealPorProducto: (productoId: string) => any | null
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  const refresh = useCallback(() => setData(loadData()), [])

  function update(updater: (d: AppData) => AppData) {
    setData(prev => {
      const next = updater(prev)
      saveData(next)
      return next
    })
  }

  // Auto-generate monthly instances on load
  const autoGenerate = useCallback(() => {
    const now = new Date()
    const mes = now.getMonth() + 1
    const anio = now.getFullYear()
    setData(prev => {
      const mensuales = prev.gastosFijos.filter(g => g.tipo === 'mensual' && g.activo)
      const nuevas: InstanciaGasto[] = []
      for (const gasto of mensuales) {
        const exists = prev.instanciasGasto.some(i => i.gastoFijoId === gasto.id && i.mes === mes && i.anio === anio)
        if (!exists) {
          const fechaVenc = gasto.diaPago ? `${anio}-${String(mes).padStart(2, '0')}-${String(gasto.diaPago).padStart(2, '0')}` : undefined
          nuevas.push({ id: generateId(), gastoFijoId: gasto.id, mes, anio, monto: gasto.monto, fechaVencimiento: fechaVenc, pagado: false, fechaCreacion: today() })
        }
      }
      if (nuevas.length === 0) return prev
      const next = { ...prev, instanciasGasto: [...prev.instanciasGasto, ...nuevas] }
      saveData(next)
      return next
    })
  }, [])

  // Run auto-generation once on mount
  useState(() => { autoGenerate() })

  // --- Clientes ---
  function addCliente(c: Omit<Cliente, 'id' | 'fechaCreacion' | 'activo'>) {
    update(d => ({ ...d, clientes: [...d.clientes, { ...c, id: generateId(), activo: true, fechaCreacion: today() }] }))
  }
  function updateCliente(id: string, c: Partial<Cliente>) {
    update(d => ({ ...d, clientes: d.clientes.map(x => x.id === id ? { ...x, ...c } : x) }))
  }
  function deleteCliente(id: string) {
    update(d => ({ ...d, clientes: d.clientes.map(x => x.id === id ? { ...x, activo: false } : x) }))
  }

  // --- Productos ---
  function updateProductoPrecio(id: string, precio: number) {
    update(d => ({ ...d, productos: d.productos.map(x => x.id === id ? { ...x, precioKg: precio } : x) }))
  }
  function updateProducto(id: string, p: Partial<Omit<Producto, 'id'>>) {
    update(d => ({ ...d, productos: d.productos.map(x => x.id === id ? { ...x, ...p } : x) }))
  }
  function addProducto(p: Omit<Producto, 'id'>) {
    update(d => ({ ...d, productos: [...d.productos, { ...p, id: generateId() }] }))
  }

  // --- Pedidos ---
  function addPedido(p: Omit<Pedido, 'id' | 'fechaCreacion' | 'estado'>): string {
    const id = generateId()
    update(d => ({ ...d, pedidos: [...d.pedidos, { ...p, id, estado: 'pendiente', fechaCreacion: today() }] }))
    return id
  }
  function updatePedido(id: string, p: Partial<Pedido>) {
    update(d => ({ ...d, pedidos: d.pedidos.map(x => x.id === id ? { ...x, ...p } : x) }))
  }

  // --- Ventas ---
  function addVenta(v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas'>, cobranzasInput: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[]) {
    const ventaId = generateId()
    const cobranzas: Cobranza[] = cobranzasInput.map(c => ({
      ...c, id: generateId(), ventaId, clienteId: v.clienteId, fechaCreacion: today()
    }))
    const totalCobrado = cobranzas.filter(c => c.estado === 'cobrado').reduce((s, c) => s + c.monto, 0)
    const estado: EstadoVenta = totalCobrado >= v.total ? 'pagado' : totalCobrado > 0 ? 'cobrado_parcial' : 'debe'
    const venta: Venta = { ...v, id: ventaId, estado, cobranzas, fechaCreacion: today() }

    if (v.pedidoId) {
      update(d => ({
        ...d,
        ventas: [...d.ventas, venta],
        cobranzas: [...d.cobranzas, ...cobranzas],
        pedidos: d.pedidos.map(p => p.id === v.pedidoId ? { ...p, estado: 'confirmado' } : p),
      }))
    } else {
      update(d => ({
        ...d,
        ventas: [...d.ventas, venta],
        cobranzas: [...d.cobranzas, ...cobranzas],
      }))
    }
  }

  function updateVentaCompleta(id: string, v: Omit<Venta, 'id' | 'fechaCreacion' | 'estado' | 'cobranzas'>, cobranzasInput: Omit<Cobranza, 'id' | 'fechaCreacion' | 'clienteId' | 'ventaId'>[]) {
    update(d => {
      // Keep existing cobradas, replace/add pendientes
      const existingCobs = d.cobranzas.filter(c => c.ventaId === id && c.estado === 'cobrado')
      const newCobs: Cobranza[] = cobranzasInput.map(c => ({
        ...c, id: generateId(), ventaId: id, clienteId: v.clienteId, fechaCreacion: today()
      }))
      const allCobsForVenta = [...existingCobs, ...newCobs]
      const totalCobrado = allCobsForVenta.filter(c => c.estado === 'cobrado').reduce((s, c) => s + c.monto, 0)
      const estado: EstadoVenta = totalCobrado >= v.total ? 'pagado' : totalCobrado > 0 ? 'cobrado_parcial' : 'debe'

      const updatedVenta: Venta = {
        ...v,
        id,
        estado,
        cobranzas: allCobsForVenta,
        fechaCreacion: d.ventas.find(x => x.id === id)?.fechaCreacion ?? today(),
      }

      // Remove old pendiente cobranzas for this venta, keep cobradas + add new
      const otherCobs = d.cobranzas.filter(c => c.ventaId !== id)
      return {
        ...d,
        ventas: d.ventas.map(x => x.id === id ? updatedVenta : x),
        cobranzas: [...otherCobs, ...allCobsForVenta],
      }
    })
  }

  // --- Cobranzas ---
  function addCobranza(c: Omit<Cobranza, 'id' | 'fechaCreacion'>) {
    const newCob: Cobranza = { ...c, id: generateId(), fechaCreacion: today() }
    update(d => {
      const cobranzas = [...d.cobranzas, newCob]
      const ventas = recalcVentas(d.ventas, cobranzas)
      return { ...d, cobranzas, ventas }
    })
  }
  function updateCobranza(id: string, changes: Partial<Omit<Cobranza, 'id' | 'fechaCreacion'>>) {
    update(d => {
      const cobranzas = d.cobranzas.map(c => c.id === id ? { ...c, ...changes } : c)
      const ventas = recalcVentas(d.ventas, cobranzas)
      return { ...d, cobranzas, ventas }
    })
  }
  function cobrarCobranza(id: string) {
    update(d => {
      const cobranzas = d.cobranzas.map(c => c.id === id ? { ...c, estado: 'cobrado' as const } : c)
      const ventas = recalcVentas(d.ventas, cobranzas)
      return { ...d, cobranzas, ventas }
    })
  }

  function recalcVentas(ventas: Venta[], cobranzas: Cobranza[]): Venta[] {
    return ventas.map(v => {
      const cobsDeVenta = cobranzas.filter(c => c.ventaId === v.id)
      const cobradas = cobsDeVenta.filter(c => c.estado === 'cobrado').reduce((s, c) => s + c.monto, 0)
      const estado: EstadoVenta = cobradas >= v.total ? 'pagado' : cobradas > 0 ? 'cobrado_parcial' : 'debe'
      return { ...v, cobranzas: cobsDeVenta, estado }
    })
  }

  // --- Vendedores ---
  function addVendedor(v: Omit<Vendedor, 'id'>) {
    update(d => ({ ...d, vendedores: [...d.vendedores, { ...v, id: generateId() }] }))
  }
  function updateVendedor(id: string, v: Partial<Vendedor>) {
    update(d => ({ ...d, vendedores: d.vendedores.map(x => x.id === id ? { ...x, ...v } : x) }))
  }

  // --- Proveedores ---
  function addProveedor(p: Omit<Proveedor, 'id' | 'fechaCreacion' | 'activo'>) {
    update(d => ({ ...d, proveedores: [...d.proveedores, { ...p, id: generateId(), activo: true, fechaCreacion: today() }] }))
  }
  function updateProveedor(id: string, p: Partial<Proveedor>) {
    update(d => ({ ...d, proveedores: d.proveedores.map(x => x.id === id ? { ...x, ...p } : x) }))
  }
  function addCompromisoProveedor(c: Omit<CompromisoProveedor, 'id' | 'fechaCreacion'>) {
    const compromiso: CompromisoProveedor = { ...c, id: generateId(), fechaCreacion: today() }
    update(d => ({ ...d, compromisosProveedor: [...d.compromisosProveedor, compromiso] }))
  }
  function updateCompromisoProveedor(id: string, c: Partial<CompromisoProveedor>) {
    update(d => ({ ...d, compromisosProveedor: d.compromisosProveedor.map(x => x.id === id ? { ...x, ...c } : x) }))
  }
  function pagarCuotaProveedor(compromisoId: string, cuotaId: string) {
    update(d => ({
      ...d,
      compromisosProveedor: d.compromisosProveedor.map(comp =>
        comp.id === compromisoId
          ? { ...comp, cuotas: comp.cuotas.map(cu => cu.id === cuotaId ? { ...cu, estado: 'pagado' as const, fechaPago: today() } : cu) }
          : comp
      )
    }))
  }

  // --- Gastos Fijos ---
  function addGastoFijo(g: Omit<GastoFijo, 'id' | 'fechaCreacion' | 'activo'>) {
    const gasto: GastoFijo = { ...g, id: generateId(), activo: true, fechaCreacion: today() }
    update(d => {
      const gastosFijos = [...d.gastosFijos, gasto]
      const now = new Date()
      const mes = now.getMonth() + 1
      const anio = now.getFullYear()
      const fechaVenc = g.diaPago ? `${anio}-${String(mes).padStart(2, '0')}-${String(g.diaPago).padStart(2, '0')}` : undefined
      const instancia: InstanciaGasto = {
        id: generateId(), gastoFijoId: gasto.id,
        mes, anio, monto: g.monto, fechaVencimiento: fechaVenc, pagado: false, fechaCreacion: today()
      }
      return { ...d, gastosFijos, instanciasGasto: [...d.instanciasGasto, instancia] }
    })
  }
  function updateGastoFijo(id: string, g: Partial<GastoFijo>) {
    update(d => ({ ...d, gastosFijos: d.gastosFijos.map(x => x.id === id ? { ...x, ...g } : x) }))
  }
  function deleteGastoFijo(id: string) {
    update(d => ({ ...d, gastosFijos: d.gastosFijos.map(x => x.id === id ? { ...x, activo: false } : x) }))
  }
  function generarInstanciasMensuales(mes: number, anio: number) {
    update(d => {
      const mensuales = d.gastosFijos.filter(g => g.tipo === 'mensual' && g.activo)
      const nuevas: InstanciaGasto[] = []
      for (const gasto of mensuales) {
        const exists = d.instanciasGasto.some(i => i.gastoFijoId === gasto.id && i.mes === mes && i.anio === anio)
        if (!exists) {
          const fechaVenc = gasto.diaPago ? `${anio}-${String(mes).padStart(2, '0')}-${String(gasto.diaPago).padStart(2, '0')}` : undefined
          nuevas.push({ id: generateId(), gastoFijoId: gasto.id, mes, anio, monto: gasto.monto, fechaVencimiento: fechaVenc, pagado: false, fechaCreacion: today() })
        }
      }
      if (nuevas.length === 0) return d
      return { ...d, instanciasGasto: [...d.instanciasGasto, ...nuevas] }
    })
  }
  function pagarInstanciaGasto(id: string) {
    update(d => ({ ...d, instanciasGasto: d.instanciasGasto.map(x => x.id === id ? { ...x, pagado: true, fechaPago: today() } : x) }))
  }
  function updateInstanciaGasto(id: string, g: Partial<InstanciaGasto>) {
    update(d => ({ ...d, instanciasGasto: d.instanciasGasto.map(x => x.id === id ? { ...x, ...g } : x) }))
  }

  // --- Stock ---
  function addMovimientoStock(m: Omit<MovimientoStock, 'id' | 'fechaCreacion'>) {
    const movimiento: MovimientoStock = { ...m, id: generateId(), fechaCreacion: today() }
    update(d => {
      // Crear o actualizar StockPorProducto
      let stockPorProducto = [...d.stockPorProducto]
      const stock = stockPorProducto.find(s => s.productoId === m.productoId)
      if (!stock) {
        stockPorProducto.push({
          id: generateId(),
          productoId: m.productoId,
          cantidad: m.tipo === 'entrada' ? m.cantidad : -m.cantidad,
          stockMinimo: 0,
          fechaActualizacion: today()
        })
      } else {
        stockPorProducto = stockPorProducto.map(s =>
          s.productoId === m.productoId
            ? { ...s, cantidad: s.cantidad + (m.tipo === 'entrada' ? m.cantidad : -m.cantidad), fechaActualizacion: today() }
            : s
        )
      }
      return { ...d, movimientosStock: [...d.movimientosStock, movimiento], stockPorProducto }
    })
  }

  function updateMovimientoStock(id: string, m: Partial<MovimientoStock>) {
    update(d => {
      const movimiento = d.movimientosStock.find(x => x.id === id)
      if (!movimiento) return d
      const cantidadAnterior = movimiento.tipo === 'entrada' ? movimiento.cantidad : -movimiento.cantidad
      const cantidadNueva = (m.tipo || movimiento.tipo) === 'entrada' ? (m.cantidad ?? movimiento.cantidad) : -(m.cantidad ?? movimiento.cantidad)
      const diferencia = cantidadNueva - cantidadAnterior
      
      let stockPorProducto = [...d.stockPorProducto]
      const stock = stockPorProducto.find(s => s.productoId === movimiento.productoId)
      if (stock) {
        stockPorProducto = stockPorProducto.map(s =>
          s.productoId === movimiento.productoId
            ? { ...s, cantidad: s.cantidad + diferencia, fechaActualizacion: today() }
            : s
        )
      }
      
      return {
        ...d,
        movimientosStock: d.movimientosStock.map(x => x.id === id ? { ...x, ...m } : x),
        stockPorProducto
      }
    })
  }

  function deleteMovimientoStock(id: string) {
    update(d => {
      const movimiento = d.movimientosStock.find(x => x.id === id)
      if (!movimiento) return d
      const cantidad = movimiento.tipo === 'entrada' ? movimiento.cantidad : -movimiento.cantidad
      
      let stockPorProducto = [...d.stockPorProducto]
      stockPorProducto = stockPorProducto.map(s =>
        s.productoId === movimiento.productoId
          ? { ...s, cantidad: s.cantidad - cantidad, fechaActualizacion: today() }
          : s
      )
      
      return {
        ...d,
        movimientosStock: d.movimientosStock.filter(x => x.id !== id),
        stockPorProducto
      }
    })
  }

  function getStockActual(productoId: string): number {
    const stock = data.stockPorProducto.find(s => s.productoId === productoId)
    return stock ? stock.cantidad : 0
  }

  function addProductoProveedor(pp: Omit<ProductoProveedor, 'id'>) {
    update(d => ({
      ...d,
      productosProveedores: [...d.productosProveedores, { ...pp, id: generateId() }]
    }))
  }

  function updateProductoProveedor(id: string, pp: Partial<ProductoProveedor>) {
    update(d => ({
      ...d,
      productosProveedores: d.productosProveedores.map(x => x.id === id ? { ...x, ...pp } : x)
    }))
  }

  function deleteProductoProveedor(id: string) {
    update(d => ({
      ...d,
      productosProveedores: d.productosProveedores.filter(x => x.id !== id)
    }))
  }

  function getProveedoresDelProducto(productoId: string): ProductoProveedor[] {
    return data.productosProveedores.filter(pp => pp.productoId === productoId && pp.activo)
  }

  function updateStockMinimo(productoId: string, minimo: number) {
    update(d => {
      let stockPorProducto = [...d.stockPorProducto]
      const stock = stockPorProducto.find(s => s.productoId === productoId)
      if (stock) {
        stockPorProducto = stockPorProducto.map(s =>
          s.productoId === productoId
            ? { ...s, stockMinimo: minimo }
            : s
        )
      } else {
        stockPorProducto.push({
          id: generateId(),
          productoId,
          cantidad: 0,
          stockMinimo: minimo,
          fechaActualizacion: today()
        })
      }
      return { ...d, stockPorProducto }
    })
  }

  function isStockBajo(productoId: string): boolean {
    const stock = data.stockPorProducto.find(s => s.productoId === productoId)
    return stock ? stock.cantidad < stock.stockMinimo : false
  }

  function addStockRealRegistrado(srr: Omit<StockRealRegistrado, 'id'>) {
    update(d => ({
      ...d,
      stockRealRegistrado: [...d.stockRealRegistrado, { ...srr, id: generateId() }]
    }))
  }

  function getStockRealPorProducto(productoId: string): StockRealRegistrado | null {
    // Retorna el registro más reciente
    const registros = data.stockRealRegistrado.filter(sr => sr.productoId === productoId)
    return registros.length > 0 ? registros[registros.length - 1] : null
  }

  return (
    <DataContext.Provider value={{
      data, refresh,
      addCliente, updateCliente, deleteCliente,
      updateProductoPrecio, updateProducto, addProducto,
      addPedido, updatePedido,
      addVenta, updateVentaCompleta,
      addCobranza, updateCobranza, cobrarCobranza,
      addVendedor, updateVendedor,
      addProveedor, updateProveedor, addCompromisoProveedor, updateCompromisoProveedor, pagarCuotaProveedor,
      addGastoFijo, updateGastoFijo, deleteGastoFijo, generarInstanciasMensuales, pagarInstanciaGasto, updateInstanciaGasto,
      addMovimientoStock, updateMovimientoStock, deleteMovimientoStock,
      getStockActual, addProductoProveedor, updateProductoProveedor, deleteProductoProveedor, getProveedoresDelProducto,
      updateStockMinimo, isStockBajo, addStockRealRegistrado, getStockRealPorProducto,
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
