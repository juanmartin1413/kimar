using System.Text;
using System.Text.RegularExpressions;
using KimarApi.Models.Entities;
using KimarApi.Services;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class RemitoPdfTests
{
    [TestMethod]
    public void RemitoContainsCommercialDataAndValidPdfOffsets()
    {
        var venta = Venta(2);
        var bytes = RemitoPdf.Render(venta);
        var text = Encoding.Latin1.GetString(bytes);
        StringAssert.StartsWith(text, "%PDF-1.4");
        StringAssert.Contains(text, "00002-00000001");
        StringAssert.Contains(text, "Ana Bolena");
        StringAssert.Contains(text, "Manolo");
        StringAssert.Contains(text, "$ 242,00");
        StringAssert.Contains(text, "IVA 21%: $ 42,00");
        StringAssert.Contains(text, "Documento no válido como factura");
        Assert.IsFalse(text.Contains("CALIDAD_INTERNA"));
        var start = Regex.Match(text, @"startxref\n(\d+)");
        Assert.AreEqual("xref", text.Substring(int.Parse(start.Groups[1].Value), 4));
        foreach (Match offset in Regex.Matches(text, @"(?m)^(\d{10}) 00000 n"))
            Assert.IsTrue(Regex.IsMatch(text[int.Parse(offset.Groups[1].Value)..], @"^\d+ 0 obj"));
    }

    [TestMethod]
    public void LongRemitoPaginatesAndKeepsAllItemsAndSingleTotal()
    {
        var text = Encoding.Latin1.GetString(RemitoPdf.Render(Venta(80)));
        Assert.IsTrue(Regex.Matches(text, @"/Type /Page\b").Count > 1);
        foreach (var i in Enumerable.Range(1, 80))
            Assert.AreEqual(1, Regex.Matches(text, $"PRODUCTO_{i:D3}").Count);
        Assert.AreEqual(1, Regex.Matches(text, "TOTAL:").Count);
    }

    private static Venta Venta(int count) => new()
    {
        NroRemito = "00002-00000001", FechaEntrega = new DateOnly(2026, 11, 27),
        Total = count * 121, Iva = count * 21,
        Cliente = new() { Nombre = "Ana Bolena", Calle = "San Martín", Altura = "123", CodigoPostal = "1406" },
        Vendedor = new() { Nombre = "Manolo" },
        Items = Enumerable.Range(1, count).Select(i => new ItemVenta
        {
            Descripcion = $"PRODUCTO_{i:D3} descripción comercial extendida para probar varias líneas",
            Cantidad = 1, PrecioUnitario = 100, Subtotal = 100, Unidad = "kg",
            Calidad = new() { Nombre = "CALIDAD_INTERNA" }
        }).ToList()
    };
}
