'use client'

import { seedData } from '@/lib/seed'
import { CategoriaProducto } from '@/lib/types'
import { formatPeso } from '@/lib/format'
import { useTheme } from '@/contexts/ThemeContext'

const categoryLabels: Record<CategoriaProducto, string> = {
  calamares: '🦑 Calamares',
  langostinos: '🦐 Langostinos & Afines',
  bivalvos: '🦪 Bivalvos & Moluscos',
  pescados: '🐟 Pescados',
  pulpos: '🐙 Pulpos',
  otros: '⭐ Especialidades',
}

export default function ProductosPage() {
  const { palette } = useTheme()
  const k = palette === 'kimar'

  const productsByCategory = seedData.productos.reduce<Record<string, typeof seedData.productos>>(
    (acc, p) => {
      if (!acc[p.categoria]) acc[p.categoria] = []
      acc[p.categoria].push(p)
      return acc
    },
    {}
  )

  const order: CategoriaProducto[] = ['langostinos', 'calamares', 'bivalvos', 'pescados', 'pulpos', 'otros']

  return (
    <div className="max-w-5xl mx-auto px-6 py-16" style={{ backgroundColor: k ? '#F5F2E8' : undefined, minHeight: '100%' }}>
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-4xl font-bold" style={{ color: k ? '#2B2B2B' : 'oklch(0.25 0.08 240)' }}>Lista de Precios</h1>
        <p style={{ color: k ? '#6F8C87' : 'oklch(0.45 0.04 240)' }} className="max-w-xl mx-auto">
          Precios por kg, sujetos a cambios sin previo aviso. Consultá disponibilidad con tu vendedor.
        </p>
      </div>

      <div className="space-y-10">
        {order.map(cat => {
          const prods = productsByCategory[cat]
          if (!prods?.length) return null
          return (
            <section key={cat}>
              <h2
                className="text-xl font-bold mb-4 pb-2 border-b"
                style={{
                  color: k ? '#0F2B2E' : 'oklch(0.35 0.10 240)',
                  borderColor: k ? '#C7A35A' : 'oklch(0.88 0.02 240)',
                }}
              >
                {categoryLabels[cat]}
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {prods.map(p => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center py-3 px-4 rounded-lg transition-colors"
                    style={{ color: k ? '#2B2B2B' : undefined }}
                  >
                    <span className="font-medium" style={{ color: k ? '#2B2B2B' : 'oklch(0.3 0.06 240)' }}>{p.nombre}</span>
                    <span className="font-bold tabular-nums" style={{ color: k ? '#C7A35A' : 'oklch(0.42 0.14 240)' }}>{formatPeso(p.precioKg)}{p.unidad === 'unidad' ? '/u' : '/kg'}</span>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <p className="text-center text-xs mt-12" style={{ color: k ? '#6F8C87' : 'oklch(0.55 0.04 240)' }}>
        * Precios en Pesos Argentinos (ARS). /kg = por kilogramo · /u = por unidad. IVA no incluido.
        Cantidades mínimas según producto.
      </p>
    </div>
  )
}
