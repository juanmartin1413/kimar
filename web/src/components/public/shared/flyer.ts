// Flyer imprimible de la lista de precios (A4). Movido sin cambios desde
// app/(public)/productos/page.tsx para que lo compartan los tres estilos.
import { seedData } from '@/lib/seed'
import { formatPeso } from '@/lib/format'
import { brandPdf } from '@/lib/brandPdf'
import { kimarContact } from '@/lib/contact'

export function buildFlyerHTML(
  productos: typeof seedData.productos,
  logoUrl: string,
  dateStr: string,
): string {
  const rows = productos
    .map(
      (p, i) => `
    <tr>
      <td style="padding:5px 24px;background:${i % 2 === 0 ? '#ffffff' : brandPdf.rowAlt}">
        <div style="display:flex;align-items:flex-end;gap:4px">
          <span style="font-size:11px;color:#1a1a1a;white-space:nowrap;font-family:${brandPdf.fontBody}">${p.nombre}</span>
          <span style="flex:1;border-bottom:1px dotted #aaa;margin-bottom:3px;min-width:20px"></span>
          <span style="font-size:11.5px;font-weight:700;color:${brandPdf.gold};white-space:nowrap;font-family:monospace">${formatPeso(p.precioKg)}${p.unidad === 'unidad' ? '/u' : ''}</span>
        </div>
      </td>
    </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Kimar - Lista de precios - ${dateStr}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    @page{size:A4 portrait;margin:0}
    body{width:210mm;min-height:297mm;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    table{width:100%;border-collapse:collapse}
  </style>
</head>
<body>

  <!-- Header -->
  <div style="background:#fff;padding:20px 32px 14px;display:flex;align-items:center;gap:24px">
    <div style="width:76px;height:76px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid ${brandPdf.gold}">
      <img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover" />
    </div>
    <div style="flex:1;text-align:center">
      <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:${brandPdf.navy};font-family:${brandPdf.fontHeading}">KIMAR</div>
      <div style="font-size:9px;letter-spacing:6px;color:${brandPdf.gold};margin-top:3px;font-family:${brandPdf.fontHeading}">MARISCOS PREMIUM</div>
      <div style="color:${brandPdf.gold};font-size:12px;margin-top:5px">&#9670;</div>
    </div>
    <div style="border-left:1px solid #d0ccc0;padding-left:20px;font-size:10.5px;color:#333;line-height:2.2;font-family:${brandPdf.fontBody}">
      <div>&#9993;&nbsp; ${kimarContact.emailVentas}</div>
      <div>&#9993;&nbsp; ${kimarContact.emailAdmin}</div>
    </div>
  </div>

  <!-- Navy decorative band -->
  <div style="background:${brandPdf.navy};height:26px;border-radius:0 0 50% 50%/0 0 18px 18px;margin:0 -6px"></div>

  <!-- Table header -->
  <div style="display:flex;align-items:center;background:${brandPdf.gold};padding:10px 24px">
    <div style="flex:1;color:${brandPdf.navy};font-weight:700;font-size:12px;letter-spacing:2px;font-family:${brandPdf.fontBody}">
      &#128717;&nbsp; PRODUCTOS
    </div>
    <div style="color:${brandPdf.navy};font-weight:700;font-size:12px;letter-spacing:2px;font-family:${brandPdf.fontBody};display:flex;align-items:baseline;gap:6px">
      &#127991;&nbsp; PRECIOS <span style="font-weight:400;font-size:9px">X KG</span>
    </div>
  </div>

  <!-- Products -->
  <table><tbody>${rows}</tbody></table>

  <!-- Bottom badges -->
  <div style="background:${brandPdf.navy};margin:14px 24px 0;border-radius:6px;padding:12px 8px;display:flex;justify-content:space-around;align-items:center">
    <div style="text-align:center;color:${brandPdf.gold};font-size:8.5px;letter-spacing:0.5px;font-family:${brandPdf.fontBody};line-height:1.6">
      <div style="font-size:18px;margin-bottom:4px">&#127885;</div>
      <div style="font-weight:700">CALIDAD<br>PREMIUM</div>
    </div>
    <div style="text-align:center;color:${brandPdf.gold};font-size:8.5px;letter-spacing:0.5px;font-family:${brandPdf.fontBody};line-height:1.6">
      <div style="font-size:18px;margin-bottom:4px">&#10052;</div>
      <div style="font-weight:700">CADENA DE FR&Iacute;O<br>CONTROLADA</div>
    </div>
    <div style="text-align:center;color:${brandPdf.gold};font-size:8.5px;letter-spacing:0.5px;font-family:${brandPdf.fontBody};line-height:1.6">
      <div style="font-size:18px;margin-bottom:4px">&#128737;</div>
      <div style="font-weight:700">PROCESOS<br>CERTIFICADOS</div>
    </div>
    <div style="text-align:center;color:${brandPdf.gold};font-size:8.5px;letter-spacing:0.5px;font-family:${brandPdf.fontBody};line-height:1.6">
      <div style="font-size:18px;margin-bottom:4px">&#128666;</div>
      <div style="font-weight:700">LOG&Iacute;STICA<br>PROPIA</div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin:10px 24px 0;padding:10px 0;border-top:2px solid ${brandPdf.gold};text-align:center">
    <span style="color:${brandPdf.navy};font-size:10.5px;letter-spacing:3px;font-weight:700;font-family:${brandPdf.fontBody}">KIMAR</span>
    <span style="color:${brandPdf.gold};font-size:10.5px;letter-spacing:3px;font-family:${brandPdf.fontBody}">&nbsp;|&nbsp; EXCELENCIA EN CADA PROCESO</span>
  </div>

  <script>
    window.onload = function() { setTimeout(function(){ window.print(); }, 500); };
  </script>
</body>
</html>`
}
