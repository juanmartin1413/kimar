'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Rol, Usuario } from '@/lib/types'
import { loadData } from '@/lib/storage'

const HARDCODED_PASSWORDS: Record<string, string> = {
  'admin@kimar.com': 'kimar123',
  'gestor@kimar.com': 'kimar123',
  'marcos@kimar.com': 'kimar123',
  'lucho@kimar.com': 'kimar123',
  'lucas@kimar.com': 'kimar123',
}

interface AuthContextValue {
  usuario: Usuario | null
  login: (email: string, password: string) => Rol | null
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
    const raw = sessionStorage.getItem('kimar_session')
    if (raw) {
      try { setUsuario(JSON.parse(raw)) } catch { /* ignore */ }
    }
  }, [])

  function login(email: string, password: string): Rol | null {
    const expectedPwd = HARDCODED_PASSWORDS[email.toLowerCase()]
    if (!expectedPwd || expectedPwd !== password) return null

    const data = loadData()
    const found = data.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.activo)
    if (!found) return null

    sessionStorage.setItem('kimar_session', JSON.stringify(found))
    setUsuario(found)
    return found.rol
  }

  function logout() {
    sessionStorage.removeItem('kimar_session')
    setUsuario(null)
  }

  const rol: Rol | undefined = usuario?.rol
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
