'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Award,
  ChefHat,
  Fish,
  Mail,
  Plus,
  Shell,
  Snowflake,
  Sparkles,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { kimarContact, whatsappUrl } from '@/lib/contact'
import { formatPeso } from '@/lib/format'
import {
  brand,
  categoriaLabels,
  categoriaOrden,
  faq,
  features,
  hero,
  marcas,
  proceso,
  segmentos,
  stats,
} from '@/components/public/shared/content'
import { precioLabel, useProductos } from '@/components/public/shared/useProductos'
import Counter from '@/components/public/shared/Counter'
import Marquee from '@/components/public/shared/Marquee'
import Reveal from '@/components/public/shared/Reveal'
import WhatsAppIcon from '@/components/public/shared/WhatsAppIcon'
import { NetPattern, RippleRings, ScallopSilhouette, ShrimpSilhouette, WaveDivider } from '@/components/public/shared/SeaIllustrations'

const featureIcons: Record<(typeof features)[number]['key'], LucideIcon> = {
  experiencia: Award,
  premium: Shell,
  distribucion: Truck,
  atencion: Users,
}

const featureSpan = ['md:col-span-4', 'md:col-span-2', 'md:col-span-3', 'md:col-span-3'] as const

const segmentoIcons: Record<(typeof segmentos)[number]['key'], LucideIcon> = {
  restaurantes: UtensilsCrossed,
  sushi: Fish,
  pescaderias: Store,
  catering: ChefHat,
}

/* ---------- helpers ---------- */

function Section({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={`px-6 py-20 md:py-24 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  )
}

function SectionHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <Reveal className="max-w-2xl mb-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pub-accent mb-3">{eyebrow}</p>
      <h2 className="font-pub-display font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl text-pub-heading leading-[1.05]">
        {title}
      </h2>
      {lead && <p className="mt-4 text-pub-muted text-lg">{lead}</p>}
    </Reveal>
  )
}

function GlassChip({ icon: Icon, children, className = '' }: { icon: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-pub-deep/70 backdrop-blur-md border border-white/15 px-4 py-2 text-sm font-medium text-white shadow-lg ${className}`}
    >
      <Icon className="w-4 h-4 text-pub-accent-on-dark" />
      {children}
    </div>
  )
}

function Wordmarks({ items }: { items: readonly string[] }) {
  return (
    <>
      {items.map((w, i) => (
        <span key={`${w}-${i}`} className="flex items-center gap-10 px-5">
          <span className="font-pub-display text-2xl font-extrabold tracking-tight whitespace-nowrap">{w}</span>
          <ScallopSilhouette className="h-6 w-6 shrink-0 text-pub-accent-on-dark" />
        </span>
      ))}
    </>
  )
}

/* ---------- page ---------- */

