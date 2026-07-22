'use client'

import { useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface StockMinimFormProps {
  productoId: string
  calidadId?: string
  initialValue: number
}

export function StockMinimForm({ productoId, calidadId, initialValue }: StockMinimFormProps) {
  const { updateStockMinimo } = useData()
  const [value, setValue] = useState(initialValue.toString())
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      updateStockMinimo(productoId, parseFloat(value) || 0, calidadId)
      setEditing(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setValue(initialValue.toString())
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
      >
        {parseFloat(value).toFixed(2)} kg
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-20"
        autoFocus
      />
      <Button
        size="sm"
        variant="default"
        onClick={handleSave}
        disabled={loading}
        className="h-8"
      >
        Guardar
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCancel}
        disabled={loading}
        className="h-8"
      >
        Cancelar
      </Button>
    </div>
  )
}
