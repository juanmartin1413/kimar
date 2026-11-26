using System.Text.Json;
using KimarApi.Controllers;
using KimarApi.Models.Entities;
using KimarApi.Services.Facturacion;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class TrazabilidadTests
{
    private static JsonElement Body(IActionResult result) => JsonSerializer.SerializeToElement(((OkObjectResult)result).Value);

    [TestMethod]
    public async Task TimelineFiltersPagesAndKeepsPaymentAndFiscalRelations()
    {
        await using var f = await Fixture.Create();
        var c = new TrazabilidadController(f.Db);
        f.Cliente.Activo = false;
        var old = Fixture.Document(f.Venta.Id, f.Cliente.Id); old.Fecha = FiscalRules.Hoy.AddDays(-35);
        var nc = Fixture.Document(f.Venta.Id, f.Cliente.Id); nc.Tipo = 3; nc.ComprobanteOrigenId = old.Id;
        f.Db.AddRange(old, nc); f.AddPago(60);
        f.Venta.FechaListo = DateTime.UtcNow; f.Venta.FechaEntregado = DateTime.UtcNow;
        await f.Db.SaveChangesAsync();
        var body = Body(await c.Listar(f.Cliente.Id));
        Assert.AreEqual(5, body.GetProperty("total").GetInt32());
        Assert.AreEqual(1, body.GetProperty("items").EnumerateArray().Count(x => x.GetProperty("Tipo").GetString() == "pago"));
        var detail = Body(await c.Detalle(f.Cliente.Id, "comprobante", nc.Id));
        Assert.IsTrue(detail.GetProperty("relacionados").EnumerateArray().Any(x => x.GetProperty("Id").GetGuid() == old.Id));
        Assert.IsInstanceOfType(await c.Detalle(Guid.NewGuid(), "venta", f.Venta.Id), typeof(NotFoundResult));
        Assert.IsInstanceOfType(await c.Listar(f.Cliente.Id, FiscalRules.Hoy, FiscalRules.Hoy.AddDays(-1)), typeof(BadRequestObjectResult));
        Assert.AreEqual(0, Body(await c.Listar(f.Cliente.Id, FiscalRules.Hoy.AddDays(-10), FiscalRules.Hoy.AddDays(-9))).GetProperty("total").GetInt32());
        for (var i = 0; i < 51; i++) f.Db.Add(new Pedido { ClienteId = f.Cliente.Id, VendedorId = f.Venta.VendedorId, Fecha = FiscalRules.Hoy });
        await f.Db.SaveChangesAsync();
        Assert.AreEqual(50, Body(await c.Listar(f.Cliente.Id)).GetProperty("items").GetArrayLength());
        Assert.AreEqual(6, Body(await c.Listar(f.Cliente.Id, pagina: 2)).GetProperty("items").GetArrayLength());
    }

    [TestMethod]
    public async Task SharedPaymentIsOneEventAndDatesUseArgentinaAndInclusiveBounds()
    {
        await using var f = await Fixture.Create();
        var controller = new TrazabilidadController(f.Db);
        var today = FiscalRules.Hoy;
        f.Venta.FechaCreacion = today.ToDateTime(new TimeOnly(2, 0), DateTimeKind.Utc); // día anterior en Argentina
        var second = new Venta { ClienteId = f.Cliente.Id, VendedorId = f.Venta.VendedorId, FechaEntrega = today, Total = 100 };
        f.Db.Add(second); f.AddPago(60);
        await f.Db.SaveChangesAsync();
        var payment = await f.Db.PagosCliente.SingleAsync();
        payment.Monto = 90;
        f.Db.Add(new ImputacionPago { Pago = payment, Monto = 30,
            Cobranza = new Cobranza { Venta = second, ClienteId = f.Cliente.Id, Monto = 100, Fecha = today } });
        var boundary = Fixture.Document(f.Venta.Id, f.Cliente.Id); boundary.Fecha = today.AddDays(-29);
        var excluded = Fixture.Document(f.Venta.Id, f.Cliente.Id); excluded.Fecha = today.AddDays(-30);
        f.Db.AddRange(boundary, excluded); await f.Db.SaveChangesAsync();
        var body = Body(await controller.Listar(f.Cliente.Id));
        var events = body.GetProperty("items").EnumerateArray().ToList();
        Assert.IsTrue(events.Any(x => x.GetProperty("Id").GetGuid() == boundary.Id));
        Assert.IsFalse(events.Any(x => x.GetProperty("Id").GetGuid() == excluded.Id));
        Assert.AreEqual(1, events.Count(x => x.GetProperty("Tipo").GetString() == "pago"));
        Assert.AreEqual(90m, events.Single(x => x.GetProperty("Tipo").GetString() == "pago").GetProperty("Importe").GetDecimal());
        var exact = Body(await controller.Listar(f.Cliente.Id, today, today)).GetProperty("items").EnumerateArray().ToList();
        Assert.IsFalse(exact.Any(x => x.GetProperty("Id").GetGuid() == f.Venta.Id));
        var detail = Body(await controller.Detalle(f.Cliente.Id, "pago", payment.Id));
        Assert.AreEqual(2, detail.GetProperty("detalle").GetProperty("imputaciones").GetArrayLength());
        Assert.AreEqual(2, detail.GetProperty("relacionados").EnumerateArray().Count(x => x.GetProperty("Tipo").GetString() == "venta"));
    }

    [TestMethod]
    public void OnlyManagementCanReadTrace()
    {
        var attribute = (AuthorizeAttribute)Attribute.GetCustomAttribute(typeof(TrazabilidadController), typeof(AuthorizeAttribute))!;
        Assert.AreEqual("admin,gestor", attribute.Roles);
    }
}
