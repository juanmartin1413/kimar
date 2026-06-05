'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'

const rolLabels = { admin: 'Administrador', gestor: 'Gestor', vendedor: 'Vendedor' }

export default function InternalTopBar() {
  const { usuario, logout } = useAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/acceso')
  }

  return (
    <header className="h-14 bg-white border-b border-[oklch(0.9_0.01_240)] px-6 flex items-center justify-between shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-[oklch(0.25_0.06_240)]">{usuario?.nombre}</p>
          <p className="text-xs text-[oklch(0.55_0.04_240)]">{rolLabels[usuario?.rol ?? 'vendedor']}</p>
        </div>
        <div className="w-9 h-9 bg-[oklch(0.42_0.14_240)] rounded-full flex items-center justify-center">
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
