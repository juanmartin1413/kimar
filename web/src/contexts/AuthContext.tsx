'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Rol, Usuario } from '@/lib/types'
import { api } from '@/lib/api'

interface LoginApiResponse {
  token: string
  id: string
  nombre: string
  email: string
  rol: string
}

interface AuthContextValue {
  usuario: Usuario | null
  login: (email: string, password: string) => Promise<Rol | null>
  logout: () => void
  isAdmin: boolean
  isGestor: boolean
  isVendedor: boolean
  canSeeReportes: boolean
  canManageData: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('kimar_user')
    if (raw) {
      try { setUsuario(JSON.parse(raw)) } catch { /* ignore */ }
    }
  }, [])

  async function login(email: string, password: string): Promise<Rol | null> {
    try {
      const res = await api.post<LoginApiResponse>('/auth/login', { email, password })
      const user: Usuario = {
        id: res.id,
        nombre: res.nombre,
        email: res.email,
        rol: res.rol as Rol,
        activo: true,
        fechaCreacion: '',
      }
      localStorage.setItem('kimar_token', res.token)
      localStorage.setItem('kimar_user', JSON.stringify(user))
      setUsuario(user)
      return user.rol
    } catch {
      return null
    }
  }

  function logout() {
    localStorage.removeItem('kimar_token')
    localStorage.removeItem('kimar_user')
    setUsuario(null)
  }

  const rol = usuario?.rol
  const isAdmin = rol === 'admin'
  const isGestor = rol === 'gestor'
  const isVendedor = rol === 'vendedor'
  const canSeeReportes = isAdmin
  const canManageData = isAdmin || isGestor

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAdmin, isGestor, isVendedor, canSeeReportes, canManageData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
