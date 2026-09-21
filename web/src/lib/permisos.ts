import { Rol } from '@/lib/types'

// Fuente única de verdad de permisos por rol. AuthContext expone estos mismos flags
// ya evaluados para el usuario logueado; las páginas deben consumirlos desde ahí.

export function canManageData(rol?: Rol): boolean {
  return rol === 'admin' || rol === 'gestor'
}

export function canSeeReportes(rol?: Rol): boolean {
  return rol === 'admin'
}

export function isDeposito(rol?: Rol): boolean {
  return rol === 'deposito'
}

export function isRepartidor(rol?: Rol): boolean {
  return rol === 'repartidor'
}

// Stock: el depósito ve todo (inventario, movimientos, auditoría) y puede registrar
// entradas de mercadería y el conteo físico; ajustes manuales y stock mínimo son de gestión.
export function canVerStock(rol?: Rol): boolean {
  return canManageData(rol) || isDeposito(rol)
}

export function canOperarStock(rol?: Rol): boolean {
  return canVerStock(rol)
}

export function canAjustarStock(rol?: Rol): boolean {
  return canManageData(rol)
}

// "Pedidos a preparar": ventas confirmadas por fecha de entrega, sin información comercial.
export function canVerPreparacion(rol?: Rol): boolean {
  return canManageData(rol) || isDeposito(rol)
}

// Marcar un pedido como "listo para entrega" y asignarle repartidor (desde "Pedidos a preparar").
export function canGestionarEntrega(rol?: Rol): boolean {
  return canManageData(rol) || isDeposito(rol)
}

// "Pedidos a entregar": el repartidor ve los suyos y los sin asignar; gestión supervisa todos.
export function canVerEntregas(rol?: Rol): boolean {
  return canManageData(rol) || isRepartidor(rol)
}

// Pantalla inicial tras el login (y destino cuando una ruta no permitida rebota).
export function homePorRol(rol?: Rol): string {
  switch (rol) {
    case 'admin': return '/interno/dashboard'
    case 'gestor': return '/interno/cuenta-corriente'
    case 'deposito': return '/interno/preparacion'
    case 'repartidor': return '/interno/entregas'
    default: return '/interno/pedidos'
  }
}

// Roles con navegación acotada por URL (allowlist). Los roles sin entrada no tienen guard de ruta.
export const RUTAS_PERMITIDAS_POR_ROL: Partial<Record<Rol, string[]>> = {
  deposito: ['/interno/preparacion', '/interno/stock'],
  repartidor: ['/interno/entregas'],
}

export function rutaPermitida(rol: Rol | undefined, pathname: string): boolean {
  const rutas = rol ? RUTAS_PERMITIDAS_POR_ROL[rol] : undefined
  return !rutas || rutas.some(r => pathname.startsWith(r))
}
