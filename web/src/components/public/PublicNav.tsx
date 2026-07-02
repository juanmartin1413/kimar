'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos' },
  { href: '/contacto', label: 'Contacto' },
]

export default function PublicNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { palette } = useTheme()
  const isKimar = palette === 'kimar'

  return (
    <header
      className="text-white sticky top-0 z-50 shadow-lg"
      style={{ backgroundColor: isKimar ? '#0F2B2E' : 'oklch(0.18 0.06 240)' }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-wide">
          <span>KIMAR</span>
          <span
            className="hidden sm:inline font-normal text-sm"
            style={{ color: isKimar ? '#C7A35A' : 'oklch(0.65 0.08 240)' }}
          >
            Mariscos Premium
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium transition-colors"
              style={{
                color: pathname === l.href
                  ? (isKimar ? '#C7A35A' : 'oklch(0.75 0.12 240)')
                  : (isKimar ? '#E6E8E5' : 'oklch(0.85 0.03 240)'),
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/acceso"
            className="ml-4 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            style={{ backgroundColor: isKimar ? '#C7A35A' : 'oklch(0.42 0.14 240)' }}
          >
            Acceso Interno
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t"
          style={{
            borderColor: isKimar ? '#6F8C87' : 'oklch(0.28 0.06 240)',
            backgroundColor: isKimar ? '#0F2B2E' : 'oklch(0.22 0.07 240)',
          }}
        >
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 text-sm"
              style={{ color: isKimar ? '#E6E8E5' : 'oklch(0.85 0.03 240)' }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/acceso"
            onClick={() => setOpen(false)}
            className="block px-6 py-3 text-sm font-medium"
            style={{ color: isKimar ? '#C7A35A' : 'oklch(0.75 0.12 240)' }}
          >
            Acceso Interno →
          </Link>
        </div>
      )}
    </header>
  )
}
