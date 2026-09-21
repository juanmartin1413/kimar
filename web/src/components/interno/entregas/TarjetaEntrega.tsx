'use client'

import { VentaEntrega } from '@/lib/types'
import { formatFecha } from '@/lib/format'
import { direccionCliente, estadoEntregaConfig, formatFechaHora, mapsUrl, TIPO_REMITO_FIRMADO } from '@/lib/entregas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DocumentoSlot } from '@/components/interno/entregas/DocumentoSlot'
import { Bike, Loader2, MapPin, Phone, ScrollText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const cantidadFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

function formatCantidad(cantidad: number, unidad: string): string {
  return `${cantidadFmt.format(cantidad)} ${unidad === 'unidad' ? 'u.' : 'kg'}`
}

// Tarjeta de un pedido en "Pedidos a entregar". Pensada para el celular del repartidor:
// dirección y teléfonos son links (Maps / llamar), botones altos, ítems en lista.
export function TarjetaEntrega({ venta, usuarioId, esGestion, esRepartidor, ocupada, error, onTomar, onSoltar, onDocumentoSubido }: {
  venta: VentaEntrega
  usuarioId?: string
  esGestion: boolean
  esRepartidor: boolean
  ocupada: boolean
  error?: string
  onTomar: () => void
  onSoltar: () => void
  onDocumentoSubido: () => void
}) {
  const esMia = !!usuarioId && venta.repartidorId === usuarioId
  const sinAsignar = !venta.repartidorId
  const listo = venta.estadoEntrega === 'listo'
  const entregado = venta.estadoEntrega === 'entregado'
  const puedeDocumentar = listo && (esMia || esGestion)
  const estado = estadoEntregaConfig[venta.estadoEntrega]
  const direccion = direccionCliente(venta)
  const telefonos = [venta.telefono1, venta.telefono2].filter((t): t is string => !!t)
  const remitoFirmado = venta.documentos.find(d => d.tipo === TIPO_REMITO_FIRMADO)

  return (
    <Card className={cn('overflow-hidden', entregado && 'opacity-90')}>
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 border-b bg-gray-50">
        <div className="min-w-0">
          <p className="font-semibold text-lg leading-tight text-[oklch(0.2_0.06_240)]">{venta.clienteNombre}</p>
          <p className="text-xs text-gray-500 flex flex-wrap items-center gap-1 mt-0.5">
            <User className="w-3 h-3" /> {venta.vendedorNombre}
            {venta.nroRemito && (
              <>
                <span className="mx-1">·</span>
                <ScrollText className="w-3 h-3" /> Remito {venta.nroRemito}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <Badge variant="secondary">{formatFecha(venta.fechaEntrega)}</Badge>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', estado.className)}>{estado.label}</span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {(esGestion || entregado) && venta.repartidorNombre && (
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Bike className="w-4 h-4 text-gray-400" /> Repartidor: <span className="font-medium">{venta.repartidorNombre}</span>
          </p>
        )}

        {direccion ? (
          <a
            href={mapsUrl(direccion)}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-2 text-base text-[oklch(0.42_0.14_240)] hover:underline"
          >
            <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{direccion}</span>
          </a>
        ) : (
          <p className="text-sm text-gray-400 flex items-center gap-2"><MapPin className="w-4 h-4" /> Sin dirección cargada</p>
        )}

        {telefonos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {telefonos.map(t => (
              <a
                key={t}
                href={`tel:${t.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Phone className="w-4 h-4" /> {t}
              </a>
            ))}
          </div>
        )}

        <ul className="divide-y rounded-lg border">
          {venta.items.map((it, i) => (
            <li key={`${venta.id}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="font-medium text-sm">{it.productoNombre}</p>
                {it.descripcion && it.descripcion !== it.productoNombre && (
                  <p className="text-xs text-gray-500">{it.descripcion}</p>
                )}
                {it.calidadNombre && <Badge variant="outline" className="mt-1">{it.calidadNombre}</Badge>}
              </div>
              <span className="font-semibold text-sm whitespace-nowrap">{formatCantidad(it.cantidad, it.unidad)}</span>
            </li>
          ))}
        </ul>

        {venta.observaciones && (
          <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <span className="font-semibold">Obs.:</span> {venta.observaciones}
          </p>
        )}

        {entregado && (
          <div className="space-y-2">
            <p className="text-sm text-green-700 font-medium">
              Entregado{venta.fechaEntregado ? ` el ${formatFechaHora(venta.fechaEntregado)}` : ''}
            </p>
            {remitoFirmado && (
              <DocumentoSlot ventaId={venta.id} tipo={TIPO_REMITO_FIRMADO} existente={remitoFirmado} puedeSubir={false} onSubido={onDocumentoSubido} />
            )}
          </div>
        )}

        {puedeDocumentar && (
          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Documentación</p>
            <DocumentoSlot
              ventaId={venta.id}
              tipo={TIPO_REMITO_FIRMADO}
              existente={remitoFirmado}
              puedeSubir
              onSubido={onDocumentoSubido}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {listo && (
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {sinAsignar && esRepartidor && (
              <Button className="h-11 w-full sm:w-auto text-base" onClick={onTomar} disabled={ocupada}>
                {ocupada ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bike className="w-4 h-4" />}
                Tomar pedido
              </Button>
            )}
            {(esMia || (esGestion && !sinAsignar)) && (
              <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={onSoltar} disabled={ocupada}>
                {ocupada && <Loader2 className="w-4 h-4 animate-spin" />}
                Soltar pedido
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
