'use client'

import { Fragment, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RegistrarCompraModal } from '@/components/interno/RegistrarCompraModal'
import { formatPeso, formatFecha } from '@/lib/format'
import { AlertTriangle, Plus, ChevronDown, ChevronRight } from 'lucide-react'

export default function ComprasPage() {
  const { canManageData: canManage } = useAuth()
  const { data } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!canManage) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Acceso denegado</h2>
          <p className="text-gray-600">No tienes permiso para acceder al módulo de compras.</p>
        </div>
      </div>
    )
  }

  const compras = [...data.compras].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compras</h1>
          <p className="text-gray-600">Ingresos de mercadería y compromisos de pago generados</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Registrar compra
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Fecha recepción</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Remito</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Cuotas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No hay compras registradas
                </TableCell>
              </TableRow>
            ) : (
              compras.map(compra => {
                const isExpanded = expanded === compra.id
                const cuotas = compra.compromiso?.cuotas ?? []
                const pendientes = cuotas.filter(c => c.estado === 'pendiente').length

                return (
                  <Fragment key={compra.id}>
                    <TableRow className="cursor-pointer" onClick={() => setExpanded(isExpanded ? null : compra.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </TableCell>
                      <TableCell className="text-sm">{formatFecha(compra.fechaRecepcion)}</TableCell>
                      <TableCell className="font-medium text-sm">{compra.proveedorNombre}</TableCell>
                      <TableCell className="text-sm">{compra.nroRemito}</TableCell>
                      <TableCell className="text-sm text-gray-500">{compra.nroFactura ?? '-'}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatPeso(compra.total)}</TableCell>
                      <TableCell className="text-center">
                        {cuotas.length === 0 ? '-' : pendientes === 0 ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Al día</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">{pendientes} pend.</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-gray-50">
                          <div className="py-2 space-y-3">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Ítems</p>
                              <div className="space-y-1">
                                {compra.items.map(item => (
                                  <div key={item.id} className="flex items-center justify-between text-sm bg-white rounded px-3 py-1.5 border border-gray-100">
                                    <span>{item.productoNombre}{item.calidadNombre ? ` — ${item.calidadNombre}` : ''}</span>
                                    <span className="text-gray-500">{item.cantidad} kg × {formatPeso(item.precioUnitario)} = {formatPeso(item.subtotal)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {cuotas.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Compromiso de pago</p>
                                <div className="space-y-1">
                                  {cuotas.map(c => (
                                    <div key={c.id} className="flex items-center justify-between text-sm bg-white rounded px-3 py-1.5 border border-gray-100">
                                      <span>{formatFecha(c.fecha)} — {c.formaPago}</span>
                                      <span className={c.estado === 'pagado' ? 'text-green-600 font-medium' : 'font-medium'}>
                                        {formatPeso(c.monto)} {c.estado === 'pagado' ? '✓' : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {compra.observaciones && (
                              <p className="text-xs text-gray-500">{compra.observaciones}</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <RegistrarCompraModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
