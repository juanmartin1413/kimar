import { Cliente, Venta } from './types'
import { formatFecha, formatPeso, today } from './format'
import { brandPdf } from './brandPdf'
import { kimarContact } from './contact'
import { saldoVenta, proximoVencimiento } from './cuentaCorriente'

function direccionCliente(cliente: Cliente): string {
  const partes = [
    [cliente.calle, cliente.altura].filter(Boolean).join(' '),
    cliente.localidad,
    cliente.provincia,
  ].filter(Boolean)
  return partes.join(' · ')
}

function conceptoVenta(venta: Venta): string {
  if (venta.items.length === 0) return '—'
  const primero = venta.items[0]
  const resto = venta.items.length - 1
  return resto > 0 ? `${primero.descripcion} y ${resto} más` : primero.descripcion
}

function buildEstadoCuentaHTML(cliente: Cliente, ventas: Venta[], logoUrl: string): string {
  const direccion = direccionCliente(cliente)
  const fechas = ventas.map(v => proximoVencimiento(v)).filter((f): f is string => !!f).sort()
  const proximoVence = fechas[0]
  const saldoTotal = ventas.reduce((s, v) => s + saldoVenta(v), 0)

  const rows = ventas
    .map((v, i) => {
      const vence = proximoVencimiento(v)
      const estadoLabel = v.estado === 'cobrado_parcial' ? 'Parcial' : 'Pendiente'
      const bg = i % 2 === 0 ? '#ffffff' : brandPdf.rowAlt
      const cell = (content: string, extra = '') =>
        `<td style="padding:8px 14px;background:${bg};font-family:${brandPdf.fontBody};font-size:11px;color:${brandPdf.carbon};${extra}">${content}</td>`
      return `
    <tr>
      ${cell(formatFecha(v.fechaEntrega))}
      ${cell(conceptoVenta(v))}
      ${cell(v.nroRemito ?? '—', 'text-align:center')}
      ${cell(v.nroFactura ?? '—', 'text-align:center')}
      ${cell(formatPeso(saldoVenta(v)), 'text-align:right;font-weight:700')}
      ${cell(vence ? formatFecha(vence) : '—', 'text-align:center')}
      ${cell(estadoLabel, 'text-align:center;color:#b91c1c;font-weight:700')}
    </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Kimar - Estado de Cuenta - ${cliente.nombre}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    @page{size:A4 portrait;margin:0}
    body{width:210mm;min-height:297mm;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;flex-direction:column}
    table{width:100%;border-collapse:collapse}
  </style>
</head>
<body>

  <!-- Header -->
  <div style="background:#fff;padding:24px 32px 14px;display:flex;align-items:center;gap:24px">
    <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid ${brandPdf.gold}">
      <img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover" />
    </div>
    <div style="flex:1">
      <div style="font-size:26px;font-weight:700;letter-spacing:8px;color:${brandPdf.navy};font-family:${brandPdf.fontHeading}">KIMAR</div>
      <div style="font-size:8px;letter-spacing:4px;color:${brandPdf.gold};margin-top:2px;font-family:${brandPdf.fontHeading}">MARISCOS PREMIUM</div>
    </div>
    <div style="text-align:right;font-family:${brandPdf.fontBody}">
      <div style="font-size:16px;font-weight:700;color:${brandPdf.navy};letter-spacing:2px">ESTADO DE CUENTA</div>
      <div style="font-size:11px;color:#666;margin-top:2px">${formatFecha(today())}</div>
    </div>
  </div>

  <!-- Navy decorative band -->
  <div style="background:${brandPdf.navy};height:16px;border-radius:0 0 50% 50%/0 0 12px 12px;margin:0 -6px"></div>

  <!-- Cliente -->
  <div style="margin:20px 24px 0;border:1px solid ${brandPdf.light};border-radius:8px;padding:14px 20px;font-family:${brandPdf.fontBody}">
    <div style="font-size:9px;letter-spacing:1px;color:${brandPdf.sea};font-weight:700;margin-bottom:4px">CLIENTE</div>
    <div style="font-size:14px;font-weight:700;color:${brandPdf.navy}">${cliente.nombre}</div>
    ${direccion ? `<div style="font-size:11px;color:#555;margin-top:2px">${direccion}</div>` : ''}
    <div style="display:flex;gap:24px;margin-top:6px;font-size:11px;color:#555">
      ${cliente.telefono1 ? `<span>Tel: ${cliente.telefono1}</span>` : ''}
      ${cliente.cuit ? `<span>CUIT: ${cliente.cuit}</span>` : ''}
    </div>
  </div>

  <!-- Table header -->
  <div style="margin:20px 24px 0;display:flex;align-items:center;background:${brandPdf.gold};padding:8px 14px;border-radius:6px 6px 0 0">
    <div style="flex:1;color:${brandPdf.navy};font-weight:700;font-size:10px;letter-spacing:1px;font-family:${brandPdf.fontBody}">FECHA</div>
    <div style="flex:2;color:${brandPdf.navy};font-weight:700;font-size:10px;letter-spacing:1px;font-family:${brandPdf.fontBody}">CONCEPTO</div>
    <div style="flex:1;color:${brandPdf.navy};font-weight:700;font-size:10px;letter-spacing:1px;font-family:${brandPdf.fontBody};text-align:center">REMITO</div>
    <div style="flex:1;color:${brandPdf.navy};font-weight:700;font-size:10px;letter-spacing:1px;font-family:${brandPdf.fontBody};text-align:center">FACTURA</div>
    <div style="flex:1;color:${brandPdf.navy};font-weight:700;font-size:10px;letter-spacing:1px;font-family:${brandPdf.fontBody};text-align:right">TOTAL</div>
    <div style="flex:1;color:${brandPdf.navy};font-weight:700;font-size:10px;letter-spacing:1px;font-family:${brandPdf.fontBody};text-align:center">VENCE</div>
    <div style="flex:1;color:${brandPdf.navy};font-weight:700;font-size:10px;letter-spacing:1px;font-family:${brandPdf.fontBody};text-align:center">ESTADO</div>
  </div>

  <!-- Items -->
  <div style="margin:0 24px;border:1px solid ${brandPdf.light};border-top:none">
    <table><tbody>${rows}</tbody></table>
  </div>

  <!-- Resumen -->
  <div style="margin:20px 24px 0;border:1px solid ${brandPdf.light};border-radius:8px;overflow:hidden;font-family:${brandPdf.fontBody}">
    <div style="background:${brandPdf.navy};color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;padding:8px 16px">RESUMEN DE CUENTA</div>
    <div style="display:flex;justify-content:space-between;padding:8px 16px;font-size:12px;border-bottom:1px solid ${brandPdf.light}">
      <span style="color:#555">Facturas pendientes</span><span style="font-weight:700;color:${brandPdf.navy}">${ventas.length}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 16px;font-size:12px;border-bottom:1px solid ${brandPdf.light}">
      <span style="color:#555">Próximo vencimiento</span><span style="font-weight:700;color:#b91c1c">${proximoVence ? formatFecha(proximoVence) : '—'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 16px;font-size:13px">
      <span style="color:#555;font-weight:700">Saldo pendiente total</span><span style="font-weight:700;color:#b91c1c">${formatPeso(saldoTotal)}</span>
    </div>
  </div>

  <!-- Spacer -->
  <div style="flex:1"></div>

  <!-- Footer -->
  <div style="margin:24px 24px 0;padding:10px 0;border-top:2px solid ${brandPdf.gold};text-align:center">
    <span style="color:${brandPdf.navy};font-size:9.5px;letter-spacing:2px;font-weight:700;font-family:${brandPdf.fontBody}">KIMAR</span>
    <span style="color:${brandPdf.gold};font-size:9.5px;letter-spacing:2px;font-family:${brandPdf.fontBody}">&nbsp;|&nbsp; EXCELENCIA EN CADA PROCESO</span>
    <div style="font-size:9px;color:${brandPdf.sea};margin-top:8px;font-family:${brandPdf.fontBody}">
      ${kimarContact.telefonoAdmin} (Adm.) &nbsp;·&nbsp; ${kimarContact.emailAdmin}
    </div>
    <div style="font-size:8.5px;color:#999;margin-top:6px;font-family:${brandPdf.fontBody}">
      Este documento refleja el estado de la cuenta corriente al momento de su emisión. Si usted realizó un pago que aún no se encuentra registrado, le solicitamos remitir el comprobante a nuestra Oficina de Administración.
    </div>
  </div>

  <script>
    window.onload = function() { setTimeout(function(){ window.print(); }, 500); };
  </script>
</body>
</html>`
}

export function downloadEstadoCuenta(cliente: Cliente, ventas: Venta[]): void {
  const logoUrl = `${window.location.origin}/logoLangoBackground.png`
  const html = buildEstadoCuentaHTML(cliente, ventas, logoUrl)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
