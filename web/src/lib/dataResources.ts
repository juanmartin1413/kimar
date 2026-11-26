import type { AppData, Rol } from './types'

export type Resource = keyof AppData
export type ResourceState = { status: 'pending' | 'loading' | 'loaded' | 'error'; loaded: boolean; error?: string }
export type ResourceStates = Partial<Record<Resource, ResourceState>>
const management: Rol[] = ['admin', 'gestor']
const commercial: Rol[] = [...management, 'vendedor']
const warehouse: Rol[] = [...management, 'deposito']
export const resourceRoles: Partial<Record<Resource, Rol[]>> = {
  clientes: commercial, productos: [...commercial, 'deposito'], vendedores: commercial, pedidos: commercial,
  ventas: commercial, cobranzas: commercial, usuarios: ['admin'], proveedores: warehouse,
  gastosFijos: management, instanciasGasto: management, movimientosStock: warehouse, stockPorProducto: warehouse,
  compromisosProveedor: management, formasPagoProveedor: management, compras: management, calidades: warehouse,
}
export function resourcesForRoute(path: string, rol?: Rol): Resource[] {
  const section = path.split('/')[2]
  const dependencies: Record<string, Resource[]> = {
    clientes: ['clientes', 'vendedores'], 'cuenta-corriente': ['clientes', 'vendedores', 'ventas'],
    ventas: ['ventas', 'clientes', 'vendedores', 'productos', 'cobranzas', 'calidades', 'stockPorProducto'],
    pedidos: ['pedidos', 'clientes', 'vendedores', 'productos', 'ventas', 'stockPorProducto'],
    cobranzas: ['cobranzas', 'clientes', 'ventas'], productos: ['productos', 'calidades'],
    proveedores: ['proveedores', 'compromisosProveedor', 'formasPagoProveedor'],
    compras: ['compras', 'proveedores', 'productos', 'formasPagoProveedor', 'calidades'],
    stock: ['productos', 'stockPorProducto', 'movimientosStock', 'proveedores', 'calidades'],
    gastos: ['gastosFijos', 'instanciasGasto'], vendedores: ['vendedores', 'usuarios'], configuracion: ['usuarios'],
    dashboard: ['ventas', 'clientes', 'productos', 'cobranzas', 'stockPorProducto', 'compromisosProveedor', 'instanciasGasto', 'vendedores'],
    reportes: ['ventas', 'clientes', 'productos', 'cobranzas', 'compras', 'instanciasGasto', 'vendedores'],
    facturacion: ['clientes'], trazabilidad: ['clientes'],
  }
  return (dependencies[section] || []).filter(key => rol && resourceRoles[key]?.includes(rol))
}
export function resourceView(keys: Resource[], states: ResourceStates) {
  const pending = keys.some(key => !states[key]?.loaded && states[key]?.status !== 'error')
  const failed = keys.filter(key => states[key]?.status === 'error')
  return { pending, failed, blocked: failed.some(key => !states[key]?.loaded),
    updating: keys.some(key => states[key]?.loaded && states[key]?.status === 'loading') }
}
