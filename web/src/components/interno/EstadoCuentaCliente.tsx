'use client'

import { useApiQuery } from './QueryState'
import { useData } from '@/contexts/DataContext'
import { formatPeso } from '@/lib/format'
import { downloadEstadoCuenta } from '@/lib/estadoCuentaPdf'
import { ventasConSaldo } from '@/lib/cuentaCorriente'
import { Venta } from '@/lib/types'

interface Cuenta {
  saldo: number
  operaciones: { ventaId: string; nroRemito?: string; vencimiento: string; total: number; credito: number; cobrado: number; saldo: number;
    pagos: { id: string; fecha: string; monto: number; formaPago: string }[] }[]
}

export function EstadoCuentaCliente({ clienteId }: { clienteId: string }) {
  const { data } = useData()
  const cliente = data.clientes.find(c => c.id === clienteId)
  const query = useApiQuery<Cuenta>(clienteId ? '/api/cobranzas/cuenta/' + clienteId : null)
  const ventasQuery = useApiQuery<Venta[]>(clienteId ? `/api/ventas?cuentaCorriente=true&clienteId=${encodeURIComponent(clienteId)}` : null)
  const cuenta = query.data
  const error = query.error
  if (!clienteId) return null
  return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
    {error ? <p role="alert">{error} <button type="button" className="underline" onClick={() => query.retry()}>Reintentar</button></p> : <div className="flex justify-between gap-3">
      <p>Estado de cuenta: <strong>{cuenta ? formatPeso(cuenta.saldo) : 'Consultando…'}</strong></p>
      <button type="button" disabled={!cuenta || !cliente || ventasQuery.loading || !!ventasQuery.error || !ventasQuery.data} className="underline disabled:opacity-50" onClick={() => {
        if (cliente && ventasQuery.data) downloadEstadoCuenta(cliente, ventasConSaldo(ventasQuery.data, clienteId))
      }}>Descargar detalle</button>
    </div>}
    {ventasQuery.error && <p role="alert" className="mt-2">No se pudo cargar el detalle. <button type="button" className="underline" onClick={ventasQuery.retry}>Reintentar descarga</button></p>}
  </div>
}
