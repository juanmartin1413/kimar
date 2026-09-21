import { EstadoEntrega, TipoAdjunto } from '@/lib/types'

// Etiquetas legibles del catálogo de documentos (ver TipoAdjunto).
export const tipoAdjuntoLabels: Record<TipoAdjunto, string> = {
  remito: 'Remito',
  factura: 'Factura',
  otro: 'Otro',
  remito_firmado: 'Remito firmado',
}

export const TIPO_REMITO_FIRMADO: TipoAdjunto = 'remito_firmado'

export const estadoEntregaConfig: Record<EstadoEntrega, { label: string; className: string }> = {
  pendiente: { label: 'En preparación', className: 'bg-gray-100 text-gray-600' },
  listo: { label: 'Listo para entrega', className: 'bg-blue-100 text-blue-700' },
  entregado: { label: 'Entregado', className: 'bg-green-100 text-green-700' },
}

// "Calle 123, Localidad" — omite las partes que falten.
export function direccionCliente(v: { calle?: string; altura?: string; localidad?: string }): string {
  const calle = [v.calle, v.altura].filter(Boolean).join(' ').trim()
  return [calle, v.localidad].filter(Boolean).join(', ')
}

export function mapsUrl(direccion: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(direccion)}`
}

// Fecha/hora UTC del servidor → "dd/mm/aaaa hh:mm" en hora local.
export function formatFechaHora(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// api.ts lanza Error(text) con el body crudo; el backend responde { error } o { message }.
export function parseApiError(e: unknown, fallback = 'Ocurrió un error. Intentá nuevamente.'): string {
  const msg = e instanceof Error ? e.message : String(e)
  try {
    const parsed = JSON.parse(msg) as { error?: string; message?: string }
    return parsed.error ?? parsed.message ?? fallback
  } catch {
    return msg || fallback
  }
}
