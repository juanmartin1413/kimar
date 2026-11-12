using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using QRCoder;

namespace KimarApi.Services.Facturacion;

// PDF 1.4, fuente estándar Helvetica/WinAnsi y QR vectorial. Sin navegador ni fuentes del SO.
public class FiscalPdf(FiscalConfig config)
{
    private static string Escape(string s) => s.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)")
        .Replace("\r", " ").Replace("\n", " ");
    private static string N(decimal n) => n.ToString("0.##", CultureInfo.InvariantCulture);
    private static string Peso(decimal n) => "$ " + n.ToString("N2", CultureInfo.GetCultureInfo("es-AR"));
    public static string QrUrl(ComprobanteFiscal c, DatosFiscales data) => "https://www.arca.gob.ar/fe/qr/?p=" +
        Convert.ToBase64String(Encoding.UTF8.GetBytes(FiscalRules.Serialize(new {
            ver = 1, fecha = c.Fecha.ToString("yyyy-MM-dd"), cuit = long.Parse(c.CuitEmisor), ptoVta = c.PuntoVenta,
            tipoCmp = c.Tipo, nroCmp = c.Numero, importe = c.Total, moneda = "PES", ctz = 1,
            tipoDocRec = 80, nroDocRec = long.Parse(data.Receptor.Cuit), tipoCodAut = "E", codAut = long.Parse(c.Cae!)
        })));

    // Helvetica metrics in points / 1000. Accented Latin letters use their base glyph width.
    private static decimal Width(string value, decimal size)
    {
        int[] widths = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
            556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,
            667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,
            278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
        var normalized = value.Normalize(NormalizationForm.FormD);
        var sum = 0;
        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
            sum += ch is >= ' ' and <= '~' ? widths[ch - 32] : 556;
        }
        return sum * size / 1000m;
    }
    private static List<string> Wrap(string value, decimal maxWidth, int size = 9)
    {
        var lines = new List<string>();
        foreach (var paragraph in value.Replace("\r", "").Split('\n'))
        {
            var line = "";
            foreach (var word in paragraph.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            {
                var candidate = line.Length == 0 ? word : line + " " + word;
                if (Width(candidate, size) <= maxWidth) { line = candidate; continue; }
                if (line.Length > 0) { lines.Add(line); line = ""; }
                foreach (var ch in word)
                {
                    if (Width(line + ch, size) > maxWidth && line.Length > 0) { lines.Add(line); line = ""; }
                    line += ch;
                }
            }
            lines.Add(line);
        }
        return lines;
    }
    private static string DisplayDate(string value) => DateOnly.TryParse(value, out var date) ? date.ToString("dd/MM/yyyy") : value;
    private static readonly Lazy<byte[]> Logo = new(() =>
    {
        using var stream = typeof(FiscalPdf).Assembly.GetManifestResourceStream("KimarApi.Assets.kimar-logo.jpg")
            ?? throw new InvalidOperationException("No se encontró el logo incorporado de KIMAR.");
        using var buffer = new MemoryStream(); stream.CopyTo(buffer); return buffer.ToArray();
    });

    public static byte[] Render(ComprobanteFiscal c, ComprobanteFiscal? origen)
    {
        if (c.Estado != "autorizado" || c.Cae is null || c.Numero is null) throw new FiscalException("El comprobante todavía no está autorizado.");
        var d = FiscalRules.Deserialize<DatosFiscales>(c.DatosJson);
        var pages = new List<StringBuilder>();
        StringBuilder page = null!;
        decimal y = 0;
        const string ink = "0.08 0.18 0.18";
        const string muted = "0.35 0.4 0.4";
        const decimal left = 36, right = 559, floor = 55;
        decimal tableTop = 0;
        void Text(string value, decimal x, decimal atY, decimal size = 9, bool bold = false, string color = ink)
        {
            page.AppendLine($"{color} rg BT /{(bold ? "F2" : "F1")} {N(size)} Tf 1 0 0 1 {N(x)} {N(atY)} Tm ({Escape(value)}) Tj ET");
        }
        void Fit(string value, decimal x, decimal atY, decimal width, decimal size = 9, bool bold = false, bool alignRight = false, string color = ink)
        {
            var measured = Width(value, size) * (bold ? 1.08m : 1m);
            if (measured > width) size *= width / measured;
            Text(value, alignRight ? x + width - Width(value, size) * (bold ? 1.05m : 1m) : x, atY, size, bold, color);
        }
        void Box(decimal x, decimal bottom, decimal width, decimal height, string fill, bool border = false)
        {
            page.AppendLine($"{fill} rg 0.78 0.82 0.82 RG 0.5 w {N(x)} {N(bottom)} {N(width)} {N(height)} re {(border ? "B" : "f")}");
        }
        void Rule(decimal atY) => page.AppendLine($"0.78 0.82 0.82 RG 0.5 w {N(left)} {N(atY)} m {N(right)} {N(atY)} l S");
        void TableHeader()
        {
            Box(left, y - 25, right - left, 25, ink);
            Text("DESCRIPCIÓN", 44, y - 16, 8, true, "1 1 1");
            Text("CANT.", 260, y - 16, 8, true, "1 1 1");
            Text("UN.", 302, y - 16, 8, true, "1 1 1");
            Fit("PRECIO NETO", 337, y - 16, 73, 8, true, true, "1 1 1");
            Text("IVA", 429, y - 16, 8, true, "1 1 1");
            Fit("IMPORTE NETO", 460, y - 16, 91, 8, true, true, "1 1 1");
            y -= 25;
            tableTop = y;
        }
        void NewPage(bool table = true)
        {
            page = new StringBuilder(); pages.Add(page);
            // Same logo as the login, clipped to a circle like the site's avatar.
            page.AppendLine("q 110 772 m 110 791.88 93.88 808 74 808 c 54.12 808 38 791.88 38 772 c 38 752.12 54.12 736 74 736 c 93.88 736 110 752.12 110 772 c W n 72 0 0 72 38 736 cm /Logo Do Q");
            Text("KIMAR", 122, 782, 22, true);
            Text("COMPROBANTE ELECTRÓNICO", 123, 765, 7, false, muted);
            Box(286, 756, 43, 49, "0.95 0.96 0.95", true);
            Text("A", 296, 775, 25, true);
            Text($"CÓD. {c.Tipo:D2}", 292, 762, 7);
            Fit(c.Tipo == 1 ? "FACTURA" : "NOTA DE CRÉDITO", 345, 788, 214, 18, true);
            Text($"{c.PuntoVenta:D5}-{c.Numero:D8}", 345, 766, 16, true);
            Text($"Fecha de emisión: {c.Fecha:dd/MM/yyyy}", 345, 747, 9);
            Text("ORIGINAL", 345, 733, 7, true, muted);
            Rule(724);
            decimal issuerY = 708;
            foreach (var line in Wrap(d.Emisor.RazonSocial, 280, 10)) { Text(line, 44, issuerY, 10, true); issuerY -= 14; }
            foreach (var line in Wrap(d.Emisor.Domicilio, 280)) { Text(line, 44, issuerY); issuerY -= 13; }
            Text("IVA Responsable Inscripto", 44, issuerY, 9);
            decimal taxY = 708;
            foreach (var line in Wrap($"CUIT: {d.Emisor.Cuit}\nIngresos Brutos: {d.Emisor.IngresosBrutos}\nInicio de actividades: {DisplayDate(d.Emisor.InicioActividades)}", 206))
            { Text(line, 345, taxY); taxY -= 13; }
            y = Math.Min(issuerY - 18, taxY - 5);
            Rule(y);
            y -= 12;
            if (c.Ambiente != "production")
            {
                Box(left, y - 23, right - left, 23, "0.98 0.95 0.85");
                Text("HOMOLOGACIÓN  /  COMPROBANTE DE PRUEBA - SIN VALIDEZ FISCAL", 46, y - 15, 8, true);
                y -= 35;
            }
            var clientName = Wrap(d.Receptor.RazonSocial, 495, 11);
            var address = Wrap(d.Receptor.Domicilio, 495);
            var clientHeight = 72 + clientName.Count * 14 + address.Count * 12;
            Box(left, y - clientHeight, right - left, clientHeight, "0.96 0.97 0.97", true);
            Text("CLIENTE / RECEPTOR", 46, y - 15, 7, true, muted);
            decimal cy = y - 32;
            foreach (var line in clientName) { Text(line, 46, cy, 11, true); cy -= 14; }
            Text($"CUIT: {d.Receptor.Cuit}", 46, cy, 9);
            Fit(CondicionLabel(d.Receptor.CondicionIva), 245, cy, 304, 9); cy -= 15;
            foreach (var line in address) { Text(line, 46, cy); cy -= 12; }
            Text("Condición de venta: Cuenta corriente", 46, cy - 2, 8, false, muted);
            Text("Moneda: pesos argentinos  |  Precios unitarios sin IVA", 46, cy - 15, 8, false, muted);
            y -= clientHeight + 18;
            if (y < 335) throw new FiscalException("Los datos del emisor o receptor son demasiado extensos para el PDF.");
            if (table) TableHeader();
        }
        NewPage();
        var rowNumber = 0;
        foreach (var item in d.Items)
        {
            var lines = Wrap(item.Descripcion, 200);
            var units = Wrap(item.Unidad, 27, 8);
            var count = Math.Max(lines.Count, units.Count);
            var fullHeight = Math.Max(32, count * 12 + 16);
            // Keep normal rows together; split only descriptions taller than a whole table page.
            if (fullHeight <= tableTop - floor && y - fullHeight < floor) NewPage();
            var offset = 0;
            while (offset < count)
            {
                if (y - 30 < floor) NewPage();
                var take = Math.Min(count - offset, Math.Max(1, (int)((y - floor - 16) / 12)));
                var height = Math.Max(32, take * 12 + 16);
                Box(left, y - height, right - left, height, rowNumber % 2 == 0 ? "1 1 1" : "0.97 0.98 0.98");
                for (var n = 0; n < take; n++)
                {
                    if (offset + n < lines.Count) Text(lines[offset + n], 44, y - 16 - n * 12);
                    if (offset + n < units.Count) Text(units[offset + n], 300, y - 16 - n * 12, 8);
                }
                if (offset == 0)
                {
                    Fit(N(item.Cantidad), 256, y - 16, 33, 9, false, true);
                    Fit(Peso(item.Precio), 335, y - 16, 75, 9, false, true);
                    Text("21%", 427, y - 16, 8);
                    Fit(Peso(item.Neto), 458, y - 16, 93, 9, false, true);
                }
                y -= height; Rule(y); offset += take;
                if (offset < count) NewPage();
            }
            rowNumber++;
        }
        void Note(string label, string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return;
            y -= 13;
            foreach (var line in Wrap(label + value, 500))
            {
                if (y - 15 < floor) NewPage(false);
                Text(line, 44, y - 12, 9, false, muted); y -= 13;
            }
        }
        if (origen is not null) Note("Factura asociada: ", $"A {origen.PuntoVenta:D5}-{origen.Numero:D8} del {origen.Fecha:dd/MM/yyyy}");
        Note("Motivo: ", c.Motivo);
        Note("Observaciones: ", d.Observaciones);
        // Fixed closing section keeps amounts and authorization together on the last page.
        if (y < 290) NewPage(false);
        Rule(271);
        Text("RESUMEN DEL COMPROBANTE", 44, 250, 8, true, muted);
        Text("Importes expresados en pesos argentinos.", 44, 232, 8, false, muted);
        Box(327, 168, 232, 95, "0.96 0.97 0.97", true);
        Text("Neto gravado", 339, 244, 9);
        Fit(Peso(c.Neto), 421, 244, 125, 11, false, true);
        Text("IVA 21%", 339, 223, 9);
        Fit(Peso(c.Iva), 421, 223, 125, 11, false, true);
        Box(327, 168, 232, 37, ink);
        Text("TOTAL", 339, 181, 11, true, "1 1 1");
        Fit(Peso(c.Total), 392, 179, 154, 17, true, true, "1 1 1");
        if (d.Receptor.CondicionIva is 6 or 13 or 16)
        {
            var legalY = 154m;
            foreach (var line in Wrap("El crédito fiscal discriminado en el presente comprobante sólo podrá ser computado a efectos del Régimen de Sostenimiento e Inclusión Fiscal para Pequeños Contribuyentes de la Ley Nº 27.618.", 510, 7))
            { Text(line, 44, legalY, 7, false, muted); legalY -= 9; }
        }
        using var qr = QRCodeGenerator.GenerateQrCode(QrUrl(c, d), QRCodeGenerator.ECCLevel.M);
        const decimal side = 90, qrBottom = 42;
        var unit = side / qr.ModuleMatrix.Count;
        page.AppendLine("0 0 0 rg");
        for (var row = 0; row < qr.ModuleMatrix.Count; row++)
            for (var col = 0; col < qr.ModuleMatrix.Count; col++)
                if (qr.ModuleMatrix[row][col]) page.AppendLine($"{N(36 + col * unit)} {N(qrBottom + (qr.ModuleMatrix.Count - row - 1) * unit)} {N(unit + .02m)} {N(unit + .02m)} re f");
        Text("COMPROBANTE AUTORIZADO", 142, 112, 9, true);
        Text($"CAE: {c.Cae}", 142, 93, 11, true);
        Text($"Vencimiento del CAE: {c.VencimientoCae:dd/MM/yyyy}", 142, 77, 9);
        Text("Verificá los datos del comprobante mediante el código QR.", 142, 59, 8, false, muted);
        if (c.Ambiente != "production") Text("Documento de homologación. Sin validez fiscal.", 142, 45, 8, true, muted);
        var logoHex = Convert.ToHexString(Logo.Value) + ">";
        var objects = new List<string> { "", "",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
            $"<< /Type /XObject /Subtype /Image /Width 1024 /Height 1024 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length {logoHex.Length} >>\nstream\n{logoHex}\nendstream" };
        var pageIds = new List<int>();
        for (var i = 0; i < pages.Count; i++)
        {
            page = pages[i]; Rule(31);
            Text($"KIMAR  |  {(c.Tipo == 1 ? "Factura A" : "Nota de crédito A")}  {c.PuntoVenta:D5}-{c.Numero:D8}", 36, 18, 7, false, muted);
            Fit($"Página {i + 1} de {pages.Count}", 455, 18, 104, 8, false, true, muted);
            var pageId = objects.Count + 1; var streamId = pageId + 1; pageIds.Add(pageId);
            objects.Add($"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Logo 5 0 R >> >> /Contents {streamId} 0 R >>");
            var content = pages[i].ToString();
            objects.Add($"<< /Length {Encoding.Latin1.GetByteCount(content)} >>\nstream\n{content}endstream");
        }
        objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
        objects[1] = $"<< /Type /Pages /Count {pages.Count} /Kids [{string.Join(" ", pageIds.Select(i => $"{i} 0 R"))}] >>";
        using var output = new MemoryStream();
        void Write(string s) => output.Write(Encoding.Latin1.GetBytes(s));
        Write("%PDF-1.4\n%âãÏÓ\n");
        var offsets = new List<long>();
        for (var i = 0; i < objects.Count; i++) { offsets.Add(output.Position); Write($"{i + 1} 0 obj\n{objects[i]}\nendobj\n"); }
        var xref = output.Position;
        Write($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n");
        foreach (var offset in offsets) Write($"{offset:D10} 00000 n \n");
        Write($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n");
        return output.ToArray();
    }
    private static string CondicionLabel(int id) => id switch { 1 => "IVA Responsable Inscripto", 6 => "Responsable Monotributo", 13 => "Monotributista Social", 16 => "Monotributo Trabajador Independiente Promovido", _ => "" };
    public async Task<(string Path, string Hash)> SaveAsync(ComprobanteFiscal c, ComprobanteFiscal? original, CancellationToken ct)
    {
        var bytes = Render(c, original);
        var relative = Path.Combine(c.Ambiente, c.CuitEmisor, c.Id + ".pdf");
        var path = Path.Combine(config.StorageRoot, relative);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var temp = path + ".tmp";
        await File.WriteAllBytesAsync(temp, bytes, ct);
        File.Move(temp, path, true);
        return (relative, Convert.ToHexString(SHA256.HashData(bytes)));
    }
}
