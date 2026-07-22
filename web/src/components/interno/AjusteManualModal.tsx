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

interface AjusteManualModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AjusteManualModal({ open, onOpenChange }: AjusteManualModalProps) {
  const { data, addMovimientoStock, getCalidadesDelProducto } = useData()
  const { usuario } = useAuth()
  const [productoId, setProductoId] = useState('')
  const [calidadId, setCalidadId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState<'ajuste' | 'merma' | 'devolución'>('ajuste')
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)

  const calidadesActivas = productoId ? getCalidadesDelProducto(productoId).filter(c => c.activo) : []
  const requiereCalidad = calidadesActivas.length > 1

  useEffect(() => {
    if (calidadesActivas.length === 1) setCalidadId(calidadesActivas[0].id)
    else setCalidadId('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId])

  const handleSave = () => {
    if (!productoId || !cantidad || !usuario?.id) return
    if (requiereCalidad && !calidadId) return

    const cantidadNum = parseFloat(cantidad)
    const tipo = cantidadNum >= 0 ? 'entrada' : 'salida'
    const cantidadAbs = Math.abs(cantidadNum)

    setLoading(true)
    try {
      addMovimientoStock({
        productoId,
        calidadId: calidadId || undefined,
        tipo: tipo as 'entrada' | 'salida',
        cantidad: cantidadAbs,
        motivo,
        usuarioId: usuario.id,
        fecha: today(),
        observaciones: observaciones || undefined,
      })

      // Reset form
      setProductoId('')
      setCalidadId('')
      setCantidad('')
      setMotivo('ajuste')
      setObservaciones('')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const productosItems = data.productos.filter(p => p.activo).map(p => ({ value: p.id, label: p.nombre }))
  const calidadesItems = calidadesActivas.map(c => ({ value: c.id, label: c.nombre }))
  const motivoItems = [
    { value: 'ajuste', label: 'Ajuste de inventario' },
    { value: 'merma', label: 'Merma/Pérdida' },
    { value: 'devolución', label: 'Devolución' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuste Manual de Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            Usa números positivos para agregar stock, negativos para restar
          </div>

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
            <Label htmlFor="cantidad">Cantidad (kg) * (puede ser negativa)</Label>
            <Input
              id="cantidad"
              type="number"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="+10.5 o -5.25"
            />
          </div>

          <div>
            <Label htmlFor="motivo">Motivo del ajuste *</Label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as any)} items={motivoItems}>
              <SelectTrigger id="motivo">
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivoItems.map(m => (
                  <SelectItem key={m.value} value={m.value} label={m.label}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalle de la razón del ajuste..."
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
