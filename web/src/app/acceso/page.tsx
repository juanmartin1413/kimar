'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function AccesoPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const rol = await login(email.trim(), password)
    if (rol) {
      const destino = rol === 'admin'
        ? '/interno/dashboard'
        : rol === 'gestor'
        ? '/interno/cuenta-corriente'
        : '/interno/pedidos'
      router.push(destino)
    } else {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.01_240)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 space-y-2">
          <div className="w-14 h-14 bg-[oklch(0.18_0.06_240)] rounded-2xl flex items-center justify-center mx-auto shadow-lg overflow-hidden">
            <img src="/logoCamaronTransp.png" alt="KIMAR" className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">KIMAR</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">Acceso al sistema interno</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[oklch(0.9_0.01_240)] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[oklch(0.3_0.06_240)]">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@kimar.com"
                className="w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[oklch(0.3_0.06_240)]">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.6_0.03_240)]"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-[oklch(0.5_0.04_240)]">
          <Link href="/" className="hover:text-[oklch(0.42_0.14_240)] transition-colors">
            ← Volver al sitio
          </Link>
        </p>
      </div>
    </div>
  )
}
