using System.Text.Json;
using KimarApi.Controllers;
using KimarApi.Models.Entities;
using KimarApi.Services.Facturacion;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class FiltrosFacturacionTests
{
    private static JsonElement Body(IActionResult result) => JsonSerializer.SerializeToElement(((OkObjectResult)result).Value);

    [TestMethod]
    public async Task FiltersUseInclusiveDatesClientNumberAndKeepRelatedCreditNotes()
    {
        await using var f = await Fixture.Create();
        var controller = new FacturacionController(f.Db, f.Service, f.Config);
        var today = Fixture.Document(f.Venta.Id, f.Cliente.Id); today.Numero = 123;
        var boundary = Fixture.Document(f.Venta.Id, f.Cliente.Id); boundary.Fecha = FiscalRules.Hoy.AddDays(-6);
        var old = Fixture.Document(f.Venta.Id, f.Cliente.Id); old.Fecha = FiscalRules.Hoy.AddDays(-7);
        var future = Fixture.Document(f.Venta.Id, f.Cliente.Id); future.Fecha = FiscalRules.Hoy.AddDays(1);
        var otherClient = new Cliente { Nombre = "Otro cliente" }; f.Db.Add(otherClient);
        var other = Fixture.Document(f.Venta.Id, otherClient.Id); other.Numero = 123; other.PuntoVenta = 2;
        var nc = Fixture.Document(f.Venta.Id, f.Cliente.Id); nc.Tipo = 3; nc.Fecha = old.Fecha;
        nc.ComprobanteOrigenId = today.Id; nc.Estado = "autorizado";
        f.Db.AddRange(today, boundary, old, future, other, nc); await f.Db.SaveChangesAsync();

        Assert.AreEqual(3, Body(await controller.Listar(null, null)).GetProperty("total").GetInt32());
        var exact = Body(await controller.Listar(null, null, clienteId: f.Cliente.Id, numero: "00001-00000123"));
        Assert.AreEqual(1, exact.GetProperty("total").GetInt32());
        Assert.AreEqual(nc.Id, exact.GetProperty("relacionados")[0].GetProperty("Id").GetGuid());
        Assert.AreEqual(2, Body(await controller.Listar(null, null, numero: "123")).GetProperty("total").GetInt32());
        Assert.AreEqual(1, Body(await controller.Listar(null, null, fechaDesde: boundary.Fecha, fechaHasta: boundary.Fecha)).GetProperty("total").GetInt32());
        Assert.AreEqual(6, Body(await controller.Listar(null, null, todasFechas: true)).GetProperty("total").GetInt32());
        Assert.AreEqual(6, Body(await controller.Listar(f.Venta.Id, null)).GetProperty("total").GetInt32());
        Assert.AreEqual(0, Body(await controller.Listar(null, null, clienteId: Guid.NewGuid())).GetProperty("total").GetInt32());
        Assert.IsInstanceOfType(await controller.Listar(null, null, numero: "abc"), typeof(BadRequestObjectResult));
        Assert.IsInstanceOfType(await controller.Listar(null, null, fechaDesde: FiscalRules.Hoy, fechaHasta: old.Fecha), typeof(BadRequestObjectResult));
    }
}
