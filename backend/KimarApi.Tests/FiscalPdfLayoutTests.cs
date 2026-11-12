using System.Text;
using System.Text.RegularExpressions;
using KimarApi.Models.DTOs;
using KimarApi.Services.Facturacion;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class FiscalPdfLayoutTests
{
    [TestMethod]
    public void InvoiceEmbedsLogoAndKeepsAuthorizationAndAmounts()
    {
        var c = Fixture.Document(Guid.NewGuid(), Guid.NewGuid());
        c.Estado = "autorizado"; c.Numero = 1; c.Cae = "12345678901234";
        c.VencimientoCae = c.Fecha.AddDays(10);
        var before = c.DatosJson;
        var text = Encoding.Latin1.GetString(FiscalPdf.Render(c, null));
        StringAssert.Contains(text, "/Subtype /Image");
        StringAssert.Contains(text, "/Logo Do");
        StringAssert.Contains(text, "00001-00000001");
        StringAssert.Contains(text, "$ 121,00");
        StringAssert.Contains(text, c.Cae);
        StringAssert.Contains(text, "SIN VALIDEZ FISCAL");
        Assert.AreEqual(before, c.DatosJson);
        Assert.AreEqual(1, Regex.Matches(text, @"/Type /Page\b").Count);
        c.Ambiente = "production";
        Assert.IsFalse(Encoding.Latin1.GetString(FiscalPdf.Render(c, null)).Contains("SIN VALIDEZ FISCAL"));
    }

    [TestMethod]
    public void LongCreditNotePaginatesWithoutLosingItemsOrDuplicatingTotal()
    {
        var c = Fixture.Document(Guid.NewGuid(), Guid.NewGuid());
        c.Estado = "autorizado"; c.Tipo = 3; c.Numero = 7; c.Cae = "12345678901234";
        c.Motivo = "Corrección de comprobante";
        var data = FiscalRules.Deserialize<DatosFiscales>(c.DatosJson);
        var items = Enumerable.Range(1, 35).Select(i => new ItemFiscal(
            $"PRODUCTO_{i:D3} con descripción extendida para revisar el ajuste por palabras en varias líneas, presentación de mercadería", 1, "kg", 100, 100, 21)).ToList();
        data = data with { Items = items, Observaciones = new string('X', 1500) };
        c.DatosJson = FiscalRules.Serialize(data);
        c.Neto = 3500; c.Iva = 735; c.Total = 4235;
        var origin = Fixture.Document(c.VentaId!.Value, c.ClienteId); origin.Numero = 2;
        var text = Encoding.Latin1.GetString(FiscalPdf.Render(c, origin));
        var pages = Regex.Matches(text, @"/Type /Page\b").Count;
        Assert.IsTrue(pages > 1 && pages < 12);
        foreach (var i in Enumerable.Range(1, 35))
            Assert.AreEqual(1, Regex.Matches(text, $"PRODUCTO_{i:D3}").Count);
        Assert.AreEqual(1, Regex.Matches(text, @"\(TOTAL\)").Count);
        StringAssert.Contains(text, "Factura asociada:");
        StringAssert.Contains(text, "00001-00000002");
        StringAssert.Contains(text, $"Página {pages} de {pages}");
        // Text baselines stay inside the A4 sheet, including continuation pages.
        foreach (Match position in Regex.Matches(text, @"1 0 0 1 [\d.]+ ([\d.]+) Tm"))
        {
            var y = decimal.Parse(position.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture);
            Assert.IsTrue(y >= 18 && y <= 808);
        }
    }
}
