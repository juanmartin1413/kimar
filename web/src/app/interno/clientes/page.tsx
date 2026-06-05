'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Cliente } from '@/lib/types'
import { generateId } from '@/lib/storage'
import { today } from '@/lib/format'
import { Plus, Search, Pencil, Trash2, User, Phone, Mail, MapPin } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ClienteForm from '@/components/interno/ClienteForm'

export default function ClientesPage() {
  const { data, deleteCliente } = useData()
  const { canManageData } = useAuth()
  const [search, setSearch] = useState('')
  const [vendedorFilter, setVendedorFilter] = useState('')
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [creating, setCreating] = useState(false)

  const activos = data.clientes.filter(c => c.activo)
  const filtered = activos.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase())
    const matchVendedor = !vendedorFilter || c.vendedorId === vendedorFilter
    return matchSearch && matchVendedor
  })

  function getVendedorNombre(vendedorId?: string) {
    return data.vendedores.find(v => v.id === vendedorId)?.nombre ?? '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Clientes</h1>
          <p className="text-sm text-[oklch(0.5_0.04_240)]">{activos.length} clientes activos</p>
        </div>
        {canManageData && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo cliente
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.6_0.03_240)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente…"
            className="w-full pl-9 pr-4 py-2.5 border border-[oklch(0.88_0.02_240)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
          />
        </div>
        <select
          value={vendedorFilter}
          onChange={e => setVendedorFilter(e.target.value)}
          className="border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
        >
          <option value="">Todos los vendedores</option>
          {data.vendedores.map(v => (
            <option key={v.id} value={v.id}>{v.nombre}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[oklch(0.9_0.01_240)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[oklch(0.97_0.01_240)] border-b border-[oklch(0.9_0.01_240)]">
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)] hidden sm:table-cell">Dirección</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)] hidden md:table-cell">Contacto</th>
                <th className="text-left py-3 px-4 font-semibold text-[oklch(0.35_0.06_240)]">Vendedor</th>
                {canManageData && <th className="py-3 px-4" />}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[oklch(0.55_0.04_240)]">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-b border-[oklch(0.93_0.01_240)] hover:bg-[oklch(0.98_0.005_240)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[oklch(0.92_0.04_240)] rounded-full flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[oklch(0.42_0.14_240)]" />
                        </div>
                        <span className="font-medium text-[oklch(0.25_0.06_240)]">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[oklch(0.45_0.04_240)] hidden sm:table-cell">
                      {[c.calle, c.altura, c.localidad].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {c.telefono1 && (
                          <div className="flex items-center gap-1 text-[oklch(0.45_0.04_240)]">
                            <Phone className="w-3 h-3" />{c.telefono1}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 text-[oklch(0.45_0.04_240)]">
                            <Mail className="w-3 h-3" />{c.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-[oklch(0.92_0.04_240)] text-[oklch(0.35_0.10_240)] text-xs font-medium px-2.5 py-1 rounded-full">
                        {getVendedorNombre(c.vendedorId)}
                      </span>
                    </td>
                    {canManageData && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setEditing(c)}
                            className="p-1.5 rounded hover:bg-[oklch(0.93_0.02_240)] text-[oklch(0.5_0.04_240)] hover:text-[oklch(0.42_0.14_240)] transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`¿Eliminar a ${c.nombre}?`)) deleteCliente(c.id) }}
                            className="p-1.5 rounded hover:bg-red-50 text-[oklch(0.5_0.04_240)] hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm
            vendedores={data.vendedores}
            onSave={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={v => { if (!v) setEditing(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          {editing && (
            <ClienteForm
              initial={editing}
              vendedores={data.vendedores}
              onSave={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
