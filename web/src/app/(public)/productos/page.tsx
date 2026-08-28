'use client'

import { useEffect, useState } from 'react'
import { seedData } from '@/lib/seed'
import { formatPeso } from '@/lib/format'
import { brandPdf } from '@/lib/brandPdf'
import { kimarContact } from '@/lib/contact'
import { useTheme } from '@/contexts/ThemeContext'
import { Download } from 'lucide-react'

type Producto = (typeof seedData.productos)[number]

function buildFlyerHTML(
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

export default function ProductosPage() {
  const { palette } = useTheme()
  const k = palette === 'kimar'

  const [productos, setProductos] = useState<Producto[]>(
    [...seedData.productos].sort((a, b) => a.orden - b.orden),
  )

  useEffect(() => {
    fetch(`${process.env.API_URL}/api/productos?activo=true`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: Producto[]) => setProductos([...data].sort((a, b) => a.orden - b.orden)))
      .catch(() => {})
  }, [])

  function handleDownload() {
    const allProducts = productos.filter(p => p.activo)
    const now = new Date()
    const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const logoUrl = `${window.location.origin}/logoLangoBackground.png`
    const html = buildFlyerHTML(allProducts, logoUrl, dateStr)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16" style={{ backgroundColor: k ? '#F5F2E8' : undefined, minHeight: '100%' }}>
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-bold" style={{ color: k ? '#2B2B2B' : 'oklch(0.25 0.08 240)' }}>
          Lista de Precios
        </h1>
        <p style={{ color: k ? '#6F8C87' : 'oklch(0.45 0.04 240)' }} className="max-w-xl mx-auto">
          Precios por kg, sujetos a cambios sin previo aviso. Consultá disponibilidad con tu vendedor.
        </p>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          style={{ backgroundColor: k ? '#C7A35A' : 'oklch(0.42 0.14 240)' }}
        >
          <Download className="w-4 h-4" />
          Descargar Lista
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {productos.map(p => (
          <div
            key={p.id}
            className="flex justify-between items-center py-3 px-4 rounded-lg"
          >
            <span className="font-medium" style={{ color: k ? '#2B2B2B' : 'oklch(0.3 0.06 240)' }}>
              {p.nombre}
            </span>
            <span className="font-bold tabular-nums" style={{ color: k ? '#C7A35A' : 'oklch(0.42 0.14 240)' }}>
              {formatPeso(p.precioKg)}{p.unidad === 'unidad' ? '/u' : '/kg'}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs mt-12" style={{ color: k ? '#6F8C87' : 'oklch(0.55 0.04 240)' }}>
        * Precios en Pesos Argentinos (ARS). /kg = por kilogramo · /u = por unidad. IVA no incluido.
        Cantidades mínimas según producto.
      </p>
    </div>
  )
}
