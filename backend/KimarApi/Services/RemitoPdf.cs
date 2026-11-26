using System.Globalization;
using System.Text;
using KimarApi.Models.Entities;

namespace KimarApi.Services;

// PDF descargable, con el mismo logo incorporado que los comprobantes fiscales.
public static class RemitoPdf
{
    private static string Escape(string s) => s.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)").Replace("\r", " ").Replace("\n", " ");
    private static string Peso(decimal n) => "$ " + n.ToString("N2", CultureInfo.GetCultureInfo("es-AR"));
    private static IEnumerable<string> Wrap(string text, int max)
    {
        foreach (var paragraph in text.Replace("\r", "").Split('\n'))
        {
            var rest = paragraph;
            while (rest.Length > max)
            {
                var cut = rest.LastIndexOf(' ', max, max);
                if (cut < 1) cut = max;
                yield return rest[..cut];
                rest = rest[cut..].TrimStart();
            }
            yield return rest;
        }
    }

    public static byte[] Render(Venta venta)
    {
        const string navy = "0.02 0.12 0.20", gold = "0.72 0.62 0.35";
        var pages = new List<StringBuilder>();
        StringBuilder page = null!;
        var y = 0;
        void Text(string text, int x, int atY, int size = 10, bool bold = false) =>
            page.Append($"{navy} rg BT /F{(bold ? 2 : 1)} {size} Tf {x} {atY} Td ({Escape(text)}) Tj ET\n");
        void NewPage()
        {
            page = new(); pages.Add(page);
            page.Append("q 64 0 0 64 36 744 cm /Logo Do Q\n");
            Text("KIMAR", 118, 785, 24, true);
            Text("MARISCOS PREMIUM", 118, 764, 9);
            Text("REMITO", 385, 790, 15, true);
            Text($"N° {venta.NroRemito}", 385, 769);
            Text(venta.FechaEntrega.ToString("dd/MM/yyyy"), 385, 752);
            page.Append($"{gold} rg 36 731 523 3 re f\n");
            y = 710;
        }
        void Ensure(int height) { if (y - height < 70) NewPage(); }
        void Lines(string text, bool bold = false)
        {
            foreach (var line in Wrap(text, 51)) { Ensure(15); Text(line, 44, y, 10, bold); y -= 15; }
        }
        void TableHeader()
        {
            page.Append($"{gold} rg 36 {y - 6} 523 22 re f\n");
            Text("CANTIDAD", 44, y, 9, true); Text("DETALLE", 120, y, 9, true);
            Text("P. UNITARIO", 370, y, 9, true); Text("SUBTOTAL", 470, y, 9, true);
            y -= 28;
        }
        NewPage();
        Lines("CLIENTE", true); Lines(venta.Cliente.Nombre, true);
        var c = venta.Cliente;
        Lines(string.Join(" - ", new[] { $"{c.Calle} {c.Altura}".Trim(), c.Localidad, c.Provincia, c.CodigoPostal }.Where(s => !string.IsNullOrWhiteSpace(s))));
        if (!string.IsNullOrWhiteSpace(c.Cuit)) Lines($"CUIT: {c.Cuit}");
        if (!string.IsNullOrWhiteSpace(c.Telefono1)) Lines($"Tel: {c.Telefono1}");
        Lines($"Vendedor: {venta.Vendedor.Nombre}"); y -= 20;
        Ensure(60); TableHeader();
        foreach (var item in venta.Items)
        {
            // Sólo descripción comercial: nunca se imprime la calidad interna.
            var lines = Wrap(item.Descripcion, 27).ToArray();
            if (y - Math.Min(lines.Length * 14 + 12, 100) < 70) { NewPage(); TableHeader(); }
            Text($"{item.Cantidad.ToString("0.###", CultureInfo.GetCultureInfo("es-AR"))} {(item.Unidad == "unidad" ? "u" : item.Unidad)}", 44, y, 9);
            Text(Peso(item.PrecioUnitario), 370, y, 9); Text(Peso(item.Subtotal), 470, y, 9, true);
            foreach (var line in lines)
            {
                if (y - 14 < 70) { NewPage(); TableHeader(); }
                Text(line, 120, y, 9); y -= 14;
            }
            y -= 12;
        }
        Ensure(120); y -= 12;
        if (venta.Iva != 0) Lines($"Neto: {Peso(venta.Total - venta.Iva)} | IVA 21%: {Peso(venta.Iva)}");
        Lines($"TOTAL: {Peso(venta.Total)}", true);
        y -= 40; Text("Recibí conforme: __________________", 44, y, 9);
        Text("Aclaración / DNI: __________________", 310, y, 9);

        using var logo = typeof(RemitoPdf).Assembly.GetManifestResourceStream("KimarApi.Assets.kimar-logo.jpg")!;
        using var buffer = new MemoryStream(); logo.CopyTo(buffer);
        var hex = Convert.ToHexString(buffer.ToArray()) + ">";
        var objects = new List<string> { "", "",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
            $"<< /Type /XObject /Subtype /Image /Width 1024 /Height 1024 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length {hex.Length} >>\nstream\n{hex}\nendstream" };
        var ids = new List<int>();
        for (var i = 0; i < pages.Count; i++)
        {
            page = pages[i];
            Text("Ventas: +54 9 11 3012-3555 | Adm.: +54 9 11 2572-7299 | ventas@kimarcompany.com", 36, 55, 8);
            Text("Documento no válido como factura. Mercadería entregada según detalle.", 36, 40, 8);
            Text($"KIMAR | Remito {venta.NroRemito} | Página {i + 1} de {pages.Count}", 36, 24, 8);
            var id = objects.Count + 1; ids.Add(id);
            objects.Add($"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Logo 5 0 R >> >> /Contents {id + 1} 0 R >>");
            var content = page.ToString(); objects.Add($"<< /Length {Encoding.Latin1.GetByteCount(content)} >>\nstream\n{content}endstream");
        }
        objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
        objects[1] = $"<< /Type /Pages /Count {pages.Count} /Kids [{string.Join(" ", ids.Select(id => $"{id} 0 R"))}] >>";
        using var output = new MemoryStream();
        void Write(string s) => output.Write(Encoding.Latin1.GetBytes(s));
        Write("%PDF-1.4\n"); var offsets = new List<long>();
        for (var i = 0; i < objects.Count; i++) { offsets.Add(output.Position); Write($"{i + 1} 0 obj\n{objects[i]}\nendobj\n"); }
        var xref = output.Position; Write($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n");
        foreach (var offset in offsets) Write($"{offset:D10} 00000 n \n");
        Write($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n");
        return output.ToArray();
    }
}
