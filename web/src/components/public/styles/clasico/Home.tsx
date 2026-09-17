'use client'

import Link from 'next/link'
import { Award, Users, Truck, Phone, Mail, MapPin, ChevronRight, Shell } from 'lucide-react'
import { kimarContact, whatsappUrl } from '@/lib/contact'
import { features, hero, seleccionDestacada } from '@/components/public/shared/content'
import WhatsAppIcon from '@/components/public/shared/WhatsAppIcon'

const featureIcons = {
  experiencia: Award,
  premium: Shell,
  distribucion: Truck,
  atencion: Users,
} as const

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        className="text-white py-24 px-6"
        style={{
          backgroundImage: 'linear-gradient(var(--pub-hero-overlay), var(--pub-hero-overlay)), url(/homeBackground.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm">
            <Award className="w-4 h-4" />
            {hero.eyebrow}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            {hero.title}<br />
            <span className="text-pub-accent-on-dark">{hero.titleAccent}</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto text-pub-on-deep">{hero.lead}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/productos"
              className="bg-pub-accent text-pub-accent-fg font-semibold px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              {hero.ctaPrimary} <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contacto"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              {hero.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-pub-bg">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-pub-heading">¿Por qué elegirnos?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map(f => {
              const Icon = featureIcons[f.key]
              return (
                <div key={f.key} className="text-center space-y-3 p-6 rounded-xl transition-colors">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-pub-soft">
                    {f.key === 'premium' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/logoCamaronTransp.png" alt="KIMAR" className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6 text-pub-accent" />
                    )}
                  </div>
                  <h3 className="font-bold text-pub-heading">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-pub-muted">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Products preview */}
      <section className="py-20 px-6 bg-pub-bg-alt">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-pub-heading">Nuestra selección</h2>
          <p className="text-pub-muted">
            Trabajamos con las mejores marcas del mercado: Lanzal, Iberconsa, Sta. Helena y más.
          </p>
          <div className="flex flex-wrap justify-center gap-3 py-4">
            {seleccionDestacada.map(p => (
              <span
                key={p}
                className="px-4 py-2 rounded-full text-sm font-medium shadow-sm border bg-pub-bg border-pub-line text-pub-heading-2"
              >
                {p}
              </span>
            ))}
          </div>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 bg-pub-accent text-pub-accent-fg font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Ver lista completa de precios <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Contact strip */}
      <section className="py-16 px-6 text-white bg-pub-deep-3">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <Phone className="w-6 h-6 mx-auto text-pub-accent-on-dark" />
            <p className="text-xs text-pub-on-deep-label">Teléfonos</p>
            <div className="space-y-2">
              {[
                { number: kimarContact.telefonoAdmin, label: 'Adm.' },
                { number: kimarContact.telefonoVentas, label: 'Ventas' },
              ].map(({ number, label }) => (
                <a
                  key={number}
                  href={whatsappUrl(number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold hover:opacity-80 transition-opacity"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0 text-pub-wa" />
                  {number} ({label})
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Mail className="w-6 h-6 mx-auto text-pub-accent-on-dark" />
            <p className="text-xs text-pub-on-deep-label">Email</p>
            <p className="font-semibold">{kimarContact.emailVentas}</p>
          </div>
          <div className="space-y-2">
            <MapPin className="w-6 h-6 mx-auto text-pub-accent-on-dark" />
            <p className="text-xs text-pub-on-deep-label">Zona de cobertura</p>
            <p className="font-semibold">{kimarContact.cobertura}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
