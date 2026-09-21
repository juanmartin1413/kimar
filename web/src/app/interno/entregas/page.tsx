'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { addDaysIso, formatFecha, today } from '@/lib/format'
import { parseApiError } from '@/lib/entregas'
import { VentaEntrega } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TarjetaEntrega } from '@/components/interno/entregas/TarjetaEntrega'
import { AlertTriangle, Bike, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// "Pedidos a entregar": los pedidos que el depósito marcó como listos, para que el repartidor
// los entregue y suba el remito firmado. Mismos períodos que "Pedidos a preparar".
// El repartidor ve los suyos y los sin asignar (el backend ya filtra); gestión ve todos.

type Periodo = 'hoy' | 'manana' | 'semana'

const DIAS_SEMANA = 6 // hoy + 6 = 7 días

function nombreDia(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const nombre = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(new Date(y, m - 1, d))
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

export default function EntregasPage() {
  const { usuario, canVerEntregas, canManageData, isRepartidor } = useAuth()
  const [ventas, setVentas] = useState<VentaEntrega[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null)
  const [erroresPorVenta, setErroresPorVenta] = useState<Record<string, string>>({})

  const hoy = today()
  const manana = addDaysIso(hoy, 1)
  const finSemana = addDaysIso(hoy, DIAS_SEMANA)

  const cargar = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const rows = await api.get<VentaEntrega[]>(`/api/entregas?desde=${hoy}&hasta=${finSemana}`)
      setVentas(rows)
    } catch {
      setError('No se pudieron cargar los pedidos a entregar.')
    } finally {
      setIsLoading(false)
    }
  }, [hoy, finSemana])

  useEffect(() => {
    if (canVerEntregas) cargar()
  }, [canVerEntregas, cargar])

  // Pedidos listos de días anteriores que no se entregaron: el backend los sigue devolviendo
  // para que no desaparezcan; se muestran aparte, arriba de "Para hoy".
  const atrasados = useMemo(() => ventas.filter(v => v.fechaEntrega < hoy), [ventas, hoy])

  const porPeriodo = useMemo(() => ({
    hoy: ventas.filter(v => v.fechaEntrega === hoy),
    manana: ventas.filter(v => v.fechaEntrega === manana),
    semana: ventas.filter(v => v.fechaEntrega >= hoy),
  }), [ventas, hoy, manana])

  const visibles = useMemo(
    () => (periodo === 'hoy' ? [...atrasados, ...porPeriodo.hoy] : porPeriodo[periodo]),
    [periodo, atrasados, porPeriodo]
  )

  // Tres grupos: los míos, los que nadie tomó y (solo gestión) los de otros repartidores.
  const grupos = useMemo(() => {
    const mios = visibles.filter(v => v.repartidorId && v.repartidorId === usuario?.id)
    const sinAsignar = visibles.filter(v => !v.repartidorId)
    const deOtros = visibles.filter(v => v.repartidorId && v.repartidorId !== usuario?.id)
    return { mios, sinAsignar, deOtros }
  }, [visibles, usuario?.id])

  async function ejecutar(ventaId: string, accion: 'tomar' | 'soltar') {
    setAccionEnCurso(ventaId)
    setErroresPorVenta(p => ({ ...p, [ventaId]: '' }))
    try {
      await api.post(`/api/entregas/${ventaId}/${accion}`)
      await cargar()
    } catch (e) {
      setErroresPorVenta(p => ({ ...p, [ventaId]: parseApiError(e) }))
    } finally {
      setAccionEnCurso(null)
    }
  }

  if (!canVerEntregas) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Acceso denegado</h2>
          <p className="text-gray-600">No tienes permiso para acceder a los pedidos a entregar.</p>
        </div>
      </div>
    )
  }

  const tituloPeriodo = periodo === 'hoy'
    ? `Hoy · ${nombreDia(hoy)} ${formatFecha(hoy)}`
    : periodo === 'manana'
    ? `Mañana · ${nombreDia(manana)} ${formatFecha(manana)}`
    : `Del ${formatFecha(hoy)} al ${formatFecha(finSemana)}`

  function renderLista(lista: VentaEntrega[]) {
    // En "semana" se agrupa por fecha; en "hoy" los atrasados van primero con su propio título.
    const porFecha = new Map<string, VentaEntrega[]>()
    for (const v of lista) porFecha.set(v.fechaEntrega, [...(porFecha.get(v.fechaEntrega) ?? []), v])
    const fechas = [...porFecha.keys()].sort()

    return fechas.map(fecha => (
      <div key={fecha} className="space-y-3">
        {(periodo === 'semana' || fecha < hoy) && (
          <h3 className={cn('text-xs font-semibold uppercase tracking-wide', fecha < hoy ? 'text-red-600' : 'text-gray-500')}>
            {fecha < hoy ? 'Atrasado · ' : ''}{nombreDia(fecha)} {formatFecha(fecha)}
          </h3>
        )}
        {porFecha.get(fecha)!.map(v => (
          <TarjetaEntrega
            key={v.id}
            venta={v}
            usuarioId={usuario?.id}
            esGestion={canManageData}
            esRepartidor={isRepartidor}
            ocupada={accionEnCurso === v.id}
            error={erroresPorVenta[v.id]}
            onTomar={() => ejecutar(v.id, 'tomar')}
            onSoltar={() => ejecutar(v.id, 'soltar')}
            onDocumentoSubido={cargar}
          />
        ))}
      </div>
    ))
  }

  function renderGrupo(titulo: string, lista: VentaEntrega[]) {
    if (lista.length === 0) return null
    return (
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[oklch(0.25_0.06_240)]">{titulo} ({lista.length})</h2>
        {renderLista(lista)}
      </section>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pedidos a entregar</h1>
          <p className="text-gray-600 text-sm md:text-base">Pedidos listos para repartir y constancias de entrega</p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={isLoading} className="gap-2 h-10">
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      <Tabs value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="hoy" className="flex-1 sm:flex-none">Para hoy ({atrasados.length + porPeriodo.hoy.length})</TabsTrigger>
          <TabsTrigger value="manana" className="flex-1 sm:flex-none">Para mañana ({porPeriodo.manana.length})</TabsTrigger>
          <TabsTrigger value="semana" className="flex-1 sm:flex-none">Toda la semana ({porPeriodo.semana.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <p className="text-sm font-medium text-gray-700">{tituloPeriodo}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Cargando…</p>
      ) : visibles.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">
          <Bike className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          No hay pedidos listos para entregar en este período.
        </Card>
      ) : (
        <div className="space-y-8">
          {renderGrupo(isRepartidor ? 'Mis pedidos' : 'Mis pedidos', grupos.mios)}
          {renderGrupo('Sin asignar', grupos.sinAsignar)}
          {canManageData && renderGrupo('Otros repartidores', grupos.deOtros)}
        </div>
      )}
    </div>
  )
}
