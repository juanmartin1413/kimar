'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Rol } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, BookOpen, ShoppingCart, Package,
  CreditCard, Boxes, Truck, Wallet, BarChart3, Settings, ClipboardList,
  Store, ReceiptText, PackageCheck, Bike,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: Rol[] // obligatorio: un item sin roles no se muestra a nadie (deny-by-default)
}

const navItems: NavItem[] = [
  { href: '/interno/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/interno/clientes', label: 'Clientes', icon: Users, roles: ['admin', 'gestor', 'vendedor'] },
  { href: '/interno/cuenta-corriente', label: 'Cuenta Corriente', icon: BookOpen, roles: ['admin', 'gestor'] },
  { href: '/interno/pedidos', label: 'Pedidos', icon: ShoppingCart, roles: ['admin', 'gestor', 'vendedor'] },
  { href: '/interno/ventas', label: 'Ventas', icon: Package, roles: ['admin', 'gestor'] },
  { href: '/interno/cobranzas', label: 'Cobranzas', icon: CreditCard, roles: ['admin', 'gestor'] },
  { href: '/interno/productos', label: 'Productos & Precios', icon: Store, roles: ['admin', 'gestor', 'vendedor'] },
  { href: '/interno/vendedores', label: 'Vendedores', icon: ClipboardList, roles: ['admin', 'gestor'] },
  { href: '/interno/stock', label: 'Stock', icon: Boxes, roles: ['admin', 'gestor', 'deposito'] },
  { href: '/interno/preparacion', label: 'Pedidos a preparar', icon: PackageCheck, roles: ['admin', 'gestor', 'deposito'] },
  { href: '/interno/entregas', label: 'Pedidos a entregar', icon: Bike, roles: ['admin', 'gestor', 'repartidor'] },
  { href: '/interno/proveedores', label: 'Proveedores', icon: Truck, roles: ['admin', 'gestor'] },
  { href: '/interno/compras', label: 'Compras', icon: ReceiptText, roles: ['admin', 'gestor'] },
  { href: '/interno/gastos', label: 'Gastos Fijos', icon: Wallet, roles: ['admin', 'gestor'] },
  { href: '/interno/reportes', label: 'Reportes', icon: BarChart3, roles: ['admin'] },
  { href: '/interno/configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] },
]

// Lista de navegación compartida por el sidebar de escritorio y el menú lateral (Sheet) en móvil.
export function SidebarNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { usuario } = useAuth()
  const rol = usuario?.rol

  const visibleItems = navItems.filter(item => !rol || item.roles.includes(rol))

  return (
    <nav className="flex-1 py-4 overflow-y-auto space-y-0.5 px-2">
      {visibleItems.map(item => {
        const Icon = item.icon
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-[oklch(0.42_0.14_240)] text-white'
                : 'text-[oklch(0.8_0.02_240)] hover:bg-[oklch(0.28_0.08_240)] hover:text-white'
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
