'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import { kimarContact, whatsappUrl } from '@/lib/contact'
import {
  brand,
  categoriaLabels,
  categoriaOrden,
  faq,
  features,
  hero,
  marcas,
  precios,
  proceso,
  segmentos,
  seleccionDestacada,
  stats,
} from '@/components/public/shared/content'
import { useProductos } from '@/components/public/shared/useProductos'
import Reveal from '@/components/public/shared/Reveal'
import Counter from '@/components/public/shared/Counter'
import WhatsAppIcon from '@/components/public/shared/WhatsAppIcon'
import {
  NetPattern,
  ScallopSilhouette,
  ShrimpSilhouette,
  SquidSilhouette,
  WaveDivider,
} from '@/components/public/shared/SeaIllustrations'

/*
 * Home Editorial: revista premium. Serif para titulares y cifras, grillas de 12
 * columnas asimétricas, hairlines de 1px como único recurso de separación y casi
 * ninguna caja rellena. Sin gradientes, sin glass, sin marquee.
 */

const container = 'mx-auto max-w-7xl px-6 lg:px-10'

function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs uppercase tracking-[0.2em] text-pub-muted ${className}`}>{children}</p>
}

function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`mt-6 font-pub-display text-4xl md:text-5xl leading-[1.05] text-pub-heading ${className}`}>{children}</h2>
  )
}

/** CTA de texto con subrayado fino que se desplaza al pasar el mouse. */
function TextLink({ href, children, muted = false }: { href: string; children: ReactNode; muted?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 border-b pb-2 text-sm uppercase tracking-[0.2em] transition-colors ${
        muted
          ? 'border-pub-line text-pub-muted hover:border-pub-heading hover:text-pub-heading'
          : 'border-pub-heading text-pub-heading hover:border-pub-accent hover:text-pub-accent'
      }`}
    >
      {children}
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

function two(n: number) {
  return String(n).padStart(2, '0')
}

