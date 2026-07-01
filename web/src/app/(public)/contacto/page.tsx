'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, CheckCircle, MessageCircle } from 'lucide-react'
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
                        <MessageCircle className="w-3.5 h-3.5" />
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
