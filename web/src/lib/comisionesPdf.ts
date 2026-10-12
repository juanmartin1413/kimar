import { Producto, UnidadProducto, Vendedor } from './types'
import { formatFecha, formatPeso, today } from './format'
import { brandPdf } from './brandPdf'
import { kimarContact } from './contact'
import { Periodo } from './saludFinanciera'
import {
  MODO_LABEL, MargenVenta, ModoPeriodo, ResumenProductoConCosto, TotalesComisiones, VentaComision,
  formatCantidad, unidadLabel,
} from './comisiones'

export interface ReporteComisionesInput {
  vendedor: Vendedor
  periodo: Periodo
  modo: ModoPeriodo
  clientesFiltro: string[] | null // nombres; null = todos
  ventas: VentaComision[]
  resumen: ResumenProductoConCosto[]
  totales: TotalesComisiones
  productos: Producto[] // para mostrar kg/unid. por ítem
  margenes: Map<string, MargenVenta> // margen por venta con los costos tipeados (margenesPorVenta)
}

const formaPagoLabel: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque' }
const estadoCobranzaLabel: Record<string, string> = { pendiente: 'Pendiente', cobrado: 'Cobrado', vencido: 'Vencido' }
const estadoVentaLabel: Record<string, string> = { debe: 'Debe', cobrado_parcial: 'Parcial', pagado: 'Pagado' }

function esc(s: string | undefined | null): string {
  return (s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string))
}

const AMBAR = '#b45309'
const ROJO = '#b91c1c'
const VERDE = '#15803d'

function th(label: string, extra = ''): string {
  return `<th style="padding:6px 10px;background:${brandPdf.gold};color:${brandPdf.navy};font-size:9px;letter-spacing:1px;font-weight:700;text-align:left;font-family:${brandPdf.fontBody};${extra}">${label}</th>`
}

function td(content: string, i: number, extra = ''): string {
  const bg = i % 2 === 0 ? '#ffffff' : brandPdf.rowAlt
  return `<td style="padding:6px 10px;background:${bg};font-size:10.5px;color:${brandPdf.carbon};font-family:${brandPdf.fontBody};${extra}">${content}</td>`
}

function seccionTitulo(titulo: string): string {
  return `<div style="margin:18px 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;color:${brandPdf.navy};font-family:${brandPdf.fontBody};border-bottom:2px solid ${brandPdf.gold};padding-bottom:4px">${titulo}</div>`
}