export default function Home() {
  const { activos } = useProductos()
  const destacados = activos.slice(0, 8)

  const catLabels = Object.values(categoriaLabels)
  const rowA = marcas.flatMap((m, i) => [m, catLabels[i] ?? '']).filter(Boolean).concat(catLabels.slice(marcas.length))
  const rowB = [...rowA].reverse()

  return (
    <div className="flex flex-col bg-pub-bg">
      {/* 1. Hero */}
      <section className="bg-pub-deep text-white relative overflow-hidden -mt-[4.5rem] pt-40 pb-32 px-6">
        <div
          aria-hidden="true"
          className="pub-glow absolute -top-48 -left-40 w-[40rem] h-[40rem] rounded-full bg-pub-accent-on-dark/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          data-delay="1"
          className="pub-glow absolute -bottom-56 right-0 w-[40rem] h-[40rem] rounded-full bg-pub-deep-3 blur-3xl"
        />
        <NetPattern className="text-white/5" />
        <RippleRings className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] text-white/10" />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-12 gap-14 items-center">
          <div className="lg:col-span-7">
            <Reveal effect="fade">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-sm text-pub-on-deep">
                <Sparkles className="w-4 h-4 text-pub-accent-on-dark" />
                {hero.eyebrow}
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 font-pub-display font-extrabold tracking-tight text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.95]">
                {hero.title}
                <br />
                <span className="bg-gradient-to-r from-pub-accent-on-dark to-white bg-clip-text text-transparent">
                  {hero.titleAccent}
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 text-pub-on-deep text-lg max-w-xl leading-relaxed">{hero.lead}</p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/productos"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-pub-accent text-pub-accent-fg font-semibold px-7 py-3.5 hover:-translate-y-0.5 transition-transform"
                >
                  {hero.ctaPrimary}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/15 text-white font-semibold px-7 py-3.5 hover:bg-white/15 transition-colors"
                >
                  {hero.ctaSecondary}
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal effect="pop" delay={200} className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="rounded-pub-xl border border-white/15 bg-white/5 p-2 rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/homeBackground.webp"
                  alt="Mariscos premium seleccionados por KIMAR"
                  className="rounded-pub-lg w-full aspect-[4/5] object-cover"
                />
              </div>
              <GlassChip icon={Snowflake} className="absolute -left-3 top-8 sm:-left-8">
                Cadena de frío controlada
              </GlassChip>
              <GlassChip icon={Truck} className="absolute -right-2 bottom-10 sm:-right-6">
                Logística propia
              </GlassChip>
            </div>
          </Reveal>
        </div>

        <WaveDivider className="absolute bottom-0 left-0 h-16 md:h-24 text-pub-bg" />
      </section>

      {/* 2. Stats */}
      <section className="bg-pub-bg px-6">
        <div className="max-w-6xl mx-auto -mt-16 relative z-10 grid sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <Reveal key={s.key} delay={i * 90} effect="pop" className="h-full">
              <div className="rounded-pub-lg bg-pub-surface border border-pub-line shadow-lg p-7 h-full">
                <p className="font-pub-display text-5xl font-extrabold tracking-tight text-pub-heading">
                  {'value' in s ? <Counter to={s.value} prefix={s.prefix} /> : s.text}
                </p>
                <p className="mt-2 text-pub-muted">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3. Bento */}
      <Section>
        <SectionHeading
          eyebrow="Por qué KIMAR"
          title="¿Por qué elegirnos?"
          lead={brand.descripcion}
        />
        <div className="grid md:grid-cols-6 gap-4">
          {features.map((f, i) => {
            const Icon = featureIcons[f.key]
            return (
              <Reveal key={f.key} delay={i * 80} className={`h-full ${featureSpan[i]}`}>
                <div className="relative overflow-hidden h-full rounded-pub-xl bg-pub-surface border border-pub-line p-8 hover:-translate-y-1 hover:shadow-xl transition">
                  {i === 0 && (
                    <ShrimpSilhouette className="absolute -right-10 -bottom-12 w-64 h-64 text-pub-accent/20 rotate-12" />
                  )}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-pub-soft text-pub-accent flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="mt-6 font-pub-display font-bold text-xl text-pub-heading">{f.title}</h3>
                    <p className="mt-2 text-pub-muted leading-relaxed max-w-md">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </Section>

      {/* 4. Marquee */}
      <section className="bg-pub-deep py-6 text-white space-y-3 overflow-hidden">
        <Marquee duration={36}>
          <Wordmarks items={rowA} />
        </Marquee>
        <Marquee reverse duration={42} className="text-pub-on-deep">
          <Wordmarks items={rowB} />
        </Marquee>
      </section>

      {/* 5. Proceso */}
      <Section>
        <SectionHeading eyebrow="Cómo trabajamos" title="Del pedido a tu cocina" />
        <div className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pub-line to-transparent"
          />
          {proceso.map((step, i) => (
            <Reveal key={step.n} delay={i * 100}>
              <div className="relative">
                <span className="inline-block bg-pub-bg pr-4">
                  <span className="font-pub-display text-6xl font-extrabold leading-none bg-gradient-to-br from-pub-accent to-pub-heading bg-clip-text text-transparent">
                    {step.n}
                  </span>
                </span>
                <h3 className="mt-4 font-pub-display font-bold text-xl text-pub-heading">{step.title}</h3>
                <p className="mt-2 text-pub-muted leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 6. Segmentos */}
      <Section className="pt-0">
        <SectionHeading eyebrow="A quién abastecemos" title="Pensado para tu negocio" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {segmentos.map((s, i) => {
            const Icon = segmentoIcons[s.key]
            return (
              <Reveal key={s.key} delay={i * 80} effect="pop" className="h-full">
                <div className="h-full min-h-[18rem] flex flex-col bg-pub-deep-2 text-white rounded-pub-xl p-8 border border-white/10 hover:border-pub-accent-on-dark/50 hover:-translate-y-1 hover:shadow-2xl transition">
                  <Icon className="w-8 h-8 text-pub-accent-on-dark" />
                  <h3 className="mt-10 font-pub-display font-bold text-2xl tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-pub-on-deep leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </Section>

      {/* 7. Selección */}
      <Section className="bg-pub-bg-alt rounded-[3rem]">
        <SectionHeading eyebrow="Nuestra selección" title="Lo que llega a tu mesa" />
        <Reveal effect="fade">
          <div className="flex flex-wrap gap-2 mb-8">
            {categoriaOrden.map(cat => (
              <Link
                key={cat}
                href={`/productos#${cat}`}
                className="rounded-full bg-pub-soft text-pub-heading-2 font-semibold px-5 py-2.5 border border-pub-line hover:border-pub-accent/60 hover:-translate-y-0.5 transition"
              >
                {categoriaLabels[cat]}
              </Link>
            ))}
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {destacados.map((p, i) => (
            <Reveal key={p.id} delay={i * 50} effect="pop" className="h-full">
              <div className="h-full rounded-pub-lg bg-pub-surface border border-pub-line p-5 flex flex-col justify-between gap-4 hover:border-pub-accent/60 transition-colors">
                <p className="font-semibold text-pub-heading leading-snug">{p.nombre}</p>
                <p className="text-pub-accent font-bold tabular-nums">
                  {formatPeso(p.precioKg)}
                  <span className="text-xs font-medium text-pub-muted-2">{precioLabel(p)}</span>
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal effect="fade" className="mt-10">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 rounded-full bg-pub-accent text-pub-accent-fg font-semibold px-7 py-3.5 hover:-translate-y-0.5 transition-transform"
          >
            Ver lista completa
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </Section>

      {/* 8. FAQ */}
      <Section>
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Preguntas frecuentes" title="Lo que nos consultan" />
          </div>
          <div className="lg:col-span-8 space-y-3">
            {faq.map((item, i) => (
              <Reveal key={item.q} delay={i * 50} effect="fade">
                <details className="group rounded-pub-lg bg-pub-surface border border-pub-line open:shadow-lg transition-shadow">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 font-semibold text-pub-heading [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="shrink-0 w-8 h-8 rounded-full bg-pub-soft text-pub-accent flex items-center justify-center">
                      <Plus className="w-4 h-4 group-open:rotate-45 transition-transform" />
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-pub-muted leading-relaxed">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* 9. CTA */}
      <Section className="pt-0">
        <Reveal effect="pop">
          <div className="rounded-pub-xl bg-gradient-to-br from-pub-deep via-pub-deep-2 to-pub-deep-3 text-white p-10 md:p-16 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pub-glow absolute -top-32 -right-24 w-[30rem] h-[30rem] rounded-full bg-pub-accent-on-dark/30 blur-3xl"
            />
            <RippleRings className="absolute -bottom-32 -left-24 w-96 h-96 text-white/10" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pub-accent-on-dark mb-3">{brand.slogan}</p>
              <h2 className="font-pub-display font-extrabold tracking-tight text-4xl md:text-5xl leading-[1.02]">
                Consultá disponibilidad hoy
              </h2>
              <p className="mt-4 text-pub-on-deep text-lg">
                Escribinos por WhatsApp y te respondemos con precios y stock actualizados.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
                <a
                  href={whatsappUrl(kimarContact.telefonoVentas)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-pub-wa text-white rounded-full font-semibold px-6 py-3.5 hover:-translate-y-0.5 transition-transform"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  WhatsApp Ventas
                </a>
                <a
                  href={whatsappUrl(kimarContact.telefonoAdmin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white rounded-full font-semibold px-6 py-3.5 hover:bg-white/15 transition-colors"
                >
                  <WhatsAppIcon className="w-5 h-5 text-pub-wa" />
                  WhatsApp Administración
                </a>
              </div>
              <a
                href={`mailto:${kimarContact.emailVentas}`}
                className="mt-6 inline-flex items-center gap-2 text-sm text-pub-on-deep hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-pub-accent-on-dark" />
                {kimarContact.emailVentas}
              </a>
            </div>
          </div>
        </Reveal>
      </Section>
    </div>
  )
}
