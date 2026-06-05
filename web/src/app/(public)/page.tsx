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
          background: k
            ? 'linear-gradient(135deg, #0F2B2E, #1a3d40, #6F8C87)'
            : 'linear-gradient(135deg, oklch(0.18 0.06 240), oklch(0.28 0.10 240), oklch(0.38 0.14 240))',
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
          {[
            { icon: Phone, label: 'Teléfono', value: '+54 9 11 XXXX-XXXX' },
            { icon: Mail, label: 'Email', value: 'ventas@kimar.com' },
            { icon: MapPin, label: 'Zona de cobertura', value: 'Gran Buenos Aires' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="space-y-2">
              <Icon className="w-6 h-6 mx-auto" style={{ color: k ? '#C7A35A' : 'oklch(0.75 0.12 240)' }} />
              <p className="text-xs" style={{ color: k ? '#6F8C87' : 'oklch(0.75 0.08 240)' }}>{label}</p>
              <p className="font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
