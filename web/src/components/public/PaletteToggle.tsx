'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Palette } from 'lucide-react'

export default function PaletteToggle() {
  const { palette, togglePalette } = useTheme()

  return (
    <button
      onClick={togglePalette}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      style={{
        backgroundColor: palette === 'default' ? 'oklch(0.42 0.14 240)' : '#C7A35A',
        color: 'white',
      }}
      title={palette === 'default' ? 'Cambiar a paleta KIMAR' : 'Cambiar a paleta original'}
    >
      <Palette className="w-5 h-5" />
    </button>
  )
}
