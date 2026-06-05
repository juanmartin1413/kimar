'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import InternalSidebar from '@/components/interno/InternalSidebar'
import InternalTopBar from '@/components/interno/InternalTopBar'

export default function InternoLayout({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!usuario) router.replace('/acceso')
  }, [usuario, router])

  if (!usuario) return null

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
