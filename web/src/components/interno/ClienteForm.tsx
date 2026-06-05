'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { Cliente, Vendedor } from '@/lib/types'

const PROVINCIAS_AR = [
  'CABA',
  'GBA',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
]

interface Props {
  initial?: Cliente
  vendedores: Vendedor[]
  onSave: () => void
  onCancel: () => void
}

export default function ClienteForm({ initial, vendedores, onSave, onCancel }: Props) {
  const { addCliente, updateCliente } = useData()
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    calle: initial?.calle ?? '',
    altura: initial?.altura ?? '',
    localidad: initial?.localidad ?? '',
    provincia: initial?.provincia ?? 'Buenos Aires',
    telefono1: initial?.telefono1 ?? '',
    telefono2: initial?.telefono2 ?? '',
    email: initial?.email ?? '',
    vendedorId: initial?.vendedorId ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (initial) {
      updateCliente(initial.id, form)
    } else {
      addCliente(form)
    }
    onSave()
  }

  const fieldClass = "w-full border border-[oklch(0.88_0.02_240)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.42_0.14_240)]"
  const labelClass = "block text-xs font-medium text-[oklch(0.35_0.06_240)] mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Nombre *</label>
        <input name="nombre" required value={form.nombre} onChange={handleChange} className={fieldClass} placeholder="Nombre del cliente" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Calle</label>
          <input name="calle" value={form.calle} onChange={handleChange} className={fieldClass} placeholder="Av. Corrientes" />
        </div>
        <div>
          <label className={labelClass}>Altura</label>
          <input name="altura" value={form.altura} onChange={handleChange} className={fieldClass} placeholder="1234" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Localidad</label>
          <input name="localidad" value={form.localidad} onChange={handleChange} className={fieldClass} placeholder="Olivos" />
        </div>
        <div>
          <label className={labelClass}>Provincia</label>
          <select name="provincia" value={form.provincia} onChange={handleChange} className={fieldClass}>
            <option value="">Seleccionar…</option>
            {PROVINCIAS_AR.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Teléfono 1</label>
          <input name="telefono1" value={form.telefono1} onChange={handleChange} className={fieldClass} placeholder="011 15-XXXX-XXXX" />
        </div>
        <div>
          <label className={labelClass}>Teléfono 2</label>
          <input name="telefono2" value={form.telefono2} onChange={handleChange} className={fieldClass} placeholder="011 15-XXXX-XXXX" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} className={fieldClass} placeholder="contacto@ejemplo.com" />
      </div>

      <div>
        <label className={labelClass}>Vendedor asignado</label>
        <select name="vendedorId" value={form.vendedorId} onChange={handleChange} className={fieldClass}>
          <option value="">Sin asignar</option>
          {vendedores.filter(v => v.activo).map(v => (
            <option key={v.id} value={v.id}>{v.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-[oklch(0.88_0.02_240)] text-[oklch(0.4_0.04_240)] py-2.5 rounded-lg text-sm font-medium hover:bg-[oklch(0.96_0.01_240)] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-[oklch(0.42_0.14_240)] hover:bg-[oklch(0.52_0.14_240)] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          {initial ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </form>
  )
}
