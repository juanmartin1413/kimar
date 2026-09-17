'use client'

import { Mail, Phone, MapPin, Clock, CheckCircle } from 'lucide-react'
import { kimarContact, whatsappUrl } from '@/lib/contact'
import { contacto } from '@/components/public/shared/content'
import { contactFields, useContactForm } from '@/components/public/shared/useContactForm'
import WhatsAppIcon from '@/components/public/shared/WhatsAppIcon'

export default function Contacto() {
  const { form, sent, update, handleSubmit, reset } = useContactForm()

  const inputClass =
    'w-full rounded-lg px-4 py-2.5 text-sm border border-pub-line-input bg-pub-bg focus:outline-none focus:ring-2 focus:ring-pub-accent'

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 bg-pub-bg" style={{ minHeight: '100%' }}>
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-4xl font-bold text-pub-heading">{contacto.titulo}</h1>
        <p className="text-pub-muted">{contacto.intro}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-6 text-pub-heading-2">Información de contacto</h2>
            <div className="space-y-6">
              {/* Teléfonos */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-pub-soft">
                  <Phone className="w-5 h-5 text-pub-accent" />
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-pub-muted-2">Teléfonos</p>
                  {[
                    { label: 'Administración', number: kimarContact.telefonoAdmin },
                    { label: 'Ventas', number: kimarContact.telefonoVentas },
                  ].map(({ label, number }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-pub-muted-2">{label}</p>
                        <p className="font-semibold text-pub-heading">{number}</p>
                      </div>
                      <a
                        href={whatsappUrl(number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 bg-pub-wa text-white"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" fill="white" />
                        WhatsApp
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emails */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-pub-soft">
                  <Mail className="w-5 h-5 text-pub-accent" />
                </div>
                <div>
                  <p className="text-xs text-pub-muted-2">Email</p>
                  <p className="font-semibold text-pub-heading">{kimarContact.emailVentas}</p>
                  <p className="font-semibold text-pub-heading">{kimarContact.emailAdmin}</p>
                </div>
              </div>

              {/* Zona */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-pub-soft">
                  <MapPin className="w-5 h-5 text-pub-accent" />
                </div>
                <div>
                  <p className="text-xs text-pub-muted-2">Zona de cobertura</p>
                  <p className="font-semibold text-pub-heading">{kimarContact.cobertura}</p>
                </div>
              </div>

              {/* Horario */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-pub-soft">
                  <Clock className="w-5 h-5 text-pub-accent" />
                </div>
                <div>
                  <p className="text-xs text-pub-muted-2">Horario de atención</p>
                  <p className="font-semibold text-pub-heading">{kimarContact.horario}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-8 shadow-sm border bg-pub-surface border-pub-line">
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold text-pub-heading">{contacto.enviado}</h3>
              <p className="text-pub-muted">{contacto.enviadoDesc}</p>
              <button onClick={reset} className="text-sm underline text-pub-accent">
                {contacto.otro}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-xl font-bold text-pub-heading-2">{contacto.formTitulo}</h2>
              {contactFields.map(f => (
                <div key={f.name} className="space-y-1.5">
                  <label className="text-sm font-medium text-pub-text">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={e => update(f.name, e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-pub-text">Mensaje *</label>
                <textarea
                  required
                  rows={4}
                  placeholder={contacto.placeholderMensaje}
                  value={form.mensaje}
                  onChange={e => update('mensaje', e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-pub-accent text-pub-accent-fg font-semibold py-3 rounded-lg transition-colors"
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
