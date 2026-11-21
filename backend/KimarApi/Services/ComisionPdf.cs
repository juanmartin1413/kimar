using System.Globalization;
using System.Text;
using System.Text.Json;
using KimarApi.Models.Entities;

namespace KimarApi.Services;

// Constancia interna: comparte el logo incorporado, sin emitir comprobantes fiscales.
public static class ComisionPdf
{
    private static string Escape(string s) => s.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)").Replace("\r", " ").Replace("\n", " ");
    private static string Pesos(decimal n) => "$ " + n.ToString("N2", CultureInfo.GetCultureInfo("es-AR"));
    public static byte[] Render(ComisionDocumento d)
    {
        var datos = JsonSerializer.Deserialize<ComisionSnapshot>(d.DatosJson, ComisionService.Json)!;
        var titulo = d.Tipo switch { "anticipo" => "PAGO A CUENTA DE COMISIONES", "devolucion" => "DEVOLUCION DE ANTICIPO", "contrapartida" => "CONTRAPARTIDA DE LIQUIDACION", _ => "LIQUIDACION DE COMISIONES" };
        var lines = new List<string>();
        void Add(string text)
        {
            // Máximo conservador aun para caracteres anchos; los nombres largos continúan en otra línea.
            text = text.Replace("\r", " ").Replace("\n", " ");
            while (text.Length > 64) { var cut = text.LastIndexOf(' ', 64, 64); if (cut < 20) cut = 64; lines.Add(text[..cut]); text = text[cut..].TrimStart(); }
            lines.Add(text);
        }
        Add($"Vendedor: {datos.Vendedor}");
        Add($"Fecha del movimiento: {d.Fecha:dd/MM/yyyy}");
        Add($"Forma de pago: {d.FormaPago ?? "Sin movimiento de dinero"}");
        Add($"Referencia: {d.Referencia ?? "-"}");
        if (d.OrigenId.HasValue) Add($"Documento relacionado: {d.OrigenId}");
        Add($"Tarifa: {Pesos(datos.Tarifa)} por kg. Productos por unidad excluidos.");
        Add($"Comisión de este movimiento: {Pesos(d.Comision)}");
        Add($"Compensado con pagos anteriores: {Pesos(d.Compensado)}");
        Add($"Importe pagado (negativo: devolución): {Pesos(d.Pago)}");
        if (d.Tipo == "contrapartida") Add("Esta contrapartida no revierte dinero entregado: queda a cuenta.");
        Add($"Motivo / observaciones: {d.Motivo ?? "-"}");
        Add("");
        foreach (var v in datos.Ventas)
        {
            Add($"VENTA | {v.Fecha:dd/MM/yyyy} | {v.Cliente}");
            Add($"Remito: {v.Remito ?? "-"} | Factura: {v.Factura ?? "-"}");
            Add($"Operación: {v.VentaId}");
            Add($"Total venta: {Pesos(v.TotalVenta)} | Cobrado: {Pesos(v.Cobrado)}");
            Add($"Kg: {v.Kilos:0.###} | Comisión total: {Pesos(v.Total)}");
            Add($"Sobre lo cobrado: {Pesos(v.Habilitada)} | Ya liquidado: {Pesos(v.Liquidada)}");
            Add($"COMISION EN ESTE DOCUMENTO: {Pesos(v.Pendiente)}");
            foreach (var i in v.Items) Add($"  {i.Nombre}: {i.Cantidad:0.###} {i.Unidad} | {(i.Unidad == "kg" ? Pesos(i.Comision) : "Excluido")}");
            foreach (var c in v.Cobros) Add($"  Cobro {c.Fecha:dd/MM/yyyy}: {Pesos(c.Monto)} | {c.Id}");
            Add("");
        }
        foreach (var a in datos.Aplicaciones) Add($"Anticipo N° {a.Numero:D8}: aplicado {Pesos(a.Monto)}; saldo {Pesos(a.Pendiente)}");
        Add($"Registrado: {d.Creado:yyyy-MM-dd HH:mm} UTC | Usuario: {d.UsuarioId}");
        Add("Constancia interna de comisiones. No es una factura.");
        using var logoStream = typeof(ComisionPdf).Assembly.GetManifestResourceStream("KimarApi.Assets.kimar-logo.jpg")!;
        using var logoBuffer = new MemoryStream(); logoStream.CopyTo(logoBuffer);
        var hex = Convert.ToHexString(logoBuffer.ToArray()) + ">";
        var objects = new List<string> { "", "",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
            $"<< /Type /XObject /Subtype /Image /Width 1024 /Height 1024 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length {hex.Length} >>\nstream\n{hex}\nendstream" };
        var pages = lines.Chunk(47).ToArray(); var ids = new List<int>();
        for (var p = 0; p < pages.Length; p++)
        {
            var content = new StringBuilder("q 64 0 0 64 36 754 cm /Logo Do Q\n0.08 0.18 0.18 rg\n");
            void Text(string t, int x, int y, int size, bool bold = false) => content.Append($"BT /F{(bold ? 2 : 1)} {size} Tf {x} {y} Td ({Escape(t)}) Tj ET\n");
            Text(titulo, 112, 790, 13, true); Text($"N° {d.Numero:D8}", 112, 770, 12);
            for (var n = 0; n < pages[p].Length; n++) Text(pages[p][n], 40, 730 - n * 14, 9);
            Text($"KIMAR | {d.Numero:D8} | Página {p + 1} de {pages.Length}", 40, 28, 8);
            var id = objects.Count + 1; ids.Add(id);
            objects.Add($"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Logo 5 0 R >> >> /Contents {id + 1} 0 R >>");
            var text = content.ToString(); objects.Add($"<< /Length {Encoding.Latin1.GetByteCount(text)} >>\nstream\n{text}endstream");
        }
        objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
        objects[1] = $"<< /Type /Pages /Count {pages.Length} /Kids [{string.Join(" ", ids.Select(id => $"{id} 0 R"))}] >>";
        using var output = new MemoryStream(); void Write(string s) => output.Write(Encoding.Latin1.GetBytes(s));
        Write("%PDF-1.4\n"); var offsets = new List<long>();
        for (var i = 0; i < objects.Count; i++) { offsets.Add(output.Position); Write($"{i + 1} 0 obj\n{objects[i]}\nendobj\n"); }
        var xref = output.Position; Write($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n");
        foreach (var offset in offsets) Write($"{offset:D10} 00000 n \n");
        Write($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n");
        return output.ToArray();
    }
}