function bloqueVenta(vc: VentaComision, modo: ModoPeriodo, unidadDe: (productoId: string) => UnidadProducto, margenVenta: MargenVenta | undefined): string {
  const v = vc.venta
  const items = v.items.map((it, i) => `
    <tr>
      ${td(esc(it.descripcion), i)}
      ${td(formatCantidad(it.cantidad, unidadDe(it.productoId)), i, 'text-align:right')}
      ${td(formatPeso(it.precioUnitario), i, 'text-align:right')}
      ${td(formatPeso(it.subtotal), i, 'text-align:right;font-weight:700')}
    </tr>`).join('')

  const cobranzas = vc.cobranzas.length === 0
    ? `<tr>${td('Sin plan de cobro registrado', 0, 'color:#888;font-style:italic')}</tr>`
    : vc.cobranzas.map((c, i) => {
      const enPeriodo = vc.cobranzasEnPeriodoIds.has(c.id)
      const atenuar = modo === 'cobro' && c.estado === 'cobrado' && !enPeriodo
      const color = c.estado === 'cobrado' ? (atenuar ? '#888' : VERDE) : ROJO
      const estado = estadoCobranzaLabel[c.estado] ?? c.estado
      const nota = atenuar ? ' <span style="font-size:9px;color:#888">(fuera del período)</span>' : ''
      return `
    <tr>
      ${td(formatFecha(c.fecha), i)}
      ${td(c.fechaCobro ? formatFecha(c.fechaCobro) : '—', i, 'text-align:center')}
      ${td(formaPagoLabel[c.formaPago] ?? c.formaPago, i)}
      ${td(`<span style="color:${color};font-weight:700">${estado}</span>${nota}`, i, 'text-align:center')}
      ${td(formatPeso(c.monto), i, `text-align:right;font-weight:700;${atenuar ? 'color:#888' : ''}`)}
    </tr>`
    }).join('')

  return `
  <div class="venta" style="margin-top:12px;border:1px solid ${brandPdf.light};border-radius:8px;overflow:hidden">
    <div style="background:${brandPdf.navy};color:#fff;padding:7px 12px;display:flex;justify-content:space-between;align-items:center;font-family:${brandPdf.fontBody}">
      <div>
        <span style="font-size:11px;font-weight:700">${formatFecha(v.fechaEntrega)}</span>
        <span style="font-size:11px;margin-left:10px">${esc(vc.cliente?.nombre ?? '—')}</span>
        <span style="font-size:9px;color:${brandPdf.gold};margin-left:10px">Remito ${esc(v.nroRemito ?? '—')}${v.nroFactura ? ` · Factura ${esc(v.nroFactura)}` : ''}</span>
      </div>
      <div style="font-size:9.5px;text-align:right">
        <span>Total <b>${formatPeso(v.total)}</b></span>
        <span style="margin-left:10px">Cobrado <b style="color:#9fe3b4">${formatPeso(vc.cobradoEnPeriodo)}</b></span>
        <span style="margin-left:10px">Pendiente <b style="color:#f5b8b8">${formatPeso(vc.pendiente)}</b></span>
        <span style="margin-left:10px">Margen cobrado <b style="color:${brandPdf.gold}">${formatPeso(margenVenta?.margenCobrado ?? 0)}</b>${margenVenta?.sinCosto ? ' <span style="color:#fcd34d">*</span>' : ''}</span>
        <span style="margin-left:10px;color:${brandPdf.gold}">${estadoVentaLabel[v.estado] ?? v.estado}</span>
      </div>
    </div>
    <table>
      <thead><tr>${th('PRODUCTO')}${th('CANTIDAD', 'text-align:right')}${th('PRECIO', 'text-align:right')}${th('SUBTOTAL', 'text-align:right')}</tr></thead>
      <tbody>${items}</tbody>
    </table>
    <table style="border-top:1px solid ${brandPdf.light}">
      <thead><tr>${th('VENCIMIENTO')}${th('FECHA DE COBRO', 'text-align:center')}${th('FORMA')}${th('ESTADO', 'text-align:center')}${th('MONTO', 'text-align:right')}</tr></thead>
      <tbody>${cobranzas}</tbody>
    </table>
  </div>`
}

