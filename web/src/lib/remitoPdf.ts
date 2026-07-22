import { Cliente, Producto, Vendedor, Venta } from './types'
import { formatFecha } from './format'
import { brandPdf } from './brandPdf'
import { kimarContact } from './contact'

function direccionCliente(cliente: Cliente): string {
  const partes = [
    [cliente.calle, cliente.altura].filter(Boolean).join(' '),
    cliente.localidad,
    cliente.provincia,
  ].filter(Boolean)
  return partes.join(' · ')
}

function buildRemitoHTML(
  venta: Venta,
  cliente: Cliente,
  vendedor: Vendedor,
  productos: Producto[],
  logoUrl: string,
): string {
  const direccion = direccionCliente(cliente)

  const rows = venta.items
    .map((item, i) => {
      const producto = productos.find(p => p.id === item.productoId)
      const unidad = producto?.unidad === 'unidad' ? 'u' : 'kg'
      return `
    <tr>
      <td style="padding:8px 16px;background:${i % 2 === 0 ? '#ffffff' : brandPdf.rowAlt};font-family:${brandPdf.fontBody};font-size:12px;color:${brandPdf.carbon};text-align:center;width:100px">
        ${item.cantidad} ${unidad}
      </td>
      <td style="padding:8px 16px;background:${i % 2 === 0 ? '#ffffff' : brandPdf.rowAlt};font-family:${brandPdf.fontBody};font-size:12px;color:${brandPdf.carbon}">
        ${item.descripcion}
      </td>
    </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Kimar - Remito ${venta.nroRemito ?? ''}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    @page{size:A4 portrait;margin:0}
    body{width:210mm;min-height:297mm;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
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
      <div style="font-size:16px;font-weight:700;color:${brandPdf.navy};letter-spacing:2px">REMITO</div>
      <div style="font-size:13px;font-weight:700;color:${brandPdf.gold};margin-top:2px">N° ${venta.nroRemito ?? '—'}</div>
      <div style="font-size:11px;color:#666;margin-top:2px">${formatFecha(venta.fechaEntrega)}</div>
    </div>
  </div>

  <!-- Navy decorative band -->
  <div style="background:${brandPdf.navy};height:16px;border-radius:0 0 50% 50%/0 0 12px 12px;margin:0 -6px"></div>

  <!-- Cliente / Vendedor -->
  <div style="margin:20px 24px 0;border:1px solid ${brandPdf.light};border-radius:8px;padding:14px 20px;font-family:${brandPdf.fontBody}">
    <div style="font-size:9px;letter-spacing:1px;color:${brandPdf.sea};font-weight:700;margin-bottom:4px">CLIENTE</div>
    <div style="font-size:14px;font-weight:700;color:${brandPdf.navy}">${cliente.nombre}</div>
    ${direccion ? `<div style="font-size:11px;color:#555;margin-top:2px">${direccion}</div>` : ''}
    <div style="display:flex;gap:24px;margin-top:6px;font-size:11px;color:#555">
      ${cliente.telefono1 ? `<span>Tel: ${cliente.telefono1}</span>` : ''}
      ${cliente.cuit ? `<span>CUIT: ${cliente.cuit}</span>` : ''}
      <span>Vendedor: ${vendedor.nombre}</span>
    </div>
  </div>

  <!-- Table header -->
  <div style="margin:20px 24px 0;display:flex;align-items:center;background:${brandPdf.gold};padding:8px 16px;border-radius:6px 6px 0 0">
    <div style="width:100px;color:${brandPdf.navy};font-weight:700;font-size:11px;letter-spacing:1px;font-family:${brandPdf.fontBody};text-align:center">CANTIDAD</div>
    <div style="flex:1;color:${brandPdf.navy};font-weight:700;font-size:11px;letter-spacing:1px;font-family:${brandPdf.fontBody}">DETALLE</div>
  </div>

  <!-- Items -->
  <div style="margin:0 24px;border:1px solid ${brandPdf.light};border-top:none">
    <table><tbody>${rows}</tbody></table>
  </div>

  <!-- Firma -->
  <div style="margin:40px 24px 0;display:flex;gap:24px">
    <div style="flex:1;border-top:1px solid #999;padding-top:6px;font-size:10px;color:#666;font-family:${brandPdf.fontBody}">Recibí conforme</div>
    <div style="flex:1;border-top:1px solid #999;padding-top:6px;font-size:10px;color:#666;font-family:${brandPdf.fontBody}">Aclaración / DNI</div>
  </div>

  <!-- Footer -->
  <div style="margin:24px 24px 0;padding:10px 0;border-top:2px solid ${brandPdf.gold};text-align:center">
    <span style="color:${brandPdf.navy};font-size:9.5px;letter-spacing:2px;font-weight:700;font-family:${brandPdf.fontBody}">KIMAR</span>
    <span style="color:${brandPdf.gold};font-size:9.5px;letter-spacing:2px;font-family:${brandPdf.fontBody}">&nbsp;|&nbsp; EXCELENCIA EN CADA PROCESO</span>
    <div style="font-size:9px;color:${brandPdf.sea};margin-top:8px;font-family:${brandPdf.fontBody}">
      ${kimarContact.telefonoVentas} (Ventas) &nbsp;·&nbsp; ${kimarContact.telefonoAdmin} (Adm.) &nbsp;·&nbsp; ${kimarContact.emailVentas}
    </div>
    <div style="font-size:8.5px;color:#999;margin-top:6px;font-family:${brandPdf.fontBody}">Documento no válido como factura. Mercadería entregada según detalle.</div>
  </div>

  <script>
    window.onload = function() { setTimeout(function(){ window.print(); }, 500); };
  </script>
</body>
</html>`
}

export function downloadRemito(venta: Venta, cliente: Cliente, vendedor: Vendedor, productos: Producto[]): void {
  const logoUrl = `${window.location.origin}/logoLangoBackground.png`
  const html = buildRemitoHTML(venta, cliente, vendedor, productos, logoUrl)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
