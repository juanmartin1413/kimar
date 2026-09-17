'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { RUTAS_DEPOSITO } from '@/lib/permisos'
import InternalSidebar from '@/components/interno/InternalSidebar'
import InternalTopBar from '@/components/interno/InternalTopBar'

export default function InternoLayout({ children }: { children: React.ReactNode }) {
  const { usuario, isInitializing } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // El depósito solo navega dentro de sus pantallas; cualquier otra URL lo devuelve a "Pedidos a preparar".
  const fueraDeAlcance = usuario?.rol === 'deposito' && !RUTAS_DEPOSITO.some(r => pathname.startsWith(r))

  useEffect(() => {
    if (!isInitializing && !usuario) router.replace('/acceso')
    else if (fueraDeAlcance) router.replace('/interno/preparacion')
  }, [usuario, isInitializing, router, fueraDeAlcance])

  if (isInitializing || !usuario || fueraDeAlcance) return null

  return (
    <div className="flex h-screen bg-[oklch(0.97_0.01_240)]">
      <InternalSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <InternalTopBar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
