'use client'

import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, User } from 'lucide-react'

const rolLabels = { admin: 'Administrador', gestor: 'Gestor', vendedor: 'Vendedor' }
const rolColors = {
  admin: 'bg-[oklch(0.92_0.04_240)] text-[oklch(0.35_0.10_240)]',
  gestor: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-orange-100 text-orange-700',
}

export default function ConfiguracionPage() {
  const { data } = useData()
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-24 space-y-4">
        <Shield className="w-12 h-12 text-[oklch(0.55_0.04_240)]" />
        <p className="text-[oklch(0.45_0.04_240)]">Acceso restringido a administradores.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Configuración</h1>
        <p className="text-sm text-[oklch(0.5_0.04_240)]">Usuarios del sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[oklch(0.93_0.01_240)]">
          <h2 className="font-bold text-[oklch(0.25_0.06_240)]">Usuarios</h2>
        </div>
        <div className="divide-y divide-[oklch(0.95_0.01_240)]">
          {data.usuarios.map(u => (
            <div key={u.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[oklch(0.42_0.14_240)] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[oklch(0.25_0.06_240)]">{u.nombre}</p>
                <p className="text-sm text-[oklch(0.5_0.04_240)]">{u.email}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${rolColors[u.rol]}`}>
                {rolLabels[u.rol]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[oklch(0.97_0.01_240)] border border-[oklch(0.9_0.01_240)] rounded-xl p-5">
        <h3 className="font-semibold text-[oklch(0.3_0.06_240)] mb-2">Credenciales del prototipo</h3>
        <div className="text-sm space-y-1 text-[oklch(0.45_0.04_240)] font-mono">
          <p>admin@kimar.com / kimar123</p>
          <p>gestor@kimar.com / kimar123</p>
          <p>marcos@kimar.com / kimar123</p>
          <p>lucho@kimar.com / kimar123</p>
          <p>lucas@kimar.com / kimar123</p>
        </div>
      </div>
    </div>
  )
}
