export type ResultadoFactura = 'autorizado' | 'requiere_revision' | 'pendiente'

// This only observes the persisted request. It never submits another sale or invoice.
export async function esperarFactura(
  consultar: (signal: AbortSignal) => Promise<{ estado: string } | undefined>,
  signal: AbortSignal,
  limiteMs = 30_000,
  intervaloMs = 1_500,
): Promise<ResultadoFactura> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal.addEventListener('abort', cancel, { once: true })
  if (signal.aborted) controller.abort()
  const timeout = setTimeout(cancel, limiteMs)
  const aborted = new Promise<undefined>(resolve => {
    if (controller.signal.aborted) resolve(undefined)
    else controller.signal.addEventListener('abort', () => resolve(undefined), { once: true })
  })
  try {
    while (!controller.signal.aborted) {
      const factura = await Promise.race([consultar(controller.signal).catch(() => undefined), aborted])
      if (signal.aborted) return 'pendiente'
      if (factura?.estado === 'autorizado') return 'autorizado'
      if (factura && ['rechazado', 'requiere_atencion'].includes(factura.estado)) return 'requiere_revision'
      if (controller.signal.aborted) break
      await new Promise<void>(resolve => {
        const done = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', done); resolve() }
        const timer = setTimeout(done, intervaloMs)
        controller.signal.addEventListener('abort', done, { once: true })
      })
    }
    return 'pendiente'
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener('abort', cancel)
    controller.abort()
  }
}
