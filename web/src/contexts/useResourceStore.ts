'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import type { AppData, Rol, Producto, Proveedor, Calidad, CompromisoProveedor, FormaPagoProveedor, StockPorProducto } from '@/lib/types'
import { Resource, ResourceStates, resourceRoles } from '@/lib/dataResources'

const paths: Partial<Record<Resource, string>> = { clientes: '/api/clientes', productos: '/api/productos', vendedores: '/api/vendedores',
  pedidos: '/api/pedidos', ventas: '/api/ventas', cobranzas: '/api/cobranzas', usuarios: '/api/usuarios', proveedores: '/api/proveedores',
  gastosFijos: '/api/gastos', instanciasGasto: '/api/gastos/instancias', movimientosStock: '/api/stock/movimientos', compras: '/api/compras' }

export function useResourceStore(empty: AppData, rol?: Rol) {
  const [data, setData] = useState(empty)
  const [resourceStates, setStates] = useState<ResourceStates>({})
  const sequences = useRef<Partial<Record<Resource, number>>>({})
  const controllers = useRef<Partial<Record<Resource, AbortController>>>({})
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    const requests = controllers.current
    return () => { alive.current = false; Object.values(requests).forEach(c => c.abort()) }
  }, [])

  const reloadResource = useCallback(async (key: Resource) => {
    if (!rol || !resourceRoles[key]?.includes(rol)) return
    const sequence = (sequences.current[key] || 0) + 1; sequences.current[key] = sequence
    controllers.current[key]?.abort()
    const abort = new AbortController(); controllers.current[key] = abort
    const read = <T,>(url: string) => api.get<T>(url, abort.signal)
    setStates(old => ({ ...old, [key]: { status: 'loading', loaded: old[key]?.loaded || false } }))
    try {
      let value: AppData[Resource]
      if (key === 'calidades') {
        const products = await read<Producto[]>('/api/productos')
        value = (await Promise.all(products.map(p => read<Calidad[]>(`/api/productos/${p.id}/calidades`)))).flat()
      } else if (key === 'compromisosProveedor' || key === 'formasPagoProveedor') {
        const providers = await read<Proveedor[]>('/api/proveedores')
        value = key === 'compromisosProveedor'
          ? (await Promise.all(providers.map(p => read<CompromisoProveedor[]>(`/api/proveedores/${p.id}/compromisos`)))).flat()
          : (await Promise.all(providers.map(p => read<FormaPagoProveedor[]>(`/api/proveedores/${p.id}/forma-pago`)))).flat()
      } else if (key === 'stockPorProducto') {
        const rows = await read<StockPorProducto[]>('/api/stock/actual')
        value = rows.map(d => ({ ...d, id: `${d.productoId}:${d.calidadId ?? 'base'}`, calidadId: d.calidadId ?? undefined }))
      } else {
        value = await read<AppData[Resource]>(paths[key]!)
      }
      if (!alive.current || sequence !== sequences.current[key]) return
      setData(old => ({ ...old, [key]: value }))
      setStates(old => ({ ...old, [key]: { status: 'loaded', loaded: true } }))
    } catch (e) {
      if (!alive.current || sequence !== sequences.current[key]) return
      setStates(old => ({ ...old, [key]: { status: 'error', loaded: old[key]?.loaded || false,
        error: e instanceof Error ? e.message : 'No se pudo cargar la información.' } }))
    }
  }, [rol])
  const loadAll = useCallback(async () => {
    await Promise.all(Object.keys(resourceRoles).map(key => reloadResource(key as Resource)))
  }, [reloadResource])
  useEffect(() => { void loadAll() }, [loadAll])
  const isLoading = Object.entries(resourceRoles).some(([key, roles]) => rol && roles.includes(rol) &&
    !resourceStates[key as Resource]?.loaded && resourceStates[key as Resource]?.status !== 'error')
  return { data, setData, resourceStates, reloadResource, loadAll, isLoading }
}
