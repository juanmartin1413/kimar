'use client'

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, ReactNode } from 'react'

export type Palette = 'default' | 'kimar'
export type StyleVariant = 'clasico' | 'editorial' | 'moderno'

export const PALETTES: readonly Palette[] = ['default', 'kimar']
export const STYLES: readonly StyleVariant[] = ['clasico', 'editorial', 'moderno']

/** Claves de localStorage. También las lee el script inline del root layout. */
export const THEME_STORAGE_KEYS = { palette: 'kimar-palette', style: 'kimar-style' } as const

interface ThemeContextType {
  palette: Palette
  style: StyleVariant
  setPalette: (p: Palette) => void
  setStyle: (s: StyleVariant) => void
  togglePalette: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  palette: 'default',
  style: 'clasico',
  setPalette: () => {},
  setStyle: () => {},
  togglePalette: () => {},
})

function isPalette(v: unknown): v is Palette {
  return typeof v === 'string' && (PALETTES as readonly string[]).includes(v)
}
function isStyle(v: unknown): v is StyleVariant {
  return typeof v === 'string' && (STYLES as readonly string[]).includes(v)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // El estado inicial coincide con lo que renderiza el servidor (default / clasico).
  const [palette, setPalette] = useState<Palette>('default')
  const [style, setStyle] = useState<StyleVariant>('clasico')

  // Al hidratar, adoptar lo que el script inline dejó en <html data-palette data-style>.
  useLayoutEffect(() => {
    const d = document.documentElement
    if (isPalette(d.dataset.palette)) setPalette(d.dataset.palette)
    if (isStyle(d.dataset.style)) setStyle(d.dataset.style)
  }, [])

  // Reflejar y persistir cada cambio; levantar el velo anti-flash.
  useLayoutEffect(() => {
    const d = document.documentElement
    d.setAttribute('data-palette', palette)
    d.setAttribute('data-style', style)
    try {
      localStorage.setItem(THEME_STORAGE_KEYS.palette, palette)
      localStorage.setItem(THEME_STORAGE_KEYS.style, style)
    } catch {}
    d.classList.remove('pub-pending')
  }, [palette, style])

  const togglePalette = useCallback(() => {
    setPalette(p => (p === 'default' ? 'kimar' : 'default'))
  }, [])

  const value = useMemo(
    () => ({ palette, style, setPalette, setStyle, togglePalette }),
    [palette, style, togglePalette],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
