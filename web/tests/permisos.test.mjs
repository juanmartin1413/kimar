import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/permisos.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText
const { rutaPermitida, homePorRol } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('gestor y vendedor solo navegan por sus secciones, incluidos detalles', () => {
  const todas = ['dashboard', 'clientes', 'cuenta-corriente', 'pedidos', 'ventas', 'facturacion', 'cobranzas', 'productos', 'vendedores', 'comisiones', 'stock', 'preparacion', 'entregas', 'proveedores', 'compras', 'gastos', 'reportes', 'configuracion']
  for (const [rol, permitidas] of Object.entries({
    gestor: ['clientes', 'cuenta-corriente', 'ventas', 'facturacion', 'cobranzas', 'gastos'],
    vendedor: ['pedidos', 'ventas', 'cuenta-corriente', 'comisiones'],
  })) {
    for (const seccion of todas) {
      assert.equal(rutaPermitida(rol, `/interno/${seccion}`), permitidas.includes(seccion), `${rol}: ${seccion}`)
      assert.equal(rutaPermitida(rol, `/interno/${seccion}/123`), permitidas.includes(seccion))
    }
    assert.equal(rutaPermitida(rol, homePorRol(rol)), true)
    assert.equal(rutaPermitida(rol, '/interno/ventas-privadas'), false)
  }
})

test('vendedor consulta ventas pero no accede al alta', () => {
  assert.equal(rutaPermitida('vendedor', '/interno/ventas/nueva'), false)
  assert.equal(rutaPermitida('vendedor', '/interno/ventas/nueva/'), false)
  assert.equal(rutaPermitida('gestor', '/interno/ventas/nueva'), true)
  assert.equal(rutaPermitida('admin', '/interno/configuracion'), true)
  assert.equal(rutaPermitida('deposito', '/interno/stock'), true)
  assert.equal(rutaPermitida('repartidor', '/interno/ventas'), false)
})
