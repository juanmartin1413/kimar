'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, User } from 'lucide-react'
import { rolLabels } from '@/lib/roles'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/interno/SidebarNav'

export default function InternalTopBar() {
  const { usuario, logout } = useAuth()
  const router = useRouter()
  const [menuAbierto, setMenuAbierto] = useState(false)

  function handleLogout() {
    logout()
    router.push('/acceso')
  }

  return (
    <header className="h-14 bg-white border-b border-[oklch(0.9_0.01_240)] px-4 md:px-6 flex items-center justify-between shrink-0">
      {/* Menú lateral solo en móvil: el sidebar de escritorio está oculto por debajo de md */}
      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden -ml-2" aria-label="Abrir menú" />}
        >
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 p-0 gap-0 bg-[oklch(0.18_0.06_240)] text-white border-0 [&_[data-slot=sheet-close]]:text-white"
        >
          <SheetHeader className="h-16 flex-row items-center gap-2 px-4 border-b border-[oklch(0.28_0.06_240)]">
            <img src="/logoCamaronTransp.png" alt="KIMAR" className="w-7 h-7 shrink-0" />
            <SheetTitle className="font-bold text-lg tracking-wide text-white">KIMAR</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMenuAbierto(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-[oklch(0.25_0.06_240)] truncate max-w-[40vw] sm:max-w-none">{usuario?.nombre}</p>
          <p className="text-xs text-[oklch(0.55_0.04_240)]">{rolLabels[usuario?.rol ?? 'vendedor']}</p>
        </div>
        <div className="w-9 h-9 bg-[oklch(0.42_0.14_240)] rounded-full flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="p-2 rounded-lg text-[oklch(0.55_0.04_240)] hover:bg-[oklch(0.95_0.01_240)] hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
