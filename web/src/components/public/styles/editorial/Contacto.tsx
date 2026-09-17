'use client'

import type { ReactNode } from 'react'
import { CheckCircle, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { kimarContact, whatsappUrl } from '@/lib/contact'
import { contacto } from '@/components/public/shared/content'
import { contactFields, useContactForm } from '@/components/public/shared/useContactForm'
import WhatsAppIcon from '@/components/public/shared/WhatsAppIcon'
import Reveal from '@/components/public/shared/Reveal'

/*
 * Contacto Editorial: grilla asimétrica 5/7. Izquierda, datos de contacto como
 * lista de definiciones separada por hairlines; derecha, formulario sobre superficie
 * con inputs de sólo subrayado y botón cuadrado.
 */

const container = 'mx-auto max-w-7xl px-6 lg:px-10'

const inputClass =
  'w-full bg-transparent border-0 border-b border-pub-line-input px-0 py-3 text-pub-heading placeholder:text-pub-muted-2 focus:border-pub-accent focus:outline-none focus:ring-0 transition-colors'

const labelClass = 'block text-[11px] uppercase tracking-[0.2em] text-pub-muted'

function Row({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-3 sm:gap-6 py-7">
      <dt className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-pub-muted">
        <Icon className="w-3.5 h-3.5 shrink-0 text-pub-accent" />
        {label}
      </dt>
      <dd className="flex flex-col gap-4">{children}</dd>
    </div>
  )
}

export default function Contacto() {
  const { form, sent, update, handleSubmit, reset } = useContactForm()

  return (
    <div className="bg-pub-bg text-pub-text">
      <div className={`${container} grid grid-cols-1 md:grid-cols-12 gap-14 lg:gap-20 py-14 md:py-24`}>
        {/* Información */}
        <div className="md:col-span-5">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-pub-muted">Atención directa</p>
            <h1 className="mt-6 font-pub-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-pub-heading">
              {contacto.titulo}
            </h1>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-pub-muted">{contacto.intro}</p>
          </Reveal>

          <Reveal delay={100}>
            <dl className="mt-12 border-y border-pub-line divide-y divide-pub-line">
              <Row icon={Phone} label="Teléfonos">
                {[
                  { label: 'Ventas', number: kimarContact.telefonoVentas },
                  { label: 'Administración', number: kimarContact.telefonoAdmin },
                ].map(({ label, number }) => (
                  <div key={label} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-pub-muted-2">{label}</p>
                      <p className="mt-0.5 text-lg text-pub-heading">{number}</p>
                    </div>
                    <a
                      href={whatsappUrl(number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Escribir por WhatsApp a ${label}`}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-pub-wa px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] text-pub-wa transition-colors hover:bg-pub-wa hover:text-white"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>
                ))}
              </Row>

              <Row icon={Mail} label="Email">
                <a href={`mailto:${kimarContact.emailVentas}`} className="break-all text-lg text-pub-heading transition-colors hover:text-pub-accent">
                  {kimarContact.emailVentas}
                </a>
                <a href={`mailto:${kimarContact.emailAdmin}`} className="break-all text-lg text-pub-heading transition-colors hover:text-pub-accent">
                  {kimarContact.emailAdmin}
                </a>
              </Row>

              <Row icon={MapPin} label="Zona">
                <p className="text-lg text-pub-heading">{kimarContact.cobertura}</p>
              </Row>

              <Row icon={Clock} label="Horario">
                <p className="text-lg text-pub-heading">{kimarContact.horario}</p>
              </Row>
            </dl>
          </Reveal>
        </div>

        {/* Formulario */}
        <div className="md:col-span-7">
          <Reveal delay={150}>
            <div className="rounded-pub-xl border border-pub-line bg-pub-surface p-8 sm:p-12 lg:p-16">
              {sent ? (
                <div className="flex min-h-[26rem] flex-col items-start justify-center gap-5">
                  <CheckCircle className="w-10 h-10 text-pub-accent" />
                  <h2 className="font-pub-display text-4xl leading-tight text-pub-heading">{contacto.enviado}</h2>
                  <p className="text-pub-muted">{contacto.enviadoDesc}</p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 border-b border-pub-heading pb-1 text-xs uppercase tracking-[0.2em] text-pub-heading transition-colors hover:border-pub-accent hover:text-pub-accent"
                  >
                    {contacto.otro}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-pub-muted">Formulario</p>
                    <h2 className="mt-3 font-pub-display text-3xl md:text-4xl leading-tight text-pub-heading">{contacto.formTitulo}</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                    {contactFields.map(f => (
                      <div key={f.name} className={f.name === 'nombre' ? 'sm:col-span-2' : ''}>
                        <label htmlFor={`contacto-${f.name}`} className={labelClass}>
                          {f.label}
                        </label>
                        <input
                          id={`contacto-${f.name}`}
                          name={f.name}
                          type={f.type}
                          required={f.required}
                          placeholder={f.placeholder}
                          value={form[f.name]}
                          onChange={e => update(f.name, e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label htmlFor="contacto-mensaje" className={labelClass}>
                        Mensaje *
                      </label>
                      <textarea
                        id="contacto-mensaje"
                        name="mensaje"
                        required
                        rows={4}
                        placeholder={contacto.placeholderMensaje}
                        value={form.mensaje}
                        onChange={e => update('mensaje', e.target.value)}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-pub-muted-2">* Campos obligatorios</p>
                    <button
                      type="submit"
                      className="rounded-pub bg-pub-accent px-10 py-4 text-xs uppercase tracking-[0.2em] text-pub-accent-fg transition-opacity hover:opacity-90"
                    >
                      Enviar mensaje
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
