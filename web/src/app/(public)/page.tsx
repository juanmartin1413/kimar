'use client'

import Link from 'next/link'
import { Award, Users, Truck, Phone, Mail, MapPin, ChevronRight, Shell } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function HomePage() {
  const { palette } = useTheme()
  const k = palette === 'kimar'

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        className="text-white py-24 px-6"
        style={{
          backgroundImage: k
            ? 'linear-gradient(rgba(15,43,46,0.72), rgba(15,43,46,0.72)), url(/homeBackground.webp)'
            : 'linear-gradient(rgba(18,25,48,0.72), rgba(18,25,48,0.72)), url(/homeBackground.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm">
            <Award className="w-4 h-4" />
            Más de 15 años de trayectoria
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Mariscos Premium<br />
            <span style={{ color: k ? '#C7A35A' : 'oklch(0.75 0.12 240)' }}>a tu mesa</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto" style={{ color: k ? '#E6E8E5' : 'oklch(0.85 0.03 240)' }}>
            Distribuidora especializada en mariscos y productos del mar de primera calidad.
            Proveemos a los mejores restaurantes, cadenas de sushi y pescaderías de Argentina.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/productos"
              className="text-white font-semibold px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
              style={{ backgroundColor: k ? '#C7A35A' : 'oklch(0.42 0.14 240)' }}
            >
              Ver Productos <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contacto"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Contactanos
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6" style={{ backgroundColor: k ? '#F5F2E8' : 'white' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: k ? '#2B2B2B' : 'oklch(0.25 0.08 240)' }}>
            ¿Por qué elegirnos?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Award, title: '+15 años de experiencia', desc: 'Una trayectoria sólida construida sobre confianza y calidad.' },
              { icon: Shell, title: 'Productos premium', desc: 'Seleccionamos los mejores productos del mar nacional e importado.', useLogo: true },
              { icon: Truck, title: 'Distribución puntual', desc: 'Entregas directas con cadena de frío garantizada.' },
              { icon: Users, title: 'Atención personalizada', desc: 'Un vendedor dedicado que conoce tu negocio y tus necesidades.' },
            ].map(({ icon: Icon, title, desc, useLogo }) => (
              <div key={title} className="text-center space-y-3 p-6 rounded-xl transition-colors" style={{ backgroundColor: 'transparent' }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: k ? '#E6E8E5' : 'oklch(0.92 0.04 240)' }}
                >
                  {useLogo ? (
                    <img src="/logoCamaronTransp.png" alt="KIMAR" className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" style={{ color: k ? '#C7A35A' : 'oklch(0.42 0.14 240)' }} />
                  )}
                </div>
                <h3 className="font-bold" style={{ color: k ? '#2B2B2B' : 'oklch(0.25 0.08 240)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: k ? '#6F8C87' : 'oklch(0.45 0.04 240)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products preview */}
      <section className="py-20 px-6" style={{ backgroundColor: k ? '#E6E8E5' : 'oklch(0.97 0.01 240)' }}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold" style={{ color: k ? '#2B2B2B' : 'oklch(0.25 0.08 240)' }}>Nuestra selección</h2>
          <p style={{ color: k ? '#6F8C87' : 'oklch(0.45 0.04 240)' }}>
            Trabajamos con las mejores marcas del mercado: Lanzal, Iberconsa, Sta. Helena y más.
          </p>
          <div className="flex flex-wrap justify-center gap-3 py-4">
            {['Langostinos', 'Calamares', 'Pulpo Español', 'Salmón', 'Vieiras', 'Mejillones', 'Centolla', 'Merluza Negra'].map(p => (
              <span
                key={p}
                className="px-4 py-2 rounded-full text-sm font-medium shadow-sm border"
                style={{
                  backgroundColor: k ? '#F5F2E8' : 'white',
                  borderColor: k ? '#C7A35A' : 'oklch(0.85 0.03 240)',
                  color: k ? '#0F2B2E' : 'oklch(0.35 0.08 240)',
                }}
              >
                {p}
              </span>
            ))}
          </div>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            style={{ backgroundColor: k ? '#C7A35A' : 'oklch(0.42 0.14 240)' }}
          >
            Ver lista completa de precios <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Contact strip */}
      <section className="py-16 px-6 text-white" style={{ backgroundColor: k ? '#0F2B2E' : 'oklch(0.28 0.10 240)' }}>
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <Phone className="w-6 h-6 mx-auto" style={{ color: k ? '#C7A35A' : 'oklch(0.75 0.12 240)' }} />
            <p className="text-xs" style={{ color: k ? '#6F8C87' : 'oklch(0.75 0.08 240)' }}>Teléfonos</p>
            <div className="space-y-2">
              {[
                { number: '+54 9 11 2572-7299', label: 'Adm.', wa: 'https://wa.me/5491125727299' },
                { number: '+54 9 11 3012-3555', label: 'Ventas', wa: 'https://wa.me/5491130123555' },
              ].map(({ number, label, wa }) => (
                <a key={wa} href={wa} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold hover:opacity-80 transition-opacity"
                >
                  <svg viewBox="0 0 24 24" fill="#25D366" className="w-4 h-4 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {number} ({label})
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Mail className="w-6 h-6 mx-auto" style={{ color: k ? '#C7A35A' : 'oklch(0.75 0.12 240)' }} />
            <p className="text-xs" style={{ color: k ? '#6F8C87' : 'oklch(0.75 0.08 240)' }}>Email</p>
            <p className="font-semibold">ventas@kimarcompany.com</p>
          </div>
          <div className="space-y-2">
            <MapPin className="w-6 h-6 mx-auto" style={{ color: k ? '#C7A35A' : 'oklch(0.75 0.12 240)' }} />
            <p className="text-xs" style={{ color: k ? '#6F8C87' : 'oklch(0.75 0.08 240)' }}>Zona de cobertura</p>
            <p className="font-semibold">Toda la Argentina</p>
          </div>
        </div>
      </section>
    </div>
  )
}
