'use client'

import { variants } from '@/components/public/styles'
import { useTheme } from '@/contexts/ThemeContext'

export default function ProductosPage() {
  const { style } = useTheme()
  const Productos = variants[style].Productos
  return <Productos />
}
