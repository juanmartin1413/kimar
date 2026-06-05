'use client'

import PublicNav from '@/components/public/PublicNav'
import PaletteToggle from '@/components/public/PaletteToggle'
import { useTheme } from '@/contexts/ThemeContext'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme()
  const k = palette === 'kimar'

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <footer
        className="text-white py-8 mt-auto"
        style={{ backgroundColor: k ? '#0F2B2E' : 'oklch(0.18 0.06 240)' }}
      >
        <div className="max-w-6xl mx-auto px-6 text-center text-sm space-y-1">
          <p className="font-semibold text-white">KIMAR Mariscos Premium</p>
          <p style={{ color: k ? '#E6E8E5' : 'oklch(0.85 0.02 240)' }}>Más de 15 años al servicio de los mejores restaurantes y pescaderías de Argentina.</p>
          <p style={{ color: k ? '#6F8C87' : 'oklch(0.65 0.04 240)' }}>© {new Date().getFullYear()} KIMAR. Todos los derechos reservados.</p>
        </div>
      </footer>
      <PaletteToggle />
    </div>
  )
}
