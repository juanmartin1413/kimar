'use client'

import { ArrowUpRight, CheckCircle, Clock, Mail, MapPin } from 'lucide-react'
import { kimarContact, whatsappUrl } from '@/lib/contact'
import { contacto } from '@/components/public/shared/content'
import { contactFields, useContactForm } from '@/components/public/shared/useContactForm'
import Reveal from '@/components/public/shared/Reveal'
import WhatsAppIcon from '@/components/public/shared/WhatsAppIcon'

const inputClass =
  'w-full rounded-2xl bg-pub-bg border border-pub-line-input px-4 py-3 text-pub-text placeholder:text-pub-muted-2 focus:outline-none focus:ring-2 focus:ring-pub-accent transition-shadow'

function ActionCard({
  href,
  label,
  value,
  icon,
  external = false,
}: {
  href: string
  label: string
  value: string
  icon: React.ReactNode
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="rounded-pub-xl bg-pub-deep-2 text-white p-6 flex items-center justify-between gap-4 border border-white/10 hover:border-pub-accent-on-dark/50 hover:-translate-y-1 hover:shadow-2xl transition"
    >
      <div className="flex items-center gap-4 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pub-on-deep-label">{label}</p>
          <p className="font-pub-display font-bold text-lg tracking-tight truncate">{value}</p>
        </div>
      </div>
      <ArrowUpRight className="w-5 h-5 shrink-0 text-pub-on-deep-muted" />
    </a>
  )
}

export default function Contacto() {
  const { form, sent, update, handleSubmit, reset } = useContactForm()

  return (
    <div className="bg-pub-bg px-6 pt-14 pb-20">
      <div className="max-w-6xl mx-auto">
        <Reveal className="max-w-2xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pub-accent mb-3">{contacto.titulo}</p>
          <h1 className="font-pub-display font-extrabold tracking-tight text-5xl md:text-6xl text-pub-heading leading-[0.98]">
            Hablemos
          </h1>
          <p className="mt-5 text-pub-muted text-lg">{contacto.intro}</p>
        </Reveal>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Left: actions */}
          <div className="lg:col-span-5 min-w-0 space-y-3">
            <Reveal delay={0}>
              <ActionCard
                href={whatsappUrl(kimarContact.telefonoVentas)}
                external
                label="WhatsApp Ventas"
                value={kimarContact.telefonoVentas}
                icon={
                  <span className="w-12 h-12 shrink-0 rounded-full bg-pub-wa flex items-center justify-center">
                    <WhatsAppIcon className="w-6 h-6 text-white" />
                  </span>
                }
              />
            </Reveal>
            <Reveal delay={80}>
              <ActionCard
                href={whatsappUrl(kimarContact.telefonoAdmin)}
                external
                label="WhatsApp Administración"
                value={kimarContact.telefonoAdmin}
                icon={
                  <span className="w-12 h-12 shrink-0 rounded-full bg-pub-wa flex items-center justify-center">
                    <WhatsAppIcon className="w-6 h-6 text-white" />
                  </span>
                }
              />
            </Reveal>
            <Reveal delay={160}>
              <div className="rounded-pub-xl bg-pub-deep-2 text-white p-6 border border-white/10">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 shrink-0 rounded-full bg-pub-accent text-pub-accent-fg flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pub-on-deep-label">Email</p>
                </div>
                <ul className="mt-4 space-y-2">
                  {[
                    { label: 'Ventas', mail: kimarContact.emailVentas },
                    { label: 'Administración', mail: kimarContact.emailAdmin },
                  ].map(e => (
                    <li key={e.mail}>
                      <a
                        href={`mailto:${e.mail}`}
                        className="group flex items-center justify-between gap-3 rounded-2xl bg-white/5 hover:bg-white/10 px-4 py-3 transition-colors"
                      >
                        <span className="min-w-0">
                          <span className="block text-xs text-pub-on-deep-muted">{e.label}</span>
                          <span className="block font-semibold break-all">{e.mail}</span>
                        </span>
                        <ArrowUpRight className="w-4 h-4 shrink-0 text-pub-on-deep-muted group-hover:text-white transition-colors" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={240} effect="fade">
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-pub-soft text-pub-heading-2 text-sm px-4 py-2">
                  <Clock className="w-4 h-4 text-pub-accent" />
                  {kimarContact.horario}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-pub-soft text-pub-heading-2 text-sm px-4 py-2">
                  <MapPin className="w-4 h-4 text-pub-accent" />
                  {kimarContact.cobertura}
                </span>
              </div>
            </Reveal>
          </div>

          {/* Right: form */}
          <Reveal delay={120} effect="pop" className="lg:col-span-7 min-w-0">
            <div className="rounded-pub-xl bg-pub-surface border border-pub-line p-8 shadow-xl">
              {sent ? (
                <div className="text-center py-14 space-y-4">
                  <span className="mx-auto w-16 h-16 rounded-full bg-pub-soft text-pub-accent flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </span>
                  <h2 className="font-pub-display font-extrabold tracking-tight text-2xl text-pub-heading">{contacto.enviado}</h2>
                  <p className="text-pub-muted">{contacto.enviadoDesc}</p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-2 inline-flex items-center rounded-full border border-pub-line-input text-pub-heading-2 font-semibold px-6 py-2.5 hover:bg-pub-soft transition-colors"
                  >
                    {contacto.otro}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="font-pub-display font-extrabold tracking-tight text-2xl text-pub-heading">{contacto.formTitulo}</h2>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {contactFields.map((f, i) => (
                      <div key={f.name} className={`space-y-1.5 ${i === 0 ? 'sm:col-span-2' : ''}`}>
                        <label htmlFor={`contacto-${f.name}`} className="text-sm font-medium text-pub-text">
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
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contacto-mensaje" className="text-sm font-medium text-pub-text">
                      Mensaje *
                    </label>
                    <textarea
                      id="contacto-mensaje"
                      name="mensaje"
                      required
                      rows={5}
                      placeholder={contacto.placeholderMensaje}
                      value={form.mensaje}
                      onChange={e => update('mensaje', e.target.value)}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-pub-accent text-pub-accent-fg font-semibold py-3.5 hover:-translate-y-0.5 transition-transform"
                  >
                    Enviar mensaje
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
