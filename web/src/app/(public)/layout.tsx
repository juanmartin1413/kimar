'use client'

import PresentationSwitcher from '@/components/public/PresentationSwitcher'
import { variants } from '@/components/public/styles'
import { useTheme } from '@/contexts/ThemeContext'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { style } = useTheme()
  const V = variants[style]

  return (
    <div className="pub-shell flex flex-col min-h-screen font-pub-body">
      <V.Nav />
      <main className="flex-1">{children}</main>
      <V.Footer />
      <PresentationSwitcher />
    </div>
  )
}
