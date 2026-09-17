import Link from 'next/link'
import type { ReactNode } from 'react'
import { kimarContact } from '@/lib/contact'
import { brand, navLinks } from '@/components/public/shared/content'

/*
 * Footer Editorial: claro, con la marca en serif grande a la izquierda y tres
 * columnas de texto separadas por aire, no por cajas. Fila inferior con © y slogan.
 */

function Column({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.25em] text-pub-muted-2">{label}</p>
      <div className="mt-5 flex flex-col gap-2.5 text-sm text-pub-text">{children}</div>
    </div>
  )
}

const linkClass = 'transition-colors hover:text-pub-accent'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-pub-bg border-t border-pub-line">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <p className="font-pub-display text-5xl md:text-6xl leading-none tracking-[0.2em] text-pub-heading">{brand.nombre}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-pub-muted">{brand.tagline}</p>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-pub-muted">{brand.descripcion}</p>
        </div>

        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-[0.8fr_1.5fr_1fr] gap-10">
          <Column label="Navegación">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            ))}
            <Link href="/acceso" className={`${linkClass} text-pub-muted`}>
              Acceso interno
            </Link>
          </Column>

          <Column label="Contacto">
            <a href={`mailto:${kimarContact.emailVentas}`} className={`${linkClass} break-all`}>
              {kimarContact.emailVentas}
            </a>
            <a href={`mailto:${kimarContact.emailAdmin}`} className={`${linkClass} break-all`}>
              {kimarContact.emailAdmin}
            </a>
            <span className="mt-2 text-pub-muted">Ventas · {kimarContact.telefonoVentas}</span>
            <span className="text-pub-muted">Administración · {kimarContact.telefonoAdmin}</span>
          </Column>

          <Column label="Atención">
            <span>{kimarContact.horario}</span>
            <span className="text-pub-muted">{kimarContact.cobertura}</span>
          </Column>
        </div>
      </div>

      <div className="border-t border-pub-line">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] uppercase tracking-[0.2em] text-pub-muted-2">
          <p>
            © {year} {brand.nombre}. Todos los derechos reservados.
          </p>
          <p>{brand.slogan}</p>
        </div>
      </div>
    </footer>
  )
}
