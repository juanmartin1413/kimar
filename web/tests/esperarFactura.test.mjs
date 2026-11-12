import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/esperarFactura.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const { esperarFactura } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('espera el resultado real y termina al autorizarse', async () => {
  const estados = ['pendiente', 'en_proceso', 'autorizado']
  let calls = 0
  const result = await esperarFactura(async () => ({ estado: estados[calls++] }), new AbortController().signal, 1000, 1)
  assert.equal(result, 'autorizado')
  assert.equal(calls, 3)
})

test('un rechazo o problema de configuración permite volver a ventas sin esperar el límite', async () => {
  for (const estado of ['rechazado', 'requiere_atencion']) {
    assert.equal(await esperarFactura(async () => ({ estado }), new AbortController().signal, 1000, 1), 'requiere_revision')
  }
})

test('un request colgado no deja el loader indefinido y se cancela al vencer', async () => {
  let requestSignal
  const result = await esperarFactura(signal => {
    requestSignal = signal
    return new Promise(() => {})
  }, new AbortController().signal, 20, 1)
  assert.equal(result, 'pendiente')
  assert.equal(requestSignal.aborted, true)
})

test('un fallo de consulta no se presenta como fallo al registrar la venta', async () => {
  let calls = 0
  const result = await esperarFactura(async () => {
    if (++calls === 1) throw new Error('offline')
    return { estado: 'autorizado' }
  }, new AbortController().signal, 1000, 1)
  assert.equal(result, 'autorizado')
  assert.equal(calls, 2)
})

test('desmontar la pantalla cancela la consulta sin continuar el polling', async () => {
  const controller = new AbortController()
  let calls = 0
  const result = esperarFactura(async () => {
    calls++
    controller.abort()
    return { estado: 'pendiente' }
  }, controller.signal, 1000, 1)
  assert.equal(await result, 'pendiente')
  assert.equal(calls, 1)
})
