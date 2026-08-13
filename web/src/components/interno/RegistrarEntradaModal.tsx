'use client'

import { useEffect, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { today } from '@/lib/format'

interface RegistrarEntradaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegistrarEntradaModal({ open, onOpenChange }: RegistrarEntradaModalProps) {
  const { data, addMovimientoStock, getCalidadesDelProducto } = useData()
  const { usuario } = useAuth()
  const [productoId, setProductoId] = useState('')
  const [calidadId, setCalidadId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [fecha, setFecha] = useState(today())
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)

  const calidadesActivas = productoId ? getCalidadesDelProducto(productoId).filter(c => c.activo) : []
  const requiereCalidad = calidadesActivas.length > 1

  useEffect(() => {
    if (!fecha) {
      setFecha(today())
    }
  }, [fecha])

  useEffect(() => {
    if (calidadesActivas.length === 1) setCalidadId(calidadesActivas[0].id)
    else setCalidadId('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId])

  const handleSave = () => {
    if (!productoId || !cantidad || !usuario?.id) return
    if (requiereCalidad && !calidadId) return

    setLoading(true)
    try {
      addMovimientoStock({
        productoId,
        calidadId: calidadId || undefined,
        tipo: 'entrada',
        cantidad: parseFloat(cantidad),
        motivo: 'compra',
        usuarioId: usuario.id,
        proveedorId: proveedorId || undefined,
        fecha,
        observaciones: observaciones || undefined,
      })

      // Reset form
      setProductoId('')
      setCalidadId('')
      setCantidad('')
      setProveedorId('')
      setFecha(today())
      setObservaciones('')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const productosItems = data.productos.filter(p => p.activo).map(p => ({ value: p.id, label: p.nombre }))
  const calidadesItems = calidadesActivas.map(c => ({ value: c.id, label: c.nombre }))
  const proveedoresItems = data.proveedores.filter(p => p.activo).map(p => ({ value: p.id, label: p.nombre }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Entrada de Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="producto">Producto *</Label>
            <Select value={productoId} onValueChange={(value) => setProductoId(value ?? '')} items={productosItems}>
              <SelectTrigger id="producto" className="w-full">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {productosItems.map(p => (
                  <SelectItem key={p.value} value={p.value} label={p.label}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiereCalidad && (
            <div>
              <Label htmlFor="calidad">Calidad * (uso interno)</Label>
              <Select value={calidadId} onValueChange={(value) => setCalidadId(value ?? '')} items={calidadesItems}>
                <SelectTrigger id="calidad" className="w-full">
                  <SelectValue placeholder="Seleccionar calidad" />
                </SelectTrigger>
                <SelectContent>
                  {calidadesItems.map(c => (
                    <SelectItem key={c.value} value={c.value} label={c.label}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="cantidad">Cantidad (kg) *</Label>
            <Input
              id="cantidad"
              type="number"
              step="0.01"
              min="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="proveedor">Proveedor (opcional)</Label>
            <Select value={proveedorId} onValueChange={(value) => setProveedorId(value ?? '')} items={proveedoresItems}>
              <SelectTrigger id="proveedor" className="w-full">
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {proveedoresItems.map(p => (
                  <SelectItem key={p.value} value={p.value} label={p.label}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={!productoId || !cantidad || loading || (requiereCalidad && !calidadId)}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
