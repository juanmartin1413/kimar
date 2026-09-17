import Link from 'next/link'
import { Clock, Mail, MapPin } from 'lucide-react'
import { kimarContact, whatsappUrl } from '@/lib/contact'
import { brand, navLinks } from '@/components/public/shared/content'
import WhatsAppIcon from '@/components/public/shared/WhatsAppIcon'

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-pub-on-deep-label mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const telefonos = [
    { label: 'Ventas', number: kimarContact.telefonoVentas },
    { label: 'Administración', number: kimarContact.telefonoAdmin },
  ]

  return (
    <footer className="bg-pub-deep text-pub-on-deep rounded-t-[3rem] mt-16 relative overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute text-[14rem] leading-none font-pub-display font-extrabold text-white/5 -bottom-10 -right-4 select-none pointer-events-none"
      >
        {brand.nombre}
      </span>

      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.7fr_1.4fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logoCamaronTransp.png" alt="" className="h-9 w-auto" />
              <div className="leading-tight">
                <p className="font-pub-display font-extrabold tracking-tight text-white text-xl">{brand.nombre}</p>
                <p className="text-xs text-pub-on-deep-muted">{brand.tagline}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-pub-on-deep-muted max-w-xs">{brand.descripcion}</p>
          </div>

          <Column title="Navegación">
            <ul className="space-y-2.5">
              {navLinks.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/acceso" className="text-sm hover:text-white transition-colors">
                  Acceso interno
                </Link>
              </li>
            </ul>
          </Column>

          <Column title="Contacto">
            <ul className="space-y-2.5 text-sm">
              {telefonos.map(t => (
                <li key={t.number}>
                  <a
                    href={whatsappUrl(t.number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0 text-pub-wa" />
                    <span>
                      {t.number} <span className="text-pub-on-deep-muted">· {t.label}</span>
                    </span>
                  </a>
                </li>
              ))}
              {[kimarContact.emailVentas, kimarContact.emailAdmin].map(mail => (
                <li key={mail}>
                  <a href={`mailto:${mail}`} className="inline-flex items-center gap-2 hover:text-white transition-colors break-all">
                    <Mail className="w-4 h-4 shrink-0 text-pub-accent-on-dark" />
                    {mail}
                  </a>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Horario">
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-pub-accent-on-dark" />
                {kimarContact.horario}
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-pub-accent-on-dark" />
                {kimarContact.cobertura}
              </li>
            </ul>
          </Column>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-pub-on-deep-muted">
          <p>
            © {year} {brand.nombre} · {brand.slogan}
          </p>
          <p>{brand.tagline}</p>
        </div>
      </div>
    </footer>
  )
}
