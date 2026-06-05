'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, CheckCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ContactoPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' })
  const { palette } = useTheme()
  const k = palette === 'kimar'

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
            <div className="space-y-5">
              {[
                { icon: Phone, label: 'Teléfono', value: '+54 9 11 XXXX-XXXX' },
                { icon: Mail, label: 'Email', value: 'ventas@kimar.com' },
                { icon: MapPin, label: 'Zona de cobertura', value: 'Gran Buenos Aires y alrededores' },
                { icon: Clock, label: 'Horario de atención', value: 'Lunes a Sábados, 7:00 – 16:00 hs' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: k ? '#E6E8E5' : 'oklch(0.92 0.04 240)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: k ? '#C7A35A' : 'oklch(0.42 0.14 240)' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: k ? '#6F8C87' : 'oklch(0.55 0.04 240)' }}>{label}</p>
                    <p className="font-semibold" style={{ color: k ? '#2B2B2B' : 'oklch(0.25 0.08 240)' }}>{value}</p>
                  </div>
                </div>
              ))}
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
