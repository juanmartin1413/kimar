'use client'

import { variants } from '@/components/public/styles'
import { useTheme } from '@/contexts/ThemeContext'

export default function HomePage() {
  const { style } = useTheme()
  const Home = variants[style].Home
  return <Home />
}
