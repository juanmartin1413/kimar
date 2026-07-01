import { Rol } from '@/lib/types'

export function canManageData(rol?: Rol): boolean {
  return rol === 'admin' || rol === 'gestor'
}

export function canSeeReportes(rol?: Rol): boolean {
  return rol === 'admin'
}
