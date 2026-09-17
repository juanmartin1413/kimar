import type { ComponentType } from 'react'
import type { StyleVariant } from '@/contexts/ThemeContext'
import * as clasico from './clasico'
import * as editorial from './editorial'
import * as moderno from './moderno'

export type StyleComponents = {
  Nav: ComponentType
  Footer: ComponentType
  Home: ComponentType
  Productos: ComponentType
  Contacto: ComponentType
}

/** Registro de variantes visuales del sitio público. Las páginas eligen según useTheme().style. */
export const variants: Record<StyleVariant, StyleComponents> = {
  clasico,
  editorial,
  moderno,
}
