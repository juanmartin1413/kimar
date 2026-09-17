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

// Pantalla inicial tras el login (y destino cuando /interno/dashboard rebota a un no-admin).
export function homePorRol(rol?: Rol): string {
  switch (rol) {
    case 'admin': return '/interno/dashboard'
    case 'gestor': return '/interno/cuenta-corriente'
    case 'deposito': return '/interno/preparacion'
    default: return '/interno/pedidos'
  }
}

// Único rol con navegación acotada por URL: el resto de los roles conserva el comportamiento previo.
export const RUTAS_DEPOSITO = ['/interno/preparacion', '/interno/stock']
