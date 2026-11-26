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
        const string ink = "0.06 0.18 0.20", muted = "0.35 0.42 0.44";
        var pages = new List<StringBuilder>();
        StringBuilder content = null!;
        var y = 0;
        void Text(string text, int x, int atY, int size, bool bold = false, string color = ink) =>
            content.Append($"{color} rg BT /F{(bold ? 2 : 1)} {size} Tf {x} {atY} Td ({Escape(text)}) Tj ET\n");
        void Box(int x, int bottom, int width, int height, string color) => content.Append($"{color} rg {x} {bottom} {width} {height} re f\n");
        void NewPage()
        {
            content = new StringBuilder(); pages.Add(content);
            content.Append("q 76 0 0 76 36 744 cm /Logo Do Q\n");
            Text(titulo, 128, 793, 14, true);
            Text($"Constancia N° {d.Numero:D8}", 128, 768, 11, false, muted);
            Box(36, 729, 523, 2, "0.72 0.62 0.35"); y = 704;
        }
        void Ensure(int height) { if (y - height < 62) NewPage(); }
        IEnumerable<string> Wrap(string text, int max = 56)
        {
            foreach (var paragraph in text.Replace("\r", "").Split('\n'))
            {
                var remaining = paragraph;
                while (remaining.Length > max)
                {
                    var cut = remaining.LastIndexOf(' ', max, max); if (cut < 15) cut = max;
                    yield return remaining[..cut]; remaining = remaining[cut..].TrimStart();
                }
                yield return remaining;
            }
        }
        void Add(string text, bool bold = false)
        {
            foreach (var line in Wrap(text)) { Ensure(16); Text(line, 48, y, 10, bold); y -= 16; }
        }
        void Section(string text)
        {
            Ensure(76); Box(36, y - 23, 523, 29, "0.94 0.96 0.96");
            Text(text, 48, y - 13, 10, true); y -= 47;
        }
        void Field(string label, string value)
        {
            var lines = Wrap(value, 46).ToArray(); Ensure(22 + lines.Length * 16);
            Text(label, 48, y, 8, true, muted); y -= 19;
            foreach (var line in lines) { Text(line, 48, y, 11, true); y -= 16; }
            y -= 12;
        }
        NewPage();
        Section("DATOS DEL VENDEDOR Y DEL PAGO");
        Field("VENDEDOR", datos.Vendedor);
        Field("FECHA DE PAGO", d.Fecha.ToString("dd/MM/yyyy"));
        var forma = d.FormaPago switch { "transferencia" => "Transferencia", "efectivo" => "Efectivo", "cheque" => "Cheque", _ => "Sin movimiento de dinero" };
        Field("FORMA DE PAGO", forma);
        if (!string.IsNullOrWhiteSpace(d.Referencia)) Field("REFERENCIA", d.Referencia);
        Ensure(100);
        Box(36, y - 72, 523, 82, ink);
        var importeLabel = d.Tipo switch { "anticipo" => "Comisión adelantada", "devolucion" => "Importe devuelto", _ => "Importe pagado" };
        Text(importeLabel, 52, y - 12, 11, true, "1 1 1");
        Text(Pesos(Math.Abs(d.Pago)), 52, y - 48, 26, true, "1 1 1"); y -= 101;
        if (d.Tipo is "liquidacion" or "contrapartida")
        {
            Section("RESUMEN DE LA LIQUIDACIÓN");
            Add($"Comisión de este movimiento: {Pesos(d.Comision)}");
            Add($"Compensado con pagos anteriores: {Pesos(d.Compensado)}");
            if (!datos.CompensarAdelantos) Add("Adelantos sin compensar: conservan su saldo pendiente.");
            Add($"Tarifa por kg: {Pesos(datos.Tarifa)}");
        }
        if (d.Tipo == "contrapartida") Add("El dinero entregado se conserva como saldo a cuenta.");
        if (!string.IsNullOrWhiteSpace(d.Motivo)) { Section("MOTIVO / OBSERVACIONES"); Add(d.Motivo); y -= 12; }
        if (d.Tipo == "anticipo")
        {
            Add("Este adelanto queda registrado a cuenta de futuras");
            Add("liquidaciones de comisiones del vendedor.");
        }
        foreach (var v in datos.Ventas)
        {
            Section($"VENTA DEL {v.Fecha:dd/MM/yyyy}");
            Add(v.Cliente, true);
            Add($"Remito: {v.Remito ?? "-"} | Factura: {v.Factura ?? "-"}");
            Add($"Total venta: {Pesos(v.TotalVenta)} | Cobrado: {Pesos(v.Cobrado)}");
            Add($"Kg: {v.Kilos:0.###} | Comisión total: {Pesos(v.Total)}");
            Add($"Sobre lo cobrado: {Pesos(v.Habilitada)} | Ya liquidado: {Pesos(v.Liquidada)}");
            Add($"COMISION EN ESTE DOCUMENTO: {Pesos(v.Pendiente)}");
            foreach (var i in v.Items) Add($"  {i.Nombre}: {i.Cantidad:0.###} {i.Unidad} | {(i.Unidad == "kg" ? Pesos(i.Comision) : "Excluido")}");
            foreach (var c in v.Cobros) Add($"  Cobro {c.Fecha:dd/MM/yyyy}: {Pesos(c.Monto)}");
            Add("");
        }
        foreach (var a in datos.Aplicaciones) Add($"Anticipo N° {a.Numero:D8}: aplicado {Pesos(a.Monto)}; saldo {Pesos(a.Pendiente)}");
        using var logoStream = typeof(ComisionPdf).Assembly.GetManifestResourceStream("KimarApi.Assets.kimar-logo.jpg")!;
        using var logoBuffer = new MemoryStream(); logoStream.CopyTo(logoBuffer);
        var hex = Convert.ToHexString(logoBuffer.ToArray()) + ">";
        var objects = new List<string> { "", "",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
            $"<< /Type /XObject /Subtype /Image /Width 1024 /Height 1024 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length {hex.Length} >>\nstream\n{hex}\nendstream" };
        var ids = new List<int>();
        for (var p = 0; p < pages.Count; p++)
        {
            content = pages[p];
            Box(36, 51, 523, 1, "0.80 0.84 0.84");
            Text("Constancia interna de comisiones. No es una factura.", 36, 36, 8, false, muted);
            Text($"N° {d.Numero:D8} | Página {p + 1} de {pages.Count}", 36, 22, 8, false, muted);
            var id = objects.Count + 1; ids.Add(id);
            objects.Add($"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Logo 5 0 R >> >> /Contents {id + 1} 0 R >>");
            var text = content.ToString(); objects.Add($"<< /Length {Encoding.Latin1.GetByteCount(text)} >>\nstream\n{text}endstream");
        }
        objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
        objects[1] = $"<< /Type /Pages /Count {pages.Count} /Kids [{string.Join(" ", ids.Select(id => $"{id} 0 R"))}] >>";
        using var output = new MemoryStream(); void Write(string s) => output.Write(Encoding.Latin1.GetBytes(s));
        Write("%PDF-1.4\n"); var offsets = new List<long>();
        for (var i = 0; i < objects.Count; i++) { offsets.Add(output.Position); Write($"{i + 1} 0 obj\n{objects[i]}\nendobj\n"); }
        var xref = output.Position; Write($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n");
        foreach (var offset in offsets) Write($"{offset:D10} 00000 n \n");
        Write($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n");
        return output.ToArray();
    }
}
