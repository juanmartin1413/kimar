'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, BookOpen, ShoppingCart, Package,
  CreditCard, Boxes, Truck, Wallet, BarChart3, Settings, ClipboardList,
  ChevronLeft, ChevronRight, Store,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: ('admin' | 'gestor' | 'vendedor')[]
}

const navItems: NavItem[] = [
  { href: '/interno/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/interno/clientes', label: 'Clientes', icon: Users },
  { href: '/interno/cuenta-corriente', label: 'Cuenta Corriente', icon: BookOpen, roles: ['admin', 'gestor'] },
  { href: '/interno/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/interno/ventas', label: 'Ventas', icon: Package, roles: ['admin', 'gestor'] },
  { href: '/interno/cobranzas', label: 'Cobranzas', icon: CreditCard, roles: ['admin', 'gestor'] },
  { href: '/interno/productos', label: 'Productos & Precios', icon: Store },
  { href: '/interno/vendedores', label: 'Vendedores', icon: ClipboardList, roles: ['admin', 'gestor'] },
  { href: '/interno/stock', label: 'Stock', icon: Boxes, roles: ['admin', 'gestor'] },
  { href: '/interno/proveedores', label: 'Proveedores', icon: Truck, roles: ['admin', 'gestor'] },
  { href: '/interno/gastos', label: 'Gastos Fijos', icon: Wallet, roles: ['admin', 'gestor'] },
  { href: '/interno/reportes', label: 'Reportes', icon: BarChart3, roles: ['admin'] },
  { href: '/interno/configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] },
]

export default function InternalSidebar() {
  const pathname = usePathname()
  const { usuario } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const rol = usuario?.rol

  const visibleItems = navItems.filter(item =>
    !item.roles || !rol || item.roles.includes(rol)
  )

  return (
    <aside className={cn(
      'bg-[oklch(0.18_0.06_240)] text-white flex flex-col transition-all duration-300 shrink-0',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-[oklch(0.28_0.06_240)]">
        <img src="/logoCamaronTransp.png" alt="KIMAR" className="w-7 h-7 shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg tracking-wide">KIMAR</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-[oklch(0.65_0.04_240)] hover:text-white p-1 rounded"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-0.5 px-2">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  )
}
