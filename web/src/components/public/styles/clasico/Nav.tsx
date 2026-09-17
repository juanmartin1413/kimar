'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { navLinks, brand } from '@/components/public/shared/content'

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-pub-deep text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-wide">
          <span>{brand.nombre}</span>
          <span className="hidden sm:inline font-normal text-sm text-pub-on-deep-muted">{brand.tagline}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${pathname === l.href ? 'text-pub-accent-on-dark' : 'text-pub-on-deep'}`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/acceso"
            className="ml-4 bg-pub-accent text-pub-accent-fg text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            Acceso Interno
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-pub-deep-line bg-pub-deep-2">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 text-sm text-pub-on-deep"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/acceso"
            onClick={() => setOpen(false)}
            className="block px-6 py-3 text-sm font-medium text-pub-accent-on-dark"
          >
            Acceso Interno →
          </Link>
        </div>
      )}
    </header>
  )
}