export default function Home() {
  const { porCategoria } = useProductos()
  const conteo = new Map(porCategoria.map(g => [g.categoria, g.items.length]))

  return (
    <div className="bg-pub-bg text-pub-text">
      {/* 1. Portada */}
      <section>
        <div className={`${container} grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pt-14 md:pt-24 pb-10 md:pb-16`}>
          <div className="md:col-span-7 flex flex-col justify-center">
            <Reveal effect="fade">
              <Eyebrow>Distribuidora de productos del mar · Desde hace más de 15 años</Eyebrow>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-8 font-pub-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight text-pub-heading">
                {hero.title}
                <br />
                <em className="italic font-normal text-pub-accent">{hero.titleAccent}</em>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-8 max-w-prose text-lg leading-relaxed text-pub-muted">{hero.lead}</p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-5">
                <TextLink href="/productos">{hero.ctaPrimary}</TextLink>
                <TextLink href="/contacto" muted>
                  {hero.ctaSecondary}
                </TextLink>
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-5 md:col-start-8">
            <Reveal delay={150} effect="fade">
              <figure className="relative mr-3 mb-3">
                {/* Doble marco: hairline desplazado 12px */}
                <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 border border-pub-line" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/homeBackground.webp"
                  alt="Productos del mar seleccionados por KIMAR"
                  className="relative block w-full aspect-[4/5] object-cover"
                />
                <ShrimpSilhouette className="absolute -top-8 -left-8 w-24 h-24 md:w-28 md:h-28 text-pub-accent/40" />
                <figcaption className="mt-6 flex items-baseline justify-between gap-4 text-[11px] uppercase tracking-[0.2em] text-pub-muted-2">
                  <span>{brand.tagline}</span>
                  <span className="font-pub-display italic normal-case tracking-normal text-sm">{brand.slogan}</span>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
        <WaveDivider variant="line" className="h-10 text-pub-line" />
      </section>

      {/* 2. Cifras */}
      <section className={`${container} py-12 md:py-20`}>
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 border-y border-pub-line divide-y sm:divide-y-0 sm:divide-x divide-pub-line">
            {stats.map(s => (
              <div key={s.key} className="py-10 sm:py-14 sm:px-10 sm:first:pl-0 sm:last:pr-0">
                <p className="font-pub-display text-6xl md:text-7xl leading-none text-pub-heading">
                  {'value' in s ? <Counter to={s.value} prefix={s.prefix} /> : s.text}
                </p>
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-pub-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 3. Por qué elegirnos */}
      <section className={`${container} py-12 md:py-20`}>
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-10">
            <div className="md:col-span-7">
              <Eyebrow>Por qué elegirnos</Eyebrow>
              <SectionTitle>
                Cuatro razones, <em className="italic text-pub-accent">una sola forma</em> de trabajar.
              </SectionTitle>
            </div>
            <p className="md:col-span-4 md:col-start-9 text-pub-muted leading-relaxed">{brand.descripcion}</p>
          </div>
        </Reveal>
        <ol className="border-y border-pub-line divide-y divide-pub-line">
          {features.map((f, i) => (
            <li key={f.key}>
              <Reveal delay={i * 80}>
                <div className="grid grid-cols-[4rem_1fr] md:grid-cols-[6rem_1fr_2fr] gap-x-4 md:gap-x-8 items-baseline py-8 md:py-10">
                  <span className="font-pub-display text-3xl md:text-4xl leading-none text-pub-accent">{two(i + 1)}</span>
                  <h3 className="font-pub-display text-2xl md:text-3xl leading-tight text-pub-heading">{f.title}</h3>
                  <p className="col-start-2 md:col-start-3 mt-3 md:mt-0 max-w-prose leading-relaxed text-pub-muted">{f.desc}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Cómo trabajamos */}
      <section className="border-t border-pub-line bg-pub-bg-alt">
        <div className={`${container} grid grid-cols-1 md:grid-cols-12 gap-12 py-16 md:py-28`}>
          <div className="md:col-span-5">
            <div className="relative md:sticky md:top-28">
              <div className="relative">
                <Reveal>
                  <Eyebrow>Cómo trabajamos</Eyebrow>
                  <SectionTitle>
                    Del pedido <em className="italic text-pub-accent">a la puerta</em> de tu local.
                  </SectionTitle>
                  <p className="mt-6 max-w-sm leading-relaxed text-pub-muted">
                    Cuatro pasos, un vendedor dedicado y la cadena de frío controlada de principio a fin.
                  </p>
                  <SquidSilhouette className="pointer-events-none mt-12 hidden md:block w-44 h-44 lg:w-52 lg:h-52 text-pub-line opacity-80" />
                </Reveal>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <ol className="border-l border-pub-line pl-8 md:pl-12 space-y-14">
              {proceso.map((p, i) => (
                <li key={p.n} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute top-2 -left-8 md:-left-12 -translate-x-1/2 w-2 h-2 bg-pub-accent"
                  />
                  <Reveal delay={i * 80}>
                    <span className="font-pub-display text-sm tracking-[0.2em] text-pub-accent">{p.n}</span>
                    <h3 className="mt-2 font-pub-display text-2xl md:text-3xl text-pub-heading">{p.title}</h3>
                    <p className="mt-3 max-w-prose leading-relaxed text-pub-muted">{p.desc}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 5. Nuestra selección: índice */}
      <section className="relative overflow-hidden border-t border-pub-line">
        <NetPattern size={48} className="text-pub-line opacity-40" />
        <div className={`${container} relative grid grid-cols-1 md:grid-cols-12 gap-12 py-16 md:py-28`}>
          <div className="md:col-span-4">
            <Reveal>
              <Eyebrow>Nuestra selección</Eyebrow>
              <SectionTitle>Índice de productos</SectionTitle>
              <p className="mt-6 leading-relaxed text-pub-muted">{precios.intro}</p>
              <div className="mt-8">
                <TextLink href="/productos">Ver lista completa</TextLink>
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <Reveal delay={100}>
              <ol className="border-t border-pub-line">
                {categoriaOrden.map((cat, i) => {
                  const n = conteo.get(cat) ?? 0
                  return (
                    <li key={cat} className="border-b border-pub-line">
                      <Link
                        href={`/productos#${cat}`}
                        className="group flex items-baseline gap-3 sm:gap-5 py-5 md:py-6"
                      >
                        <span className="w-7 shrink-0 text-xs tracking-[0.2em] text-pub-muted-2">{two(i + 1)}</span>
                        <span className="font-pub-display text-3xl md:text-4xl leading-none text-pub-heading transition-colors group-hover:text-pub-accent">
                          {categoriaLabels[cat]}
                        </span>
                        <span aria-hidden="true" className="flex-1 -translate-y-1 border-b border-dotted border-pub-line" />
                        <span className="shrink-0 text-xs uppercase tracking-[0.15em] tabular-nums text-pub-muted">
                          {n > 0 ? `${n} ${n === 1 ? 'producto' : 'productos'}` : '—'}
                        </span>
                        <ArrowUpRight className="hidden sm:block w-4 h-4 shrink-0 text-pub-muted-2 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-pub-accent" />
                      </Link>
                    </li>
                  )
                })}
              </ol>
              <p className="mt-8 text-xs uppercase tracking-[0.2em] leading-loose text-pub-muted">
                <span className="text-pub-muted-2">Destacados — </span>
                {seleccionDestacada.join(', ')}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. A quién abastecemos */}
      <section className={`${container} py-16 md:py-28`}>
        <Reveal>
          <Eyebrow>A quién abastecemos</Eyebrow>
          <SectionTitle>
            Cocinas, barras <em className="italic text-pub-accent">y mostradores.</em>
          </SectionTitle>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 border-y border-pub-line">
          {segmentos.map((s, i) => {
            const isLast = i === segmentos.length - 1
            const cell = [
              'py-10 sm:py-12',
              i > 0 ? 'sm:pl-10' : '',
              // Hairline vertical entre columnas; en móvil, horizontal entre filas (todas menos la última).
              isLast ? '' : 'sm:pr-10 sm:border-r sm:border-pub-line border-b border-pub-line sm:border-b-0',
            ].join(' ')
            return (
              <article key={s.key} className={cell}>
                <Reveal delay={i * 80}>
                  <span className="text-xs tracking-[0.2em] text-pub-muted-2">{two(i + 1)}</span>
                  <h3 className="mt-3 font-pub-display italic text-3xl md:text-4xl leading-tight text-pub-heading">{s.title}</h3>
                  <p className="mt-4 max-w-prose leading-relaxed text-pub-muted">{s.desc}</p>
                </Reveal>
              </article>
            )
          })}
        </div>
      </section>

      {/* 7. Marcas */}
      <section className={container}>
        <Reveal effect="fade">
          <p className="border-y border-pub-line py-8 text-center text-xs uppercase tracking-[0.25em] leading-loose text-pub-muted">
            Trabajamos con{' '}
            {marcas.map((m, i) => (
              <span key={m}>
                <span className="text-pub-heading">{m}</span>
                {i < marcas.length - 1 && <span className="mx-3 text-pub-accent">·</span>}
              </span>
            ))}
          </p>
        </Reveal>
      </section>

      {/* 8. Preguntas frecuentes */}
      <section className={`${container} grid grid-cols-1 md:grid-cols-12 gap-12 py-16 md:py-28`}>
        <div className="md:col-span-4">
          <Reveal>
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <SectionTitle>Lo que nos consultan</SectionTitle>
          </Reveal>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <Reveal delay={100}>
            <div className="border-y border-pub-line divide-y divide-pub-line">
              {faq.map(f => (
                <details key={f.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                    <span className="font-pub-display text-xl md:text-2xl leading-snug text-pub-heading">{f.q}</span>
                    <Plus className="w-5 h-5 shrink-0 text-pub-accent transition-transform duration-300 group-open:rotate-45" />
                  </summary>
                  <p className="max-w-prose pb-7 leading-relaxed text-pub-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 9. Cierre */}
      <section className="relative overflow-hidden bg-pub-deep text-pub-on-deep">
        <ScallopSilhouette className="pointer-events-none absolute -right-12 -bottom-20 w-72 h-72 md:w-[28rem] md:h-[28rem] text-pub-accent-on-dark/30" />
        <div className={`${container} relative grid grid-cols-1 md:grid-cols-12 gap-12 py-20 md:py-28`}>
          <div className="md:col-span-7">
            <Reveal>
              <Eyebrow className="text-pub-on-deep-label">Hablemos</Eyebrow>
              <h2 className="mt-6 font-pub-display text-4xl md:text-6xl leading-[1.05] text-pub-on-deep">
                Consultá disponibilidad <em className="italic text-pub-accent-on-dark">con tu vendedor</em>
              </h2>
              <p className="mt-8 font-pub-display italic text-xl text-pub-on-deep-muted">{brand.slogan}</p>
            </Reveal>
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <Reveal delay={150}>
              <div className="border-y border-pub-deep-line divide-y divide-pub-deep-line">
                {[
                  { label: 'WhatsApp Ventas', number: kimarContact.telefonoVentas },
                  { label: 'WhatsApp Administración', number: kimarContact.telefonoAdmin },
                ].map(({ label, number }) => (
                  <a
                    key={label}
                    href={whatsappUrl(number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 py-5 transition-opacity hover:opacity-80"
                  >
                    <span>
                      <span className="block text-[10px] uppercase tracking-[0.2em] text-pub-on-deep-label">{label}</span>
                      <span className="mt-1 block text-lg text-pub-on-deep">{number}</span>
                    </span>
                    <WhatsAppIcon className="w-5 h-5 shrink-0 text-pub-wa" />
                  </a>
                ))}
                <a
                  href={`mailto:${kimarContact.emailVentas}`}
                  className="group flex items-center justify-between gap-4 py-5 transition-opacity hover:opacity-80"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-pub-on-deep-label">Email</span>
                    <span className="mt-1 block truncate text-lg text-pub-on-deep">{kimarContact.emailVentas}</span>
                  </span>
                  <ArrowUpRight className="w-5 h-5 shrink-0 text-pub-accent-on-dark transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  )
}
