'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RegistrarEntradaModal } from '@/components/interno/RegistrarEntradaModal'
import { AjusteManualModal } from '@/components/interno/AjusteManualModal'
import { StockMinimForm } from '@/components/interno/StockMinimForm'
import { AlertTriangle, Plus } from 'lucide-react'

interface AuditoriaRow {
  productoId: string
  nombre: string
  calidadId?: string
  calidadNombre?: string
  stockTeorico: number
  stockFisico?: number
  discrepancia?: number
  estado: 'SIN_CONTEO' | 'OK' | 'SOBRANTE' | 'FALTANTE'
  ultimoConteo?: string
}

export default function StockPage() {
  const { canManageData: canManage } = useAuth()
  const { data: appData, addStockRealRegistrado } = useData()
  const { usuario } = useAuth()
  const [registrarEntradaOpen, setRegistrarEntradaOpen] = useState(false)
  const [ajusteManualOpen, setAjusteManualOpen] = useState(false)
  const [stockRealModalOpen, setStockRealModalOpen] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [calidadSeleccionada, setCalidadSeleccionada] = useState<string | undefined>(undefined)
  const [cantidadReal, setCantidadReal] = useState('')
  const [auditoria, setAuditoria] = useState<AuditoriaRow[]>([])

  const cargarAuditoria = useCallback(async () => {
    const rows = await api.get<AuditoriaRow[]>('/api/stock/auditoria').catch(() => null)
    if (rows) setAuditoria(rows)
  }, [])

  useEffect(() => {
    if (canManage) cargarAuditoria()
  }, [canManage, cargarAuditoria])

  if (!canManage) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Acceso denegado</h2>
          <p className="text-gray-600">No tienes permiso para acceder al módulo de stock.</p>
        </div>
      </div>
    )
  }

  const handleRegistrarStockReal = async () => {
    if (!productoSeleccionado || !cantidadReal || !usuario?.id) return

    await addStockRealRegistrado({
      productoId: productoSeleccionado,
      calidadId: calidadSeleccionada,
      cantidad: parseFloat(cantidadReal),
      fecha: new Date().toISOString().split('T')[0],
      usuarioId: usuario.id,
      observaciones: 'Conteo físico',
    })
    await cargarAuditoria()

    setProductoSeleccionado('')
    setCalidadSeleccionada(undefined)
    setCantidadReal('')
    setStockRealModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock</h1>
          <p className="text-gray-600">Gestión de inventario y movimientos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setRegistrarEntradaOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Registrar Entrada
          </Button>
          <Button onClick={() => setAjusteManualOpen(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Ajuste Manual
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inventario" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventario">Inventario Actual</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
        </TabsList>

        {/* TAB 1: Inventario Actual */}
        <TabsContent value="inventario" className="space-y-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Stock Mínimo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appData.stockPorProducto.map(stock => {
                  const producto = appData.productos.find(p => p.id === stock.productoId)
                  if (!producto?.activo) return null
                  const stockActual = stock.cantidad
                  const stockMinimo = stock.stockMinimo
                  const bajo = stockActual < stockMinimo
                  const vacio = stockActual === 0

                  return (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">
                        {producto.nombre}
                        {stock.calidadNombre && (
                          <span className="block text-xs font-normal text-gray-500">{stock.calidadNombre}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={vacio ? 'text-red-600 font-bold' : bajo ? 'text-orange-600 font-bold' : ''}>
                          {stockActual.toFixed(2)} kg
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <StockMinimForm productoId={stock.productoId} calidadId={stock.calidadId} initialValue={stockMinimo} />
                      </TableCell>
                      <TableCell className="text-center">
                        {vacio && <Badge variant="destructive">SIN STOCK</Badge>}
                        {bajo && !vacio && <Badge variant="secondary" className="bg-orange-100 text-orange-800">BAJO</Badge>}
                        {!bajo && !vacio && <Badge variant="outline" className="bg-green-100 text-green-800">NORMAL</Badge>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB 2: Movimientos (Historial Completo) */}
        <TabsContent value="movimientos" className="space-y-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Compra</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appData.movimientosStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No hay movimientos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  appData.movimientosStock.map(mov => {
                    const producto = appData.productos.find(p => p.id === mov.productoId)
                    const proveedor = mov.proveedorId ? appData.proveedores.find(p => p.id === mov.proveedorId) : null
                    const usuario = appData.usuarios.find(u => u.id === mov.usuarioId)
                    const compra = mov.compraId ? appData.compras.find(c => c.id === mov.compraId) : null

                    return (
                      <TableRow key={mov.id}>
                        <TableCell className="text-sm">{mov.fecha}</TableCell>
                        <TableCell className="font-medium text-sm">{producto?.nombre}</TableCell>
                        <TableCell className="text-sm text-gray-600">{mov.calidadNombre ?? '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={mov.tipo === 'entrada' ? 'default' : 'destructive'}>
                            {mov.tipo === 'entrada' ? 'ENTRADA' : 'SALIDA'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{mov.cantidad.toFixed(2)} kg</TableCell>
                        <TableCell className="text-sm">{mov.motivo}</TableCell>
                        <TableCell className="text-sm">{proveedor?.nombre ?? '-'}</TableCell>
                        <TableCell className="text-sm">
                          {compra ? (
                            <Link href="/interno/compras" className="text-blue-600 hover:underline">
                              {compra.nroRemito}
                            </Link>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{usuario?.nombre ?? '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{mov.observaciones ?? '-'}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB 3: Auditoría (Stock Teórico vs Real) */}
        <TabsContent value="auditoria" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Stock Teórico:</strong> Calculado a partir de movimientos (entradas - salidas)<br/>
              <strong>Stock Real:</strong> Registrado en auditorías físicas
            </p>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Stock Teórico</TableHead>
                  <TableHead className="text-right">Stock Real (Último)</TableHead>
                  <TableHead className="text-right">Desajuste</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditoria.map(row => (
                  <TableRow key={`${row.productoId}:${row.calidadId ?? 'base'}`}>
                    <TableCell className="font-medium">
                      {row.nombre}
                      {row.calidadNombre && (
                        <span className="block text-xs font-normal text-gray-500">{row.calidadNombre}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{row.stockTeorico.toFixed(2)} kg</TableCell>
                    <TableCell className="text-right">
                      {row.stockFisico != null ? `${row.stockFisico.toFixed(2)} kg` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${row.estado === 'SOBRANTE' ? 'text-amber-600' : row.estado === 'FALTANTE' ? 'text-red-600' : 'text-green-600'}`}>
                      {row.discrepancia != null ? `${row.discrepancia > 0 ? '+' : ''}${row.discrepancia.toFixed(2)} kg` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.estado === 'SIN_CONTEO' && <Badge variant="outline" className="bg-yellow-100 text-yellow-800">SIN CONTEO</Badge>}
                      {row.estado === 'OK' && <Badge variant="outline" className="bg-green-100 text-green-800">OK</Badge>}
                      {row.estado === 'SOBRANTE' && <Badge variant="outline" className="bg-amber-100 text-amber-800">SOBRANTE</Badge>}
                      {row.estado === 'FALTANTE' && <Badge variant="destructive">FALTANTE</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProductoSeleccionado(row.productoId)
                          setCalidadSeleccionada(row.calidadId)
                          setCantidadReal(row.stockFisico?.toString() ?? '')
                          setStockRealModalOpen(true)
                        }}
                      >
                        Registrar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <RegistrarEntradaModal open={registrarEntradaOpen} onOpenChange={setRegistrarEntradaOpen} />
      <AjusteManualModal open={ajusteManualOpen} onOpenChange={setAjusteManualOpen} />

      {/* Modal para Stock Real */}
      {stockRealModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-1">Registrar Stock Real</h2>
            {(() => {
              const row = auditoria.find(r => r.productoId === productoSeleccionado && r.calidadId === calidadSeleccionada)
              return row ? (
                <p className="text-sm text-gray-500 mb-4">
                  {row.nombre}{row.calidadNombre ? ` — ${row.calidadNombre}` : ''}
                </p>
              ) : <div className="mb-4" />
            })()}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Stock Real (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cantidadReal}
                  onChange={(e) => setCantidadReal(e.target.value)}
                  className="w-full px-3 py-2 border rounded mt-1"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setStockRealModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegistrarStockReal}
                  disabled={!cantidadReal}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
