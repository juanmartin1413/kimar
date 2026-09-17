import type { Metadata } from 'next'
import { Geist, Manrope, Playfair_Display } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

// Fuentes de los estilos alternativos del sitio público. preload:false → sólo se
// descargan cuando algún elemento las usa (no impactan a /interno).
const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display-serif',
  display: 'swap',
  preload: false,
})
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans-modern',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'KIMAR Mariscos Premium',
  description: 'Más de 15 años distribuyendo los mejores mariscos de Argentina.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

// Corre antes del primer paint: aplica paleta/estilo guardados en localStorage
// para que no haya flash de tema equivocado. Las claves deben coincidir con
// THEME_STORAGE_KEYS en contexts/ThemeContext.tsx.
const themeInitScript = `(function(){try{var d=document.documentElement;var p=localStorage.getItem('kimar-palette');var s=localStorage.getItem('kimar-style');p=(p==='kimar')?'kimar':'default';s=(s==='editorial'||s==='moderno')?s:'clasico';d.setAttribute('data-palette',p);d.setAttribute('data-style',s);d.classList.add('js');if(s!=='clasico'){d.classList.add('pub-pending');}}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      data-palette="default"
      data-style="clasico"
      suppressHydrationWarning
      className={`${geist.variable} ${playfair.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
