import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/notificaciones.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText
const { mensajeOperacion, notificar, notificacionesStore, cerrarNotificacion } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('consultas, previews y procesos específicos no generan éxitos genéricos', () => {
  for (const [method, path] of [['GET', '/api/clientes'], ['POST', '/auth/login'], ['POST', '/api/comisiones/preview'], ['POST', '/api/cobranzas/previsualizar'], ['POST', '/api/facturacion/preview'], ['POST', '/api/ventas']]) {
    assert.equal(mensajeOperacion(method, path), null)
  }
  assert.ok(mensajeOperacion('POST', '/api/cobranzas/pagos'))
  assert.ok(mensajeOperacion('PUT', '/api/clientes/123'))
  assert.ok(mensajeOperacion('DELETE', '/api/adjuntos/123'))
})

test('cada aviso vence a los cinco segundos y permite cierre manual', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  notificar('Primera operación')
  t.mock.timers.tick(4000)
  notificar('Segunda operación')
  t.mock.timers.tick(999)
  assert.equal(notificacionesStore.getSnapshot().length, 2)
  t.mock.timers.tick(1)
  assert.equal(notificacionesStore.getSnapshot().length, 1)
  assert.equal(notificacionesStore.getSnapshot()[0].mensaje, 'Segunda operación')
  cerrarNotificacion(notificacionesStore.getSnapshot()[0].id)
  assert.equal(notificacionesStore.getSnapshot().length, 0)
})
