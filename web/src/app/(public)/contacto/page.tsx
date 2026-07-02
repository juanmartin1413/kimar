'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, CheckCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

const WA_ADMIN = 'https://wa.me/5491125727299'
const WA_VENTAS = 'https://wa.me/5491130123555'

export default function ContactoPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' })
  const { palette } = useTheme()
  const k = palette === 'kimar'
  const gold = k ? '#C7A35A' : 'oklch(0.42 0.14 240)'
  const muted = k ? '#6F8C87' : 'oklch(0.55 0.04 240)'
  const dark = k ? '#2B2B2B' : 'oklch(0.25 0.08 240)'
  const iconBg = k ? '#E6E8E5' : 'oklch(0.92 0.04 240)'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16" style={{ backgroundColor: k ? '#F5F2E8' : undefined, minHeight: '100%' }}>
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-4xl font-bold" style={{ color: k ? '#2B2B2B' : 'oklch(0.25 0.08 240)' }}>Contacto</h1>
        <p style={{ color: k ? '#6F8C87' : 'oklch(0.45 0.04 240)' }}>
          Estamos disponibles para atender tu consulta o pedido.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-6" style={{ color: k ? '#0F2B2E' : 'oklch(0.3 0.08 240)' }}>Información de contacto</h2>
            <div className="space-y-6">
              {/* Teléfonos */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                  <Phone className="w-5 h-5" style={{ color: gold }} />
                </div>
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: muted }}>Teléfonos</p>
                  {[
                    { label: 'Administración', number: '+54 9 11 2572-7299', wa: WA_ADMIN },
                    { label: 'Ventas', number: '+54 9 11 3012-3555', wa: WA_VENTAS },
                  ].map(({ label, number, wa }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div>
                        <p className="text-xs" style={{ color: muted }}>{label}</p>
                        <p className="font-semibold" style={{ color: dark }}>{number}</p>
                      </div>
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: '#25D366', color: 'white' }}
                      >
                        <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5 shrink-0">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emails */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                  <Mail className="w-5 h-5" style={{ color: gold }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: muted }}>Email</p>
                  <p className="font-semibold" style={{ color: dark }}>ventas@kimarcompany.com</p>
                  <p className="font-semibold" style={{ color: dark }}>administracion@kimarcompany.com</p>
                </div>
              </div>

              {/* Zona */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                  <MapPin className="w-5 h-5" style={{ color: gold }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: muted }}>Zona de cobertura</p>
                  <p className="font-semibold" style={{ color: dark }}>Toda la Argentina</p>
                </div>
              </div>

              {/* Horario */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                  <Clock className="w-5 h-5" style={{ color: gold }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: muted }}>Horario de atención</p>
                  <p className="font-semibold" style={{ color: dark }}>Lunes a Sábados, 7:00 – 20:00 hs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl p-8 shadow-sm border"
          style={{
            backgroundColor: k ? '#E6E8E5' : 'white',
            borderColor: k ? '#C7A35A' : 'oklch(0.9 0.01 240)',
          }}
        >
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold" style={{ color: k ? '#2B2B2B' : 'oklch(0.25 0.08 240)' }}>¡Mensaje enviado!</h3>
              <p style={{ color: k ? '#6F8C87' : 'oklch(0.45 0.04 240)' }}>Nos pondremos en contacto a la brevedad.</p>
              <button
                onClick={() => { setSent(false); setForm({ nombre: '', email: '', telefono: '', mensaje: '' }) }}
                className="text-sm underline"
                style={{ color: k ? '#C7A35A' : 'oklch(0.42 0.14 240)' }}
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-xl font-bold" style={{ color: k ? '#0F2B2E' : 'oklch(0.3 0.08 240)' }}>Envianos un mensaje</h2>
              {[
                { name: 'nombre', label: 'Nombre completo *', type: 'text', required: true, placeholder: 'Tu nombre' },
                { name: 'email', label: 'Email *', type: 'email', required: true, placeholder: 'tu@email.com' },
                { name: 'telefono', label: 'Teléfono', type: 'tel', required: false, placeholder: '011 15-XXXX-XXXX' },
              ].map(f => (
                <div key={f.name} className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: k ? '#2B2B2B' : 'oklch(0.35 0.06 240)' }}>{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={form[f.name as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderWidth: '1px',
                      borderColor: k ? '#6F8C87' : 'oklch(0.88 0.02 240)',
                      backgroundColor: k ? '#F5F2E8' : 'white',
                      '--tw-ring-color': k ? '#C7A35A' : 'oklch(0.42 0.14 240)',
                    } as React.CSSProperties}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: k ? '#2B2B2B' : 'oklch(0.35 0.06 240)' }}>Mensaje *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="¿En qué podemos ayudarte?"
                  value={form.mensaje}
                  onChange={e => setForm(prev => ({ ...prev, mensaje: e.target.value }))}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
                  style={{
                    borderWidth: '1px',
                    borderColor: k ? '#6F8C87' : 'oklch(0.88 0.02 240)',
                    backgroundColor: k ? '#F5F2E8' : 'white',
                    '--tw-ring-color': k ? '#C7A35A' : 'oklch(0.42 0.14 240)',
                  } as React.CSSProperties}
                />
              </div>
              <button
                type="submit"
                className="w-full text-white font-semibold py-3 rounded-lg transition-colors"
                style={{ backgroundColor: k ? '#C7A35A' : 'oklch(0.42 0.14 240)' }}
              >
                Enviar mensaje
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
