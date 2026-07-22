'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RegistrarEntradaModal } from '@/components/interno/RegistrarEntradaModal'
import { AjusteManualModal } from '@/components/interno/AjusteManualModal'
import { StockMinimForm } from '@/components/interno/StockMinimForm'
import { AlertTriangle, Plus } from 'lucide-react'

export default function StockPage() {
  const { canManageData: canManage } = useAuth()
  const { data: appData, getStockTotal, getStockRealPorProducto, addStockRealRegistrado } = useData()
  const { usuario } = useAuth()
  const [registrarEntradaOpen, setRegistrarEntradaOpen] = useState(false)
  const [ajusteManualOpen, setAjusteManualOpen] = useState(false)
  const [stockRealModalOpen, setStockRealModalOpen] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [cantidadReal, setCantidadReal] = useState('')

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

  const handleRegistrarStockReal = () => {
    if (!productoSeleccionado || !cantidadReal || !usuario?.id) return
    
    addStockRealRegistrado({
      productoId: productoSeleccionado,
      cantidad: parseFloat(cantidadReal),
      fecha: new Date().toISOString().split('T')[0],
      usuarioId: usuario.id,
      observaciones: 'Conteo físico',
    })
    
    setProductoSeleccionado('')
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
                  <TableHead>Usuario</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appData.movimientosStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No hay movimientos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  appData.movimientosStock.map(mov => {
                    const producto = appData.productos.find(p => p.id === mov.productoId)
                    const proveedor = mov.proveedorId ? appData.proveedores.find(p => p.id === mov.proveedorId) : null
                    const usuario = appData.usuarios.find(u => u.id === mov.usuarioId)

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
                {appData.productos.filter(p => p.activo).map(producto => {
                  const stockTeorico = getStockTotal(producto.id)
                  const stockReal = getStockRealPorProducto(producto.id)
                  // Real − Teórico: positivo = sobrante, negativo = faltante
                  const desajuste = stockReal ? stockReal.cantidad - stockTeorico : null
                  const esSobrante = desajuste !== null && desajuste > 0
                  const esFaltante = desajuste !== null && desajuste < 0

                  return (
                    <TableRow key={producto.id}>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell className="text-right">{stockTeorico.toFixed(2)} kg</TableCell>
                      <TableCell className="text-right">
                        {stockReal ? `${stockReal.cantidad.toFixed(2)} kg` : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${esSobrante ? 'text-amber-600' : esFaltante ? 'text-red-600' : 'text-green-600'}`}>
                        {desajuste !== null ? `${desajuste > 0 ? '+' : ''}${desajuste.toFixed(2)} kg` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {!stockReal && <Badge variant="outline" className="bg-yellow-100 text-yellow-800">SIN CONTEO</Badge>}
                        {stockReal && desajuste === 0 && <Badge variant="outline" className="bg-green-100 text-green-800">OK</Badge>}
                        {esSobrante && <Badge variant="outline" className="bg-amber-100 text-amber-800">SOBRANTE</Badge>}
                        {esFaltante && <Badge variant="destructive">FALTANTE</Badge>}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setProductoSeleccionado(producto.id)
                            setCantidadReal(stockReal?.cantidad.toString() ?? '')
                            setStockRealModalOpen(true)
                          }}
                        >
                          Registrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
            <h2 className="text-lg font-semibold mb-4">Registrar Stock Real</h2>
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
