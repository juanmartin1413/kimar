import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/facturacion.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const { datosFacturaCliente, solicitudFactura, validarDatosFactura } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const cliente = { id: 'cliente-a', nombre: 'Restaurante', razonSocial: 'Restaurante SA', cuit: '20123456786', condicionIva: 1, domicilioFiscal: 'Calle 123' }
const items = [{ id: 'linea-1', productoId: 'producto-1', descripcion: 'Langostino', cantidad: 2, precioUnitario: 100 }]

test('los datos completos del cliente permiten preparar la factura sin una revisión manual', () => {
  const datos = datosFacturaCliente(cliente)
  assert.equal(validarDatosFactura(items, datos), null)
  const req = solicitudFactura(cliente.id, items, datos)
  assert.equal(req.receptor.razonSocial, cliente.razonSocial)
  assert.equal(req.receptor.domicilio, cliente.domicilioFiscal)
  assert.deepEqual(req.descripciones, ['Langostino'])
  assert.equal(req.items[0].cantidad, 2)
})

test('los campos requeridos vacíos, espacios y condición IVA sin elegir impiden preparar la factura', () => {
  for (const campo of ['razonSocial', 'cuit', 'domicilio']) {
    const datos = datosFacturaCliente(cliente)
    datos.receptor[campo] = '  '
    assert.ok(validarDatosFactura(items, datos))
  }
  const datos = datosFacturaCliente(cliente)
  datos.receptor.condicionIva = 0
  assert.ok(validarDatosFactura(items, datos))
  datos.receptor.condicionIva = 1
  datos.descripciones['linea-1'] = ' '
  assert.ok(validarDatosFactura(items, datos))
})

test('las correcciones fiscales se conservan sin cambiar el cliente ni las descripciones comerciales', () => {
  const datos = datosFacturaCliente(cliente)
  datos.receptor.domicilio = 'Domicilio corregido'
  datos.descripciones['linea-1'] = 'Langostino congelado'
  datos.observaciones = 'Entrega en sucursal'
  const req = solicitudFactura(cliente.id, items, datos)
  assert.equal(req.receptor.domicilio, 'Domicilio corregido')
  assert.equal(cliente.domicilioFiscal, 'Calle 123')
  assert.equal(req.items[0].descripcion, 'Langostino')
  assert.deepEqual(req.descripciones, ['Langostino congelado'])
  assert.equal(req.observaciones, 'Entrega en sucursal')
})

test('una nueva preparación usa los productos y montos actuales y descarta descripciones de líneas eliminadas', () => {
  const datos = datosFacturaCliente(cliente)
  datos.descripciones['linea-1'] = 'Texto anterior'
  const nuevas = [{ ...items[0], id: 'linea-2', descripcion: 'Merluza', cantidad: 3, precioUnitario: 200 }]
  const req = solicitudFactura(cliente.id, nuevas, datos)
  assert.deepEqual(req.descripciones, ['Merluza'])
  assert.equal(req.items[0].cantidad, 3)
  assert.equal(req.items[0].precioUnitario, 200)
})
