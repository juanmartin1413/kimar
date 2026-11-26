import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/dataResources.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText
const { resourceView, resourcesForRoute, resourceRoles } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const loaded = { status: 'loaded', loaded: true }

test('las listas iniciales vacías están pendientes hasta una respuesta exitosa', () => {
  assert.equal(resourceView(['clientes', 'ventas'], {}).pending, true)
  assert.equal(resourceView(['clientes', 'ventas'], { clientes: loaded }).pending, true)
  assert.deepEqual(resourceView(['clientes'], { clientes: loaded }), { pending: false, blocked: false, failed: [], updating: false })
})
test('error inicial bloquea el vacío; actualización conserva datos cargados', () => {
  assert.equal(resourceView(['ventas'], { ventas: { status: 'error', loaded: false } }).blocked, true)
  assert.equal(resourceView(['ventas'], { ventas: { status: 'loading', loaded: true } }).updating, true)
  const stale = resourceView(['ventas'], { ventas: { status: 'error', loaded: true } })
  assert.equal(stale.blocked, false)
  assert.deepEqual(stale.failed, ['ventas'])
})
test('un fallo ajeno no bloquea cuenta corriente y todos sus detalles esperan sus datos', () => {
  const keys = resourcesForRoute('/interno/cuenta-corriente', 'gestor')
  const states = Object.fromEntries(keys.map(key => [key, loaded]))
  states.proveedores = { status: 'error', loaded: false }
  assert.deepEqual(resourceView(keys, states).failed, [])
  assert.ok(resourcesForRoute('/interno/ventas/id', 'gestor').includes('ventas'))
  assert.ok(resourcesForRoute('/interno/pedidos/id', 'vendedor').includes('pedidos'))
  assert.ok(resourcesForRoute('/interno/trazabilidad', 'gestor').includes('clientes'))
})
test('no consultar recursos prohibidos para vendedor, depósito o repartidor', () => {
  assert.equal(resourceRoles.usuarios.includes('gestor'), false)
  assert.equal(resourceRoles.calidades.includes('vendedor'), false)
  assert.equal(resourcesForRoute('/interno/stock', 'deposito').includes('compromisosProveedor'), false)
  assert.deepEqual(resourcesForRoute('/interno/entregas', 'repartidor'), [])
})
