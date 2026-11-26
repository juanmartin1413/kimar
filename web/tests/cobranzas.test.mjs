import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
}
const { distribucionValida } = await load('../src/lib/cobranzas.ts')
const { saldoVenta } = await load('../src/lib/cuentaCorriente.ts')

test('distribución editable admite exclusiones y centavos sin tolerar excesos', () => {
  assert.equal(distribucionValida([{ saldo: 100, aplicar: 100 }, { saldo: 200, aplicar: 200 }, { saldo: 300, aplicar: 50 }], 350), true)
  assert.equal(distribucionValida([{ saldo: 100, aplicar: 0 }, { saldo: 200, aplicar: 150 }], 150), true)
  assert.equal(distribucionValida([{ saldo: 1, aplicar: 0.1 }, { saldo: 1, aplicar: 0.2 }], 0.3), true)
  for (const aplicar of [-1, NaN, 100.001, 101]) assert.equal(distribucionValida([{ saldo: 100, aplicar }], aplicar), false)
  assert.equal(distribucionValida([{ saldo: 100, aplicar: 50 }], 100), false)
})

test('cuenta corriente descuenta imputaciones y créditos, no compromisos pendientes', () => {
  const venta = { total: 300, cobranzas: [{ estado: 'pendiente', monto: 250 }, { estado: 'cobrado', monto: 50 }] }
  assert.equal(saldoVenta(venta), 250)
  assert.equal(saldoVenta({ ...venta, creditoAplicado: 300 }), -50)
})
