'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatFecha, formatPeso } from '@/lib/format'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface Cuenta {
  saldo: number
  operaciones: { ventaId: string; nroRemito?: string; vencimiento: string; total: number; credito: number; cobrado: number; saldo: number;
    pagos: { id: string; fecha: string; monto: number; formaPago: string }[] }[]
}

export function EstadoCuentaCliente({ clienteId }: { clienteId: string }) {
  const [cuenta, setCuenta] = useState<Cuenta | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setCuenta(null); setError('')
    if (clienteId) api.get<Cuenta>(`/api/cobranzas/cuenta/${clienteId}`, controller.signal).then(setCuenta).catch(() => {
      if (!controller.signal.aborted) setError('No se pudo consultar el estado de cuenta.')
    })
    return () => controller.abort()
  }, [clienteId, retry])
  if (!clienteId) return null
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
    {error ? <p role="alert">{error} <button type="button" className="underline" onClick={() => setRetry(n => n + 1)}>Reintentar</button></p> : <div className="flex justify-between gap-3">
      <p>Estado de cuenta: <strong>{cuenta ? formatPeso(cuenta.saldo) : 'Consultando…'}</strong></p>
      <button type="button" disabled={!cuenta} className="underline" onClick={() => setOpen(true)}>Ver detalle</button>
    </div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogTitle>Estado de cuenta</DialogTitle>
      <p>Saldo: <strong>{formatPeso(cuenta?.saldo ?? 0)}</strong></p>
      {!cuenta?.operaciones.length && <p>Sin operaciones registradas.</p>}
      {cuenta?.operaciones.map(v => <div key={v.ventaId} className="rounded-lg border p-3 space-y-1 text-sm">
        <p className="font-semibold">Remito {v.nroRemito ?? '—'} · Vence {formatFecha(v.vencimiento)}</p>
        <p>Total {formatPeso(v.total)} · Cobrado {formatPeso(v.cobrado)} · Saldo {formatPeso(v.saldo)}</p>
        {v.credito > 0 && <p>Nota de crédito: {formatPeso(v.credito)}</p>}
        {v.pagos.map((p, i) => <p key={`${p.id}-${i}`} className="text-green-800">{formatFecha(p.fecha)} · {p.formaPago} · {formatPeso(p.monto)}</p>)}
      </div>)}
    </DialogContent></Dialog>
  </div>
}
