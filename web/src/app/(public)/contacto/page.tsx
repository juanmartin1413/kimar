'use client'

import { variants } from '@/components/public/styles'
import { useTheme } from '@/contexts/ThemeContext'

export default function ContactoPage() {
  const { style } = useTheme()
  const Contacto = variants[style].Contacto
  return <Contacto />
}