function buildComisionesHTML(input: ReporteComisionesInput, logoUrl: string, autoPrint: boolean): string {
  const { vendedor, periodo, modo, clientesFiltro, ventas, resumen, totales, productos, margenes } = input
  const unidadPorProducto = new Map(productos.map(p => [p.id, p.unidad]))
  const unidadDe = (id: string): UnidadProducto => unidadPorProducto.get(id) ?? 'kg'
  const clientesTexto = clientesFiltro === null ? 'Todos' : (clientesFiltro.length === 0 ? 'Ninguno' : clientesFiltro.map(esc).join(', '))

  const filasResumen = resumen.map((r, i) => `
    <tr>
      ${td(esc(r.nombre), i)}
      ${td(formatCantidad(r.cantidad, r.unidad), i, 'text-align:right')}
      ${td(formatPeso(r.ventaTotal), i, 'text-align:right')}
      ${td(r.sinCosto ? `<span style="color:${AMBAR};font-weight:700">sin costo</span>` : `${formatPeso(r.costoUnitario)}/${unidadLabel(r.unidad)}`, i, 'text-align:right')}
      ${td(formatPeso(r.costoTotal), i, 'text-align:right')}
      ${td(formatPeso(r.margen), i, `text-align:right;color:${r.margen < 0 ? ROJO : brandPdf.carbon}`)}
      ${td(formatPeso(r.margenCobrado), i, `text-align:right;font-weight:700;color:${r.margenCobrado < 0 ? ROJO : brandPdf.navy}`)}
    </tr>`).join('')

  const filaTotal = (label: string, valor: string, extra = '') =>
    `<div style="display:flex;justify-content:space-between;padding:7px 16px;font-size:12px;border-bottom:1px solid ${brandPdf.light};font-family:${brandPdf.fontBody}">
      <span style="color:#555">${label}</span><span style="font-weight:700;color:${brandPdf.navy};${extra}">${valor}</span>
    </div>`

  const avisoSinCosto = totales.productosSinCosto > 0
    ? `<div style="margin-top:8px;font-size:9.5px;color:${AMBAR};font-family:${brandPdf.fontBody}">⚠ ${totales.productosSinCosto} producto${totales.productosSinCosto !== 1 ? 's' : ''} sin costo de adquisición cargado: el costo está subestimado y los márgenes sobreestimados (las ventas afectadas llevan un * en la cabecera).</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Kimar - Comisiones - ${esc(vendedor.nombre)} - ${periodo.desde} a ${periodo.hasta}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    @page{size:A4 portrait;margin:10mm}
    body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0 4mm}
    table{width:100%;border-collapse:collapse}
    .venta{break-inside:avoid;page-break-inside:avoid}
    tr{page-break-inside:avoid}
    .no-print{position:fixed;right:16px;bottom:16px;background:${brandPdf.navy};color:#fff;border:none;border-radius:999px;padding:12px 20px;font:700 13px ${brandPdf.fontBody};cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}
    @media print{.no-print{display:none}}
  </style>
</head>
<body>

  <!-- Header -->
  <div style="padding:12px 0 10px;display:flex;align-items:center;gap:20px">
    <div style="width:56px;height:56px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid ${brandPdf.gold}">
      <img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover" />
    </div>
    <div style="flex:1">
      <div style="font-size:24px;font-weight:700;letter-spacing:8px;color:${brandPdf.navy};font-family:${brandPdf.fontHeading}">KIMAR</div>
      <div style="font-size:8px;letter-spacing:4px;color:${brandPdf.gold};margin-top:2px;font-family:${brandPdf.fontHeading}">MARISCOS PREMIUM</div>
    </div>
    <div style="text-align:right;font-family:${brandPdf.fontBody}">
      <div style="font-size:15px;font-weight:700;color:${brandPdf.navy};letter-spacing:2px">LIQUIDACIÓN DE COMISIONES</div>
      <div style="font-size:10px;color:#666;margin-top:2px">Emitido el ${formatFecha(today())}</div>
    </div>
  </div>
  <div style="background:${brandPdf.navy};height:12px;border-radius:0 0 50% 50%/0 0 10px 10px"></div>

  <!-- Parámetros -->
  <div style="margin-top:14px;border:1px solid ${brandPdf.light};border-radius:8px;padding:10px 16px;font-family:${brandPdf.fontBody};display:grid;grid-template-columns:1fr 1fr;gap:6px 24px">
    <div><div style="font-size:8.5px;letter-spacing:1px;color:${brandPdf.sea};font-weight:700">VENDEDOR</div><div style="font-size:13px;font-weight:700;color:${brandPdf.navy}">${esc(vendedor.nombre)}</div></div>
    <div><div style="font-size:8.5px;letter-spacing:1px;color:${brandPdf.sea};font-weight:700">PERÍODO</div><div style="font-size:13px;font-weight:700;color:${brandPdf.navy}">${formatFecha(periodo.desde)} — ${formatFecha(periodo.hasta)}</div></div>
    <div><div style="font-size:8.5px;letter-spacing:1px;color:${brandPdf.sea};font-weight:700">CRITERIO</div><div style="font-size:11px;color:#444">${MODO_LABEL[modo]}</div></div>
    <div><div style="font-size:8.5px;letter-spacing:1px;color:${brandPdf.sea};font-weight:700">CLIENTES</div><div style="font-size:11px;color:#444">${clientesTexto}</div></div>
  </div>

  ${seccionTitulo(`VENTAS INCLUIDAS (${ventas.length})`)}
  ${ventas.length === 0 ? `<div style="font-size:11px;color:#888;font-family:${brandPdf.fontBody}">No hay ventas para los filtros seleccionados.</div>` : ventas.map(v => bloqueVenta(v, modo, unidadDe, margenes.get(v.venta.id))).join('')}

  ${seccionTitulo('RESUMEN POR PRODUCTO')}
  <div style="border:1px solid ${brandPdf.light};border-radius:8px;overflow:hidden">
    <table>
      <thead><tr>${th('PRODUCTO')}${th('CANTIDAD', 'text-align:right')}${th('VENTA', 'text-align:right')}${th('COSTO ADQ.', 'text-align:right')}${th('COSTO TOTAL', 'text-align:right')}${th('MARGEN TOTAL', 'text-align:right')}${th('MARGEN COBRADO', 'text-align:right')}</tr></thead>
      <tbody>${filasResumen || `<tr>${td('—', 0)}</tr>`}</tbody>
    </table>
  </div>
  ${avisoSinCosto}

  <!-- Totales -->
  <div class="venta" style="margin-top:16px;border:1px solid ${brandPdf.light};border-radius:8px;overflow:hidden">
    <div style="background:${brandPdf.navy};color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;padding:8px 16px;font-family:${brandPdf.fontBody}">TOTALES</div>
    ${filaTotal('Venta total', formatPeso(totales.ventaTotal))}
    ${filaTotal(modo === 'cobro' ? 'Cobrado en el período' : 'Cobrado', formatPeso(totales.cobrado), `color:${VERDE}`)}
    ${filaTotal('Pendiente de cobro', formatPeso(totales.pendiente), `color:${ROJO}`)}
    ${filaTotal('Costo de adquisición (Σ cantidad × costo)', formatPeso(totales.costoTotal))}
    ${filaTotal('Margen total (Venta − Costo)', formatPeso(totales.margenBruto), `color:${totales.margenBruto < 0 ? ROJO : brandPdf.navy}`)}
    ${filaTotal('Costo sobre lo cobrado (corresponde a KIMAR)', formatPeso(totales.costoCobrado))}
    <div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:13px;background:${brandPdf.ivory};font-family:${brandPdf.fontBody}">
      <span style="color:${brandPdf.navy};font-weight:700">MARGEN SOBRE LO COBRADO · A LIQUIDAR</span>
      <span style="font-weight:700;font-size:15px;color:${totales.margenCobrado < 0 ? ROJO : brandPdf.navy}">${formatPeso(totales.margenCobrado)}</span>
    </div>
    <div style="padding:6px 16px 10px;font-size:9px;color:#777;font-family:${brandPdf.fontBody}">
      Prorrateo proporcional: cada venta aporta su margen en la proporción en que fue cobrada (cobrado ÷ total de la venta). De lo cobrado, ${formatPeso(totales.costoCobrado)} corresponde a costo y ${formatPeso(totales.margenCobrado)} a margen.
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:22px;padding:10px 0;border-top:2px solid ${brandPdf.gold};text-align:center">
    <span style="color:${brandPdf.navy};font-size:9.5px;letter-spacing:2px;font-weight:700;font-family:${brandPdf.fontBody}">KIMAR</span>
    <span style="color:${brandPdf.gold};font-size:9.5px;letter-spacing:2px;font-family:${brandPdf.fontBody}">&nbsp;|&nbsp; EXCELENCIA EN CADA PROCESO</span>
    <div style="font-size:9px;color:${brandPdf.sea};margin-top:8px;font-family:${brandPdf.fontBody}">
      ${kimarContact.telefonoAdmin} (Adm.) &nbsp;·&nbsp; ${kimarContact.emailAdmin}
    </div>
    <div style="font-size:8.5px;color:#999;margin-top:6px;font-family:${brandPdf.fontBody}">
      Documento interno. La comisión se liquida únicamente sobre las cobranzas efectivamente recaudadas. Los costos de adquisición fueron ingresados manualmente al momento de la emisión.
    </div>
  </div>

  ${autoPrint
    ? `<script>window.onload = function() { setTimeout(function(){ window.print(); }, 500); };</script>`
    : `<button class="no-print" onclick="window.print()">Guardar como PDF</button>`}
</body>
</html>`
}

// Mismo mecanismo que remito y estado de cuenta (sin librería de PDF): se abre el HTML en una pestaña.
// autoPrint=true dispara el diálogo de impresión de inmediato ("Imprimir"); autoPrint=false deja una
// previsualización con botón "Guardar como PDF" ("Descargar").
export function abrirReporteComisiones(input: ReporteComisionesInput, opts: { autoPrint: boolean }): void {
  const logoUrl = `${window.location.origin}/logoLangoBackground.png`
  const html = buildComisionesHTML(input, logoUrl, opts.autoPrint)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
