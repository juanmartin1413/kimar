'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { seedData } from '@/lib/seed'
import type { CategoriaProducto } from '@/lib/types'
import { buildFlyerHTML } from './flyer'
import { categoriaOrden } from './content'

export type ProductoPublico = (typeof seedData.productos)[number]

/**
 * Lista de precios pública: arranca con el seed ordenado y lo reemplaza por la API
 * cuando responde. Expone también la descarga del flyer imprimible.
 */
export function useProductos() {
  const [productos, setProductos] = useState<ProductoPublico[]>(
    [...seedData.productos].sort((a, b) => a.orden - b.orden),
  )

  useEffect(() => {
    fetch(`${process.env.API_URL}/api/productos?activo=true`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: ProductoPublico[]) => setProductos([...data].sort((a, b) => a.orden - b.orden)))
      .catch(() => {})
  }, [])

  const activos = useMemo(() => productos.filter(p => p.activo), [productos])

  /** Productos activos agrupados por categoría, en el orden canónico y sin categorías vacías. */
  const porCategoria = useMemo(() => {
    const grupos = new Map<CategoriaProducto, ProductoPublico[]>()
    for (const cat of categoriaOrden) grupos.set(cat, [])
    for (const p of activos) {
      const cat = (p.categoria as CategoriaProducto) ?? 'otros'
      if (!grupos.has(cat)) grupos.set(cat, [])
      grupos.get(cat)!.push(p)
    }
    return [...grupos.entries()]
      .filter(([, items]) => items.length > 0)
      .map(([categoria, items]) => ({ categoria, items }))
  }, [activos])

  const descargarLista = useCallback(() => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const logoUrl = `${window.location.origin}/logoLangoBackground.png`
    const html = buildFlyerHTML(activos, logoUrl, dateStr)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }, [activos])

  return { productos, activos, porCategoria, descargarLista }
}

export function precioLabel(p: ProductoPublico): string {
  return p.unidad === 'unidad' ? '/u' : '/kg'
}
