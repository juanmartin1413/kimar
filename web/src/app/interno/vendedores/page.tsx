'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { formatPeso } from '@/lib/format'
import { Users, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function VendedoresPage() {
  const { data, addVendedor } = useData()
  const [creating, setCreating] = useState(false)
  const [nombre, setNombre] = useState('')

  const vendedores = data.vendedores.filter(v => v.activo)

  function getStats(vendedorId: string) {
    const clientes = data.clientes.filter(c => c.vendedorId === vendedorId && c.activo)
    const clienteIds = new Set(clientes.map(c => c.id))
    const ventas = data.ventas.filter(v => clienteIds.has(v.clienteId))
    const deuda = ventas.filter(v => v.estado !== 'pagado').reduce((s, v) => s + v.total, 0)
    return { clientes: clientes.length, deuda }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    addVendedor({ nombre: nombre.trim(), activo: true })
    setNombre('')
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Vendedores</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">{vendedores.length} vendedores activos</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo vendedor
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendedores.map(v => {
          const { clientes, deuda } = getStats(v.id)
          return (
            <div key={v.id} className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[oklch(0.18_0.06_240)] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{v.nombre.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[oklch(0.25_0.06_240)]">{v.nombre}</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[oklch(0.97_0.01_240)] rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-[oklch(0.55_0.04_240)] mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs">Clientes</span>
                  </div>
                  <p className="font-bold text-[oklch(0.25_0.06_240)]">{clientes}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${deuda > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className={`text-xs mb-1 ${deuda > 0 ? 'text-red-500' : 'text-green-600'}`}>A cobrar</p>
                  <p className={`font-bold text-sm tabular-nums ${deuda > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {deuda > 0 ? formatPeso(deuda) : '—'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nuevo vendedor</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1">Nombre *</label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                className="w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
                placeholder="Nombre del vendedor"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCreating(false)} className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)]">Cancelar</button>
              <button type="submit" className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white py-2.5 rounded-lg text-sm font-semibold">Crear</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
