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

    public static byte[] Render(ComprobanteFiscal c, ComprobanteFiscal? origen)
    {
        if (c.Estado != "autorizado" || c.Cae is null || c.Numero is null) throw new FiscalException("El comprobante todavía no está autorizado.");
        var d = FiscalRules.Deserialize<DatosFiscales>(c.DatosJson);
        var pages = new List<StringBuilder>();
        StringBuilder page = null!;
        decimal y = 0;
        void Text(string value, decimal x, decimal atY, int size = 10) => page.AppendLine($"BT /F1 {size} Tf 1 0 0 1 {N(x)} {N(atY)} Tm ({Escape(value)}) Tj ET");
        void NewPage()
        {
            page = new StringBuilder(); pages.Add(page); y = 790;
            Text(c.Tipo == 1 ? "FACTURA A" : "NOTA DE CREDITO A", 40, y, 20);
            Text($"Código {c.Tipo:D3} - {c.PuntoVenta:D5}-{c.Numero:D8}", 330, y, 12); y -= 23;
            Text($"Fecha: {c.Fecha:dd/MM/yyyy} - ORIGINAL", 330, y);
            Text(d.Emisor.RazonSocial, 40, y, 12); y -= 18;
            Text($"CUIT: {d.Emisor.Cuit} - IVA Responsable Inscripto", 40, y); y -= 16;
            Text(d.Emisor.Domicilio, 40, y); y -= 16;
            Text($"Ingresos brutos: {d.Emisor.IngresosBrutos} - Inicio actividades: {d.Emisor.InicioActividades}", 40, y); y -= 20;
            if (c.Ambiente != "production") { Text("HOMOLOGACION - COMPROBANTE DE PRUEBA - SIN VALIDEZ FISCAL", 40, y, 11); y -= 20; }
            Text($"Cliente: {d.Receptor.RazonSocial}", 40, y); y -= 16;
            Text($"CUIT: {d.Receptor.Cuit} - {CondicionLabel(d.Receptor.CondicionIva)}", 40, y); y -= 16;
            Text(d.Receptor.Domicilio, 40, y); y -= 16;
            Text("Condición de venta: Cuenta corriente - Moneda: Pesos argentinos", 40, y); y -= 22;
            Text("Descripción / cantidad / precio neto / importe neto / IVA", 40, y); y -= 20;
        }
        void Line(string value)
        {
            if (y < 70) NewPage();
            Text(value, 40, y); y -= 15;
        }
        IEnumerable<string> Wrap(string text, int width = 92)
        {
            var clean = text.Replace('\r', ' ').Replace('\n', ' ');
            for (var pos = 0; pos < clean.Length; pos += width) yield return clean.Substring(pos, Math.Min(width, clean.Length - pos));
        }
        NewPage();
        foreach (var i in d.Items)
        {
            foreach (var line in Wrap(i.Descripcion)) Line(line);
            Line($"    {N(i.Cantidad)} {i.Unidad} x {Peso(i.Precio)} = {Peso(i.Neto)}   IVA 21%");
            y -= 5;
        }
        if (origen is not null) Line($"Factura asociada: A {origen.PuntoVenta:D5}-{origen.Numero:D8} del {origen.Fecha:dd/MM/yyyy}");
        foreach (var line in Wrap(c.Motivo ?? "")) Line("Motivo: " + line);
        foreach (var line in Wrap(d.Observaciones ?? "")) Line(line);
        if (y < 290) NewPage();
        y -= 10;
        Line($"Neto gravado: {Peso(c.Neto)}"); Line($"IVA 21%: {Peso(c.Iva)}");
        Text($"TOTAL: {Peso(c.Total)}", 40, y, 16); y -= 25;
        if (d.Receptor.CondicionIva is 6 or 13 or 16)
        {
            Line("El crédito fiscal discriminado en el presente comprobante sólo podrá ser computado a efectos");
            Line("del Régimen de Sostenimiento e Inclusión Fiscal para Pequeños Contribuyentes de la Ley Nº 27.618.");
        }
        Line($"CAE: {c.Cae} - Vencimiento CAE: {c.VencimientoCae:dd/MM/yyyy}");
        using var qr = QRCodeGenerator.GenerateQrCode(QrUrl(c, d), QRCodeGenerator.ECCLevel.M);
        const decimal side = 110;
        var unit = side / qr.ModuleMatrix.Count;
        for (var row = 0; row < qr.ModuleMatrix.Count; row++)
            for (var col = 0; col < qr.ModuleMatrix.Count; col++)
                if (qr.ModuleMatrix[row][col]) page.AppendLine($"{N(40 + col * unit)} {N(y - side + (qr.ModuleMatrix.Count - row - 1) * unit)} {N(unit + .02m)} {N(unit + .02m)} re f");
        var objects = new List<string> { "", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>" };
        var pageIds = new List<int>();
        for (var i = 0; i < pages.Count; i++)
        {
            pages[i].AppendLine($"BT /F1 9 Tf 1 0 0 1 450 30 Tm (Página {i + 1} de {pages.Count}) Tj ET");
            var pageId = objects.Count + 1; var streamId = pageId + 1; pageIds.Add(pageId);
            objects.Add($"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents {streamId} 0 R >>");
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
