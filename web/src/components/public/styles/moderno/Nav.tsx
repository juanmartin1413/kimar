'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { brand, navLinks } from '@/components/public/shared/content'

/**
 * Nav "Moderno": píldora de vidrio flotante. El <header> ocupa alto de flujo
 * (pt-4 + h-14 = 4.5rem) así las páginas no necesitan padding superior; el hero
 * lo compensa con -mt-[4.5rem] para quedar debajo.
 */
export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 pointer-events-none">
      <div className="relative max-w-5xl mx-auto pointer-events-auto">
        <div className="h-14 rounded-full bg-pub-deep/80 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-between pl-4 pr-2">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logoCamaronTransp.png" alt="" className="h-7 w-auto" />
            <span className="font-pub-display font-extrabold tracking-tight text-white text-lg">{brand.nombre}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive(l.href) ? 'bg-white/10 text-white' : 'text-pub-on-deep hover:text-white hover:bg-white/5'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/acceso"
              className="hidden sm:inline-flex items-center gap-1.5 bg-pub-accent text-pub-accent-fg rounded-full px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Acceso interno
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              aria-controls="pub-mobile-menu"
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div
            id="pub-mobile-menu"
            className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-pub-lg bg-pub-deep/90 backdrop-blur-xl border border-white/10 shadow-2xl p-2"
          >
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={`block rounded-full px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(l.href) ? 'bg-white/10 text-white' : 'text-pub-on-deep hover:text-white hover:bg-white/5'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/acceso"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-1.5 bg-pub-accent text-pub-accent-fg rounded-full px-4 py-3 text-sm font-semibold"
            >
              Acceso interno
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
