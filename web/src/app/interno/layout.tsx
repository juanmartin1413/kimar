'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { homePorRol, rutaPermitida } from '@/lib/permisos'
import InternalSidebar from '@/components/interno/InternalSidebar'
import InternalTopBar from '@/components/interno/InternalTopBar'

export default function InternoLayout({ children }: { children: React.ReactNode }) {
  const { usuario, isInitializing } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Depósito y repartidor solo navegan dentro de sus pantallas; cualquier otra URL los devuelve a su inicio.
  const fueraDeAlcance = !!usuario && !rutaPermitida(usuario.rol, pathname)

  useEffect(() => {
    if (!isInitializing && !usuario) router.replace('/acceso')
    else if (usuario && fueraDeAlcance) router.replace(homePorRol(usuario.rol))
  }, [usuario, isInitializing, router, fueraDeAlcance])

  if (isInitializing || !usuario || fueraDeAlcance) return null

  return (
    <div className="flex h-screen bg-[oklch(0.97_0.01_240)]">
      <InternalSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <InternalTopBar />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
