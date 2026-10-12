'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Printer, AlertTriangle, BadgePercent } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { homePorRol } from '@/lib/permisos'
import { formatPeso } from '@/lib/format'
import { Periodo, periodoMensualActual } from '@/lib/saludFinanciera'
import {
  CostosPorProducto, ModoPeriodo, aplicarCostos, calcularComisiones, clientesCandidatos,
  costosIniciales, margenesPorVenta, periodoValido, totalesComisiones, vendedoresComisionables,
} from '@/lib/comisiones'
import { abrirReporteComisiones } from '@/lib/comisionesPdf'
import { ComisionesFiltros } from '@/components/interno/comisiones/ComisionesFiltros'
import { ClientesSelector } from '@/components/interno/comisiones/ClientesSelector'
import { VentaComisionCard } from '@/components/interno/comisiones/VentaComisionCard'
import { ComisionesResumen } from '@/components/interno/comisiones/ComisionesResumen'
import { cn } from '@/lib/utils'

export default function ComisionesPage() {
  const { usuario, canSeeComisiones } = useAuth()
  const router = useRouter()
  const { data, isLoading } = useData()

  const [vendedorId, setVendedorId] = useState('')
  const [modo, setModo] = useState<ModoPeriodo>('entrega')
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoMensualActual())
  const [clienteIds, setClienteIds] = useState<string[] | null>(null)
  const [costos, setCostos] = useState<CostosPorProducto>({})

  useEffect(() => {
    if (usuario && !canSeeComisiones) router.replace(homePorRol(usuario.rol))
  }, [usuario, canSeeComisiones, router])

  const vendedores = useMemo(() => vendedoresComisionables(data.vendedores), [data.vendedores])

  // Primer vendedor comisionable por defecto, apenas cargan los datos.
  useEffect(() => {
    if (!vendedorId && vendedores.length > 0) setVendedorId(vendedores[0].id)
  }, [vendedorId, vendedores])

  const vendedor = vendedores.find(v => v.id === vendedorId)
  const periodoOk = periodoValido(periodo)

  const candidatos = useMemo(
    () => (periodoOk ? clientesCandidatos(data.ventas, data.clientes, vendedorId, periodo, modo) : []),
    [data.ventas, data.clientes, vendedorId, periodo, modo, periodoOk],
  )

  // Si cambian los candidatos (vendedor/período/modo), se podan los ids que ya no aplican; si la lista
  // vuelve a cubrir a todos, se normaliza a null ("todos") para que un cliente nuevo entre solo.
  useEffect(() => {
    setClienteIds(prev => {
      if (prev === null) return null
      const ids = candidatos.map(c => c.cliente.id)
      const podados = prev.filter(id => ids.includes(id))
      return ids.every(id => podados.includes(id)) ? null : podados
    })
  }, [candidatos])

  function cambiarVendedor(id: string) {
    setVendedorId(id)
    setClienteIds(null)
  }

  const resultado = useMemo(
    () => calcularComisiones(data, { vendedorId, periodo, modo, clienteIds }),
    [data, vendedorId, periodo, modo, clienteIds],
  )

  // Prellenar costos solo para productos nuevos en el resumen; lo tipeado se conserva.
  useEffect(() => {
    setCostos(prev => costosIniciales(resultado.resumen, data.compras, prev))
  }, [resultado.resumen, data.compras])

  const resumenConCosto = useMemo(() => aplicarCostos(resultado.resumen, costos), [resultado.resumen, costos])
  const totales = useMemo(() => totalesComisiones(resultado, resumenConCosto), [resultado, resumenConCosto])
  const margenes = useMemo(() => margenesPorVenta(resultado.ventas, costos), [resultado.ventas, costos])

  if (!usuario || !canSeeComisiones) return null

  const hayVentas = resultado.ventas.length > 0

  function abrirReporte(autoPrint: boolean) {
    if (!vendedor) return
    const nombresPorId = new Map(candidatos.map(c => [c.cliente.id, c.cliente.nombre]))
    abrirReporteComisiones({
      vendedor,
      periodo,
      modo,
      clientesFiltro: clienteIds === null ? null : clienteIds.map(id => nombresPorId.get(id) ?? '').filter(Boolean),
      ventas: resultado.ventas,
      resumen: resumenConCosto,
      totales,
      productos: data.productos,
      margenes,
    }, { autoPrint })
  }

  const neutro = 'bg-white border-[oklch(0.9_0.01_240)] text-[oklch(0.2_0.06_240)]'
  const kpis: { label: string; valor: number; className: string; destacado?: boolean }[] = [
    { label: 'Venta total', valor: totales.ventaTotal, className: neutro },
    { label: modo === 'cobro' ? 'Cobrado en el período' : 'Cobrado', valor: totales.cobrado, className: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'Pendiente de cobro', valor: totales.pendiente, className: 'bg-red-50 border-red-200 text-red-700' },
    { label: 'Costo de adquisición', valor: totales.costoTotal, className: neutro },
    { label: 'Margen total', valor: totales.margenBruto, className: totales.margenBruto < 0 ? 'bg-red-50 border-red-200 text-red-700' : neutro },
    {
      label: 'Margen sobre lo cobrado',
      valor: totales.margenCobrado,
      destacado: true,
      className: totales.margenCobrado < 0
        ? 'bg-red-50 border-red-300 text-red-700'
        : 'bg-[oklch(0.42_0.14_240)] border-transparent text-white',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Comisiones de vendedores</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">Ventas, cobranzas y kilos por producto para liquidar comisiones</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => abrirReporte(true)}
            disabled={!hayVentas}
            className="flex items-center gap-2 border border-[oklch(0.88_0.02_240)] hover:bg-[oklch(0.95_0.01_240)] disabled:opacity-40 disabled:cursor-not-allowed text-[oklch(0.3_0.06_240)] text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            title={hayVentas ? 'Abrir el diálogo de impresión' : 'No hay ventas para imprimir'}
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            type="button"
            onClick={() => abrirReporte(false)}
            disabled={!hayVentas}
            className="flex items-center gap-2 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            title={hayVentas ? 'Previsualizar y guardar como PDF' : 'No hay ventas para descargar'}
          >
            <Download className="w-4 h-4" /> Descargar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-[oklch(0.55_0.04_240)]">Cargando datos…</div>
      ) : vendedores.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 space-y-3">
          <div className="w-14 h-14 bg-[oklch(0.92_0.04_240)] rounded-2xl flex items-center justify-center">
            <BadgePercent className="w-7 h-7 text-[oklch(0.42_0.14_240)]" />
          </div>
          <p className="text-[oklch(0.5_0.04_240)] max-w-sm">No hay vendedores habilitados para comisiones.</p>
        </div>
      ) : (
        <>
          <ComisionesFiltros
            vendedores={vendedores}
            vendedorId={vendedorId}
            onVendedor={cambiarVendedor}
            modo={modo}
            onModo={setModo}
            periodo={periodo}
            onPeriodo={setPeriodo}
            periodoInvalido={!periodoOk}
          />

          <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[oklch(0.3_0.06_240)]">Clientes incluidos</h2>
            <ClientesSelector candidatos={candidatos} seleccionados={clienteIds} onChange={setClienteIds} />
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              {kpis.map(k => (
                <div key={k.label} className={cn('rounded-xl border px-4 py-3', k.className, k.destacado && 'shadow-md')}>
                  <p className="text-xs font-medium opacity-80">{k.label}{k.destacado && ' · a liquidar'}</p>
                  <p className="text-xl font-bold tabular-nums">{formatPeso(k.valor)}</p>
                </div>
              ))}
            </div>
            {hayVentas && (
              <p className="text-xs text-[oklch(0.5_0.04_240)] px-1">
                De lo cobrado ({formatPeso(totales.cobrado)}): <strong className="text-[oklch(0.3_0.06_240)]">{formatPeso(totales.costoCobrado)}</strong> corresponde a costo (KIMAR)
                y <strong className="text-[oklch(0.3_0.06_240)]">{formatPeso(totales.margenCobrado)}</strong> a margen del vendedor.
                Cada venta aporta su margen en la proporción en que fue cobrada.
                {totales.productosSinCosto > 0 && <span className="text-amber-700"> Hay productos sin costo: el margen está sobreestimado.</span>}
              </p>
            )}
          </div>

          {resultado.cobranzasSinVenta.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Hay {resultado.cobranzasSinVenta.length} cobranza{resultado.cobranzasSinVenta.length !== 1 ? 's' : ''} cobrada{resultado.cobranzasSinVenta.length !== 1 ? 's' : ''} en el período sin venta asociada
                ({formatPeso(resultado.cobranzasSinVenta.reduce((s, c) => s + c.monto, 0))}). No se incluyen porque no pueden atribuirse a una venta del vendedor.
              </p>
            </div>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[oklch(0.3_0.06_240)]">
              Ventas incluidas <span className="text-[oklch(0.55_0.04_240)] font-normal">({resultado.ventas.length})</span>
            </h2>
            {!hayVentas ? (
              <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] py-12 text-center text-sm text-[oklch(0.55_0.04_240)]">
                {clienteIds?.length === 0
                  ? 'No hay clientes seleccionados.'
                  : `${vendedor?.nombre ?? 'El vendedor'} no tiene ventas para este período y estos clientes.`}
              </div>
            ) : resultado.ventas.map(item => (
              <VentaComisionCard key={item.venta.id} item={item} modo={modo} vendedor={vendedor!} productos={data.productos} margen={margenes.get(item.venta.id)} />
            ))}
          </section>

          <ComisionesResumen
            resumen={resumenConCosto}
            costos={costos}
            onCosto={(productoId, valor) => setCostos(prev => ({ ...prev, [productoId]: valor }))}
            totales={totales}
          />
        </>
      )}
    </div>
  )
}
