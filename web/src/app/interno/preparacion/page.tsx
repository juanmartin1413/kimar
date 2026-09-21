'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { addDaysIso, formatFecha, today } from '@/lib/format'
import { estadoEntregaConfig, parseApiError } from '@/lib/entregas'
import { RepartidorLite, VentaPreparacion } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MarcarListoDialog } from '@/components/interno/entregas/MarcarListoDialog'
import { AlertTriangle, Bike, Loader2, PackageCheck, RefreshCw, ScrollText, Undo2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// Vista del depósito sobre las ventas confirmadas: qué preparar y para cuándo.
// Deliberadamente sin precios, totales ni cobranzas (el endpoint tampoco los devuelve).
// Desde acá el depósito marca cada pedido como "Listo para entrega" (con repartidor opcional).

type Periodo = 'hoy' | 'manana' | 'semana'
type Vista = 'entregas' | 'productos'

const DIAS_SEMANA = 6 // hoy + 6 = 7 días

const cantidadFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

function formatCantidad(cantidad: number, unidad: string): string {
  return `${cantidadFmt.format(cantidad)} ${unidad === 'unidad' ? 'u.' : 'kg'}`
}

function nombreDia(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const nombre = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(new Date(y, m - 1, d))
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

interface ResumenProducto {
  key: string
  productoNombre: string
  calidadNombre?: string
  unidad: string
  total: number
  entregas: number
}

export default function PreparacionPage() {
  const { canVerPreparacion, canGestionarEntrega } = useAuth()
  const [ventas, setVentas] = useState<VentaPreparacion[]>([])
  const [repartidores, setRepartidores] = useState<RepartidorLite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [vista, setVista] = useState<Vista>('entregas')
  const [ventaDialogo, setVentaDialogo] = useState<VentaPreparacion | null>(null)
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null)
  const [erroresPorVenta, setErroresPorVenta] = useState<Record<string, string>>({})

  const hoy = today()
  const manana = addDaysIso(hoy, 1)
  const finSemana = addDaysIso(hoy, DIAS_SEMANA)

  const cargar = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const rows = await api.get<VentaPreparacion[]>(`/api/ventas/preparacion?desde=${hoy}&hasta=${finSemana}`)
      setVentas(rows)
    } catch {
      setError('No se pudieron cargar los pedidos a preparar.')
    } finally {
      setIsLoading(false)
    }
  }, [hoy, finSemana])

  useEffect(() => {
    if (canVerPreparacion) cargar()
  }, [canVerPreparacion, cargar])

  useEffect(() => {
    if (!canGestionarEntrega) return
    api.get<RepartidorLite[]>('/api/entregas/repartidores').then(setRepartidores).catch(() => setRepartidores([]))
  }, [canGestionarEntrega])

  const porPeriodo = useMemo(() => ({
    hoy: ventas.filter(v => v.fechaEntrega === hoy),
    manana: ventas.filter(v => v.fechaEntrega === manana),
    semana: ventas,
  }), [ventas, hoy, manana])

  const visibles = porPeriodo[periodo]

  // Agrupación por fecha para la vista semanal (en "hoy"/"mañana" hay una sola fecha).
  const gruposPorFecha = useMemo(() => {
    const map = new Map<string, VentaPreparacion[]>()
    for (const v of visibles) {
      const lista = map.get(v.fechaEntrega) ?? []
      lista.push(v)
      map.set(v.fechaEntrega, lista)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [visibles])

  // Total a preparar por producto/calidad: permite sacar una vez por lote en vez de ir venta por venta.
  // Lo ya entregado no cuenta: no hay nada que preparar.
  const resumenProductos = useMemo<ResumenProducto[]>(() => {
    const map = new Map<string, ResumenProducto>()
    for (const v of visibles) {
      if (v.estadoEntrega === 'entregado') continue
      for (const it of v.items) {
        const key = `${it.productoId}:${it.calidadId ?? 'base'}`
        const actual = map.get(key)
        if (actual) {
          actual.total += it.cantidad
          actual.entregas += 1
        } else {
          map.set(key, {
            key,
            productoNombre: it.productoNombre,
            calidadNombre: it.calidadNombre,
            unidad: it.unidad,
            total: it.cantidad,
            entregas: 1,
          })
        }
      }
    }
    return [...map.values()].sort((a, b) =>
      a.productoNombre.localeCompare(b.productoNombre) || (a.calidadNombre ?? '').localeCompare(b.calidadNombre ?? '')
    )
  }, [visibles])

  async function volverAPreparacion(v: VentaPreparacion) {
    if (!window.confirm(`¿Volver "${v.clienteNombre}" a preparación? Se quitará la asignación de repartidor.`)) return
    setAccionEnCurso(v.id)
    setErroresPorVenta(p => ({ ...p, [v.id]: '' }))
    try {
      await api.post(`/api/entregas/${v.id}/volver-a-preparacion`)
      await cargar()
    } catch (e) {
      setErroresPorVenta(p => ({ ...p, [v.id]: parseApiError(e) }))
    } finally {
      setAccionEnCurso(null)
    }
  }

  if (!canVerPreparacion) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Acceso denegado</h2>
          <p className="text-gray-600">No tienes permiso para acceder a los pedidos a preparar.</p>
        </div>
      </div>
    )
  }

  const tituloPeriodo = periodo === 'hoy'
    ? `Hoy · ${nombreDia(hoy)} ${formatFecha(hoy)}`
    : periodo === 'manana'
    ? `Mañana · ${nombreDia(manana)} ${formatFecha(manana)}`
    : `Del ${formatFecha(hoy)} al ${formatFecha(finSemana)}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pedidos a preparar</h1>
          <p className="text-gray-600 text-sm md:text-base">Mercadería a preparar según fecha de entrega</p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={isLoading} className="gap-2">
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
          <TabsList>
            <TabsTrigger value="hoy">Para hoy ({porPeriodo.hoy.length})</TabsTrigger>
            <TabsTrigger value="manana">Para mañana ({porPeriodo.manana.length})</TabsTrigger>
            <TabsTrigger value="semana">Toda la semana ({porPeriodo.semana.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-1">
          <Button size="sm" variant={vista === 'entregas' ? 'default' : 'outline'} onClick={() => setVista('entregas')}>
            Por entrega
          </Button>
          <Button size="sm" variant={vista === 'productos' ? 'default' : 'outline'} onClick={() => setVista('productos')}>
            Por producto
          </Button>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-700">{tituloPeriodo}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Cargando…</p>
      ) : visibles.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">
          <PackageCheck className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          No hay entregas programadas para este período.
        </Card>
      ) : vista === 'productos' ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Calidad</TableHead>
                <TableHead className="text-right">Total a preparar</TableHead>
                <TableHead className="text-right">Entregas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumenProductos.map(r => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.productoNombre}</TableCell>
                  <TableCell>
                    {r.calidadNombre ? <Badge variant="outline">{r.calidadNombre}</Badge> : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCantidad(r.total, r.unidad)}</TableCell>
                  <TableCell className="text-right text-gray-600">{r.entregas}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="space-y-6">
          {gruposPorFecha.map(([fecha, lista]) => (
            <section key={fecha} className="space-y-3">
              {periodo === 'semana' && (
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {nombreDia(fecha)} {formatFecha(fecha)} · {lista.length} {lista.length === 1 ? 'entrega' : 'entregas'}
                </h2>
              )}
              {lista.map(v => {
                const estado = estadoEntregaConfig[v.estadoEntrega]
                const ocupada = accionEnCurso === v.id
                return (
                  <Card key={v.id} className="overflow-hidden">
                    <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 border-b bg-gray-50">
                      <div>
                        <p className="font-semibold text-[oklch(0.2_0.06_240)]">{v.clienteNombre}</p>
                        <p className="text-xs text-gray-500 flex flex-wrap items-center gap-1">
                          <User className="w-3 h-3" /> {v.vendedorNombre}
                          {v.nroRemito && (
                            <>
                              <span className="mx-1">·</span>
                              <ScrollText className="w-3 h-3" /> Remito {v.nroRemito}
                            </>
                          )}
                          {v.repartidorNombre && (
                            <>
                              <span className="mx-1">·</span>
                              <Bike className="w-3 h-3" /> {v.repartidorNombre}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', estado.className)}>{estado.label}</span>
                        <Badge variant="secondary">{formatFecha(v.fechaEntrega)}</Badge>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Calidad</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {v.items.map((it, i) => (
                          <TableRow key={`${v.id}-${i}`}>
                            <TableCell className="font-medium">
                              {it.productoNombre}
                              {it.descripcion && it.descripcion !== it.productoNombre && (
                                <span className="block text-xs font-normal text-gray-500">{it.descripcion}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {it.calidadNombre ? <Badge variant="outline">{it.calidadNombre}</Badge> : <span className="text-gray-400">—</span>}
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatCantidad(it.cantidad, it.unidad)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {v.observaciones && (
                      <p className="px-4 py-2 text-xs text-gray-600 border-t bg-amber-50">
                        <span className="font-semibold">Obs.:</span> {v.observaciones}
                      </p>
                    )}
                    {canGestionarEntrega && v.estadoEntrega !== 'entregado' && (
                      <div className="px-4 py-3 border-t flex flex-wrap items-center gap-2">
                        {v.estadoEntrega === 'pendiente' ? (
                          <Button className="gap-2 h-10" onClick={() => setVentaDialogo(v)} disabled={ocupada}>
                            <PackageCheck className="w-4 h-4" /> Listo para entrega
                          </Button>
                        ) : (
                          <>
                            <Button variant="outline" className="gap-2 h-10" onClick={() => setVentaDialogo(v)} disabled={ocupada}>
                              <Bike className="w-4 h-4" /> {v.repartidorId ? 'Cambiar repartidor' : 'Asignar repartidor'}
                            </Button>
                            <Button variant="ghost" className="gap-2 h-10 text-gray-600" onClick={() => volverAPreparacion(v)} disabled={ocupada}>
                              {ocupada ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />} Volver a preparación
                            </Button>
                          </>
                        )}
                        {erroresPorVenta[v.id] && <p className="text-sm text-red-600 w-full">{erroresPorVenta[v.id]}</p>}
                      </div>
                    )}
                  </Card>
                )
              })}
            </section>
          ))}
        </div>
      )}

      <MarcarListoDialog
        venta={ventaDialogo}
        repartidores={repartidores}
        onClose={() => setVentaDialogo(null)}
        onDone={() => { setVentaDialogo(null); cargar() }}
      />
    </div>
  )
}
