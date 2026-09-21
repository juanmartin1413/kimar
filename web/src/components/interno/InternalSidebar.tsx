'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { SidebarNav } from '@/components/interno/SidebarNav'

// Sidebar de escritorio. En pantallas chicas se oculta y la navegación pasa al menú lateral
// que abre el botón hamburguesa de InternalTopBar (misma SidebarNav).
export default function InternalSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      'hidden md:flex bg-[oklch(0.18_0.06_240)] text-white flex-col transition-all duration-300 shrink-0',
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

      <SidebarNav collapsed={collapsed} />
    </aside>
  )
}
