'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Palette = 'default' | 'kimar'

interface ThemeContextType {
  palette: Palette
  togglePalette: () => void
}

const ThemeContext = createContext<ThemeContextType>({ palette: 'default', togglePalette: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<Palette>('default')

  useEffect(() => {
    const stored = localStorage.getItem('kimar-palette')
    if (stored === 'kimar' || stored === 'default') {
      setPalette(stored)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette)
    localStorage.setItem('kimar-palette', palette)
  }, [palette])

  function togglePalette() {
    setPalette(p => p === 'default' ? 'kimar' : 'default')
  }

  return (
    <ThemeContext.Provider value={{ palette, togglePalette }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
