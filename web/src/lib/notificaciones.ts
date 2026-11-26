export type Notificacion = { id: number; mensaje: string; tipo: 'success' | 'warning'; href?: string }
let siguiente = 0
let actuales: Notificacion[] = []
const listeners = new Set<() => void>()
const emitir = () => listeners.forEach(listener => listener())
export function cerrarNotificacion(id: number) {
  actuales = actuales.filter(n => n.id !== id)
  emitir()
}
export function notificar(mensaje: string, tipo: Notificacion['tipo'] = 'success', href?: string) {
  const id = ++siguiente
  actuales = [...actuales.slice(-3), { id, mensaje, tipo, href }]
  emitir()
  setTimeout(() => cerrarNotificacion(id), 5000)
}
const vacias: Notificacion[] = []
export const notificacionesStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
  getSnapshot: () => actuales,
  getServerSnapshot: () => vacias,
}

// Las consultas y los procesos con un resultado específico notifican desde su pantalla.
export function mensajeOperacion(method: string, path: string): string | null {
  if (method === 'GET' || !path.startsWith('/api/') || /\/(preview|previsualizar)(\?|$)/.test(path)
    || path.startsWith('/api/comisiones/') || path.startsWith('/api/facturacion/')
    || (method === 'POST' && path === '/api/ventas')) return null
  return method === 'DELETE' ? 'Eliminado correctamente.' : method === 'PUT' ? 'Cambios guardados.' : 'Operación registrada correctamente.'
}
