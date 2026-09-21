import { Rol } from '@/lib/types'

// Etiquetas y colores de rol, en un solo lugar (antes estaban duplicados en Configuración y en la barra superior).
// Record<Rol, …> obliga a completar cada rol nuevo en tiempo de compilación.
export const rolLabels: Record<Rol, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  vendedor: 'Vendedor',
  deposito: 'Depósito',
  repartidor: 'Repartidor',
}

export const rolColors: Record<Rol, string> = {
  admin: 'bg-[oklch(0.92_0.04_240)] text-[oklch(0.35_0.10_240)]',
  gestor: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-orange-100 text-orange-700',
  deposito: 'bg-teal-100 text-teal-700',
  repartidor: 'bg-lime-100 text-lime-700',
}
