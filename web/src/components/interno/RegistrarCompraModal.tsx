'use client'

import { useEffect, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatPeso, today } from '@/lib/format'
import { Compra } from '@/lib/types'
import { generateId } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { FotoSlot, FotoState, FOTO_VACIA } from '@/components/interno/FotoSlot'
import { Trash2 } from 'lucide-react'

interface RegistrarCompraModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ItemForm {
  key: string
  productoId: string
  calidadId: string
  cantidad: string
  precioUnitario: string
}

function nuevoItem(): ItemForm {
  return { key: generateId(), productoId: '', calidadId: '', cantidad: '', precioUnitario: '' }
}

export function RegistrarCompraModal({ open, onOpenChange }: RegistrarCompraModalProps) {
  const { data, registrarCompra, getCalidadesDelProducto, getFormaPagoVigente, subirAdjunto, eliminarAdjunto } = useData()

  const [proveedorId, setProveedorId] = useState('')
  const [fechaRecepcion, setFechaRecepcion] = useState(today())
  const [nroRemito, setNroRemito] = useState('')
  const [nroFactura, setNroFactura] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [items, setItems] = useState<ItemForm[]>([nuevoItem()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Tras crear la compra, se ofrece adjuntar fotos (necesitan el id ya generado)
  const [compraCreada, setCompraCreada] = useState<Compra | null>(null)
  const [remitoFoto, setRemitoFoto] = useState<FotoState>(FOTO_VACIA)
  const [facturaFoto, setFacturaFoto] = useState<FotoState>(FOTO_VACIA)

  useEffect(() => {
    if (!open) reset()
  }, [open])

  function reset() {
    setProveedorId(''); setFechaRecepcion(today()); setNroRemito(''); setNroFactura('')
    setObservaciones(''); setItems([nuevoItem()]); setError(''); setCompraCreada(null)
    if (remitoFoto.previewUrl) URL.revokeObjectURL(remitoFoto.previewUrl)
    if (facturaFoto.previewUrl) URL.revokeObjectURL(facturaFoto.previewUrl)
    setRemitoFoto(FOTO_VACIA); setFacturaFoto(FOTO_VACIA)
  }

  function addItem() {
    setItems(prev => [...prev, nuevoItem()])
  }

  function updateItem(key: string, changes: Partial<ItemForm>) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, ...changes } : i))
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  const formaPagoVigente = proveedorId ? getFormaPagoVigente(proveedorId) : undefined
  const total = items.reduce((s, i) => s + (parseFloat(i.cantidad) || 0) * (parseFloat(i.precioUnitario) || 0), 0)
  const productosItems = data.productos.filter(p => p.activo).map(p => ({ value: p.id, label: p.nombre }))
  const proveedoresItems = data.proveedores.filter(p => p.activo).map(p => ({ value: p.id, label: p.nombre }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!proveedorId || !nroRemito || items.length === 0) return
    if (!formaPagoVigente) {
      setError('Este proveedor no tiene una forma de pago negociada configurada. Configurala desde la pantalla de Proveedores antes de registrar la compra.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const compra = await registrarCompra({
        proveedorId,
        fechaRecepcion,
        nroRemito,
        nroFactura: nroFactura || undefined,
        observaciones: observaciones || undefined,
        items: items
          .filter(i => i.productoId && parseFloat(i.cantidad) > 0)
          .map(i => ({
            productoId: i.productoId,
            calidadId: i.calidadId || undefined,
            cantidad: parseFloat(i.cantidad) || 0,
            precioUnitario: parseFloat(i.precioUnitario) || 0,
          })),
      })
      setCompraCreada(compra)
    } catch (err) {
      setError(extraerError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleSubirFoto(tipo: 'remito' | 'factura', file: File) {
    if (!compraCreada) return
    const setFoto = tipo === 'remito' ? setRemitoFoto : setFacturaFoto
    const previewUrl = URL.createObjectURL(file)
    setFoto({ adjunto: null, previewUrl, loading: false, subiendo: true })
    try {
      const adjunto = await subirAdjunto('Compra', compraCreada.id, tipo, file)
      setFoto({ adjunto, previewUrl, loading: false, subiendo: false })
    } catch {
      URL.revokeObjectURL(previewUrl)
      setFoto(FOTO_VACIA)
    }
  }

  async function handleQuitarFoto(tipo: 'remito' | 'factura') {
    const foto = tipo === 'remito' ? remitoFoto : facturaFoto
    const setFoto = tipo === 'remito' ? setRemitoFoto : setFacturaFoto
    if (foto.previewUrl) URL.revokeObjectURL(foto.previewUrl)
    setFoto(FOTO_VACIA)
    if (foto.adjunto) await eliminarAdjunto(foto.adjunto.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{compraCreada ? 'Compra registrada' : 'Registrar compra'}</DialogTitle>
        </DialogHeader>

        {compraCreada ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Compra {compraCreada.nroRemito} registrada por {formatPeso(compraCreada.total)}.
              Se generó el compromiso de pago según la forma de pago vigente del proveedor.
            </p>
            <p className="text-sm font-medium">Adjuntar comprobantes (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Foto de remito</Label>
                <FotoSlot
                  foto={remitoFoto}
                  onFile={f => handleSubirFoto('remito', f)}
                  onQuitar={() => handleQuitarFoto('remito')}
                />
              </div>
              <div>
                <Label>Foto de factura</Label>
                <FotoSlot
                  foto={facturaFoto}
                  onFile={f => handleSubirFoto('factura', f)}
                  onQuitar={() => handleQuitarFoto('factura')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Listo</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="proveedor">Proveedor *</Label>
                <Select value={proveedorId} onValueChange={v => setProveedorId(v ?? '')} items={proveedoresItems}>
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
                <Label htmlFor="fechaRecepcion">Fecha de recepción *</Label>
                <Input id="fechaRecepcion" type="date" value={fechaRecepcion} onChange={e => setFechaRecepcion(e.target.value)} />
              </div>
            </div>

            {proveedorId && !formaPagoVigente && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Este proveedor no tiene una forma de pago negociada configurada. Configurala desde Proveedores antes de continuar.
              </p>
            )}
            {formaPagoVigente && (
              <p className="text-xs text-gray-500">
                Forma de pago vigente: {formaPagoVigente.tramos.map(t => `${t.porcentaje}% a ${t.diasPlazo}d (${t.metodoPago})`).join(' + ')}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="nroRemito">Nro. de remito *</Label>
                <Input id="nroRemito" value={nroRemito} onChange={e => setNroRemito(e.target.value)} placeholder="Ej: 0001-00001234" />
              </div>
              <div>
                <Label htmlFor="nroFactura">Nro. de factura</Label>
                <Input id="nroFactura" value={nroFactura} onChange={e => setNroFactura(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Ítems ({items.length}) — Total: {formatPeso(total)}</p>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Agregar ítem</Button>
              </div>
              {items.map(item => (
                <ItemRow
                  key={item.key}
                  item={item}
                  productosItems={productosItems}
                  calidades={item.productoId ? getCalidadesDelProducto(item.productoId).filter(c => c.activo) : []}
                  onChange={changes => updateItem(item.key, changes)}
                  onRemove={() => removeItem(item.key)}
                />
              ))}
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea id="observaciones" value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Opcional" />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button
                type="submit"
                disabled={saving || !proveedorId || !nroRemito || !formaPagoVigente || items.every(i => !i.productoId || !(parseFloat(i.cantidad) > 0))}
              >
                {saving ? 'Guardando...' : 'Registrar compra'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ItemRow({ item, productosItems, calidades, onChange, onRemove }: {
  item: ItemForm
  productosItems: { value: string; label: string }[]
  calidades: { id: string; nombre: string }[]
  onChange: (changes: Partial<ItemForm>) => void
  onRemove: () => void
}) {
  const requiereCalidad = calidades.length > 1
  const subtotal = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnitario) || 0)

  return (
    <div className="grid grid-cols-12 gap-2 items-end border border-gray-100 rounded-lg p-2">
      <div className={requiereCalidad ? 'col-span-4' : 'col-span-6'}>
        <Label className="text-xs">Producto</Label>
        <Select value={item.productoId} onValueChange={v => onChange({ productoId: v ?? '', calidadId: '' })} items={productosItems}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Producto" />
          </SelectTrigger>
          <SelectContent>
            {productosItems.map(p => (
              <SelectItem key={p.value} value={p.value} label={p.label}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {requiereCalidad && (
        <div className="col-span-3">
          <Label className="text-xs">Calidad</Label>
          <Select value={item.calidadId} onValueChange={v => onChange({ calidadId: v ?? '' })} items={calidades.map(c => ({ value: c.id, label: c.nombre }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Calidad" />
            </SelectTrigger>
            <SelectContent>
              {calidades.map(c => (
                <SelectItem key={c.id} value={c.id} label={c.nombre}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="col-span-2">
        <Label className="text-xs">Cantidad (kg)</Label>
        <Input type="number" step="0.01" min="0" value={item.cantidad} onChange={e => onChange({ cantidad: e.target.value })} placeholder="0" />
      </div>
      <div className="col-span-2">
        <Label className="text-xs">Precio unit.</Label>
        <Input type="number" step="0.01" min="0" value={item.precioUnitario} onChange={e => onChange({ precioUnitario: e.target.value })} placeholder="0" />
      </div>
      <div className={cn('flex items-center justify-end gap-1.5', requiereCalidad ? 'col-span-1' : 'col-span-2')}>
        <span className="text-xs text-gray-500 tabular-nums">{formatPeso(subtotal)}</span>
        <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function extraerError(err: unknown): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message)
      if (parsed?.error) return String(parsed.error)
    } catch { /* no era JSON */ }
    return err.message
  }
  return 'Ocurrió un error al registrar la compra.'
}
