'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { brand, navLinks } from '@/components/public/shared/content'

/*
 * Nav Editorial: barra clara, tipografía serif para la marca, links en versalitas
 * con subrayado fino en el ítem activo. El menú móvil es una superposición a
 * pantalla completa con links serif grandes. Se renderiza como hermano del
 * <header> porque el backdrop-blur convertiría al header en contenedor del fixed.
 */

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

function Wordmark({ large = false }: { large?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className={`font-pub-display tracking-[0.3em] text-pub-heading ${large ? 'text-3xl' : 'text-xl md:text-2xl'}`}>
        {brand.nombre}
      </span>
      <span className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-pub-muted">{brand.tagline}</span>
    </span>
  )
}

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Cerrar al navegar.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Bloquear el scroll del body y cerrar con Escape mientras el menú está abierto.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <header className="sticky top-0 z-50 bg-pub-bg/90 backdrop-blur border-b border-pub-line">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/" aria-label={`${brand.nombre} — Inicio`} className="justify-self-start">
            <Wordmark />
          </Link>

          <nav aria-label="Principal" className="hidden md:flex items-center justify-center gap-10">
            {navLinks.map(l => {
              const active = isActive(pathname, l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-xs uppercase tracking-[0.2em] py-1.5 border-b transition-colors ${
                    active
                      ? 'border-pub-accent text-pub-heading'
                      : 'border-transparent text-pub-muted hover:text-pub-heading hover:border-pub-line'
                  }`}
                >
                  {l.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden md:flex justify-end">
            <Link
              href="/acceso"
              className="group inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-pub-muted hover:text-pub-heading transition-colors"
            >
              Acceso interno
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="pub-editorial-menu"
            className="md:hidden justify-self-end -mr-2 p-2 text-pub-heading"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {open && (
        <div
          id="pub-editorial-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="fixed inset-0 z-[70] flex flex-col bg-pub-bg text-pub-heading md:hidden"
        >
          <div className="flex h-20 items-center justify-between px-6 border-b border-pub-line">
            <Link href="/" onClick={() => setOpen(false)} aria-label={`${brand.nombre} — Inicio`}>
              <Wordmark />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="-mr-2 p-2 text-pub-heading"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav aria-label="Principal" className="flex flex-1 flex-col justify-center px-6">
            {navLinks.map((l, i) => {
              const active = isActive(pathname, l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-baseline justify-between border-b border-pub-line py-5"
                >
                  <span className={`font-pub-display text-5xl leading-none ${active ? 'italic text-pub-accent' : 'text-pub-heading'}`}>
                    {l.label}
                  </span>
                  <span className="text-xs tracking-[0.2em] text-pub-muted-2">0{i + 1}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center justify-between px-6 py-8 border-t border-pub-line">
            <span className="text-[10px] uppercase tracking-[0.25em] text-pub-muted-2">{brand.slogan}</span>
            <Link
              href="/acceso"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-pub-heading"
            >
              Acceso interno <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
