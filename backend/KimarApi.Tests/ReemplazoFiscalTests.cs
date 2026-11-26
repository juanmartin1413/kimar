using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services;
using KimarApi.Services.Facturacion;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class ReemplazoFiscalTests
{
    [TestMethod]
    public async Task RemovedLineIsAbsentFromReplacementAndOriginalIsPreserved()
    {
        await using var f = await Fixture.Create();
        var product = new Producto { Nombre = "Langostinos", Unidad = "kg" };
        f.Db.Add(new ItemVenta { VentaId = f.Venta.Id, Producto = product, Descripcion = product.Nombre,
            Cantidad = 1, PrecioUnitario = 100, Subtotal = 100, Unidad = "kg" });
        var original = Fixture.Document(f.Venta.Id, f.Cliente.Id);
        var data = FiscalRules.Deserialize<DatosFiscales>(original.DatosJson);
        data.Items.Add(new("Calamar", 2, "kg", 50, 100, 21, Guid.NewGuid()));
        original.DatosJson = FiscalRules.Serialize(data);
        original.Neto = 200; original.Iva = 42; original.Total = 242; original.Estado = "autorizado";
        f.Db.Add(original);
        await f.Db.SaveChangesAsync();
        var nc = await f.Service.CrearNcAsync(original.Id, new("Quitar calamar", "correccion_fiscal"), f.User, default);
        nc.Estado = "autorizado"; await f.Db.SaveChangesAsync();
        var preview = await f.Service.PreviewReemplazoAsync(original.Id, default);
        Assert.IsFalse(preview.SinCambios);
        var replacement = await f.Service.CorregirAsync(original.Id,
            new(data.Receptor, [product.Nombre], null, FiscalRules.Hoy, preview.Huella), f.User, true, default);
        Assert.AreEqual(1, FiscalRules.Deserialize<DatosFiscales>(replacement.DatosJson).Items.Count);
        Assert.AreEqual(121m, replacement.Total);
        Assert.AreEqual(242m, original.Total); Assert.AreEqual(242m, nc.Total);
    }

    [TestMethod]
    public async Task CorrectionEditsProductsAndReplacementUsesSavedAmounts()
    {
        await using var f = await Fixture.Create();
        var p = new Producto { Nombre = "Langostinos", Unidad = "kg" };
        var item = new ItemVenta { VentaId = f.Venta.Id, Producto = p, Descripcion = p.Nombre, Cantidad = 1, PrecioUnitario = 100, Subtotal = 100, Unidad = "kg" };
        f.Db.Add(item);
        f.Db.Add(new Cobranza { VentaId = f.Venta.Id, ClienteId = f.Cliente.Id, Monto = 121, Fecha = FiscalRules.Hoy });
        var original = Fixture.Document(f.Venta.Id, f.Cliente.Id);
        original.Estado = "autorizado"; original.Cae = "12345678901234"; original.Numero = 1;
        f.Db.Add(original); await f.Db.SaveChangesAsync();
        var service = new VentaService(f.Db, new StockService(f.Db));
        var edit = new UpdateVentaCompletaRequest(f.Cliente.Id, f.Venta.VendedorId, f.Venta.FechaEntrega, null, null, null,
            [new(p.Id, p.Nombre, .5m, 100)]);
        Assert.IsFalse((await service.ActualizarVentaCompletaAsync(f.Venta.Id, edit, f.User, false)).Ok);
        var nc = await f.Service.CrearNcAsync(original.Id, new("Productos", "correccion_fiscal"), f.User, default);
        Assert.IsFalse(await FacturacionService.PuedeEditarProductosAsync(f.Db, f.Venta.Id));
        nc.Estado = "autorizado"; await f.Db.SaveChangesAsync();
        var before = await f.Service.PreviewReemplazoAsync(original.Id, default);
        Assert.IsTrue(before.SinCambios);
        var receptor = FiscalRules.Deserialize<DatosFiscales>(original.DatosJson).Receptor;
        await Assert.ThrowsExceptionAsync<FiscalException>(() => f.Service.CorregirAsync(original.Id,
            new(receptor, [p.Nombre], null, FiscalRules.Hoy, before.Huella), f.User, true, default));
        Assert.IsFalse((await service.ActualizarVentaCompletaAsync(f.Venta.Id, edit with { ClienteId = Guid.NewGuid() }, f.User, false)).Ok);
        Assert.IsTrue((await service.ActualizarVentaCompletaAsync(f.Venta.Id, edit, f.User, false)).Ok);
        Assert.AreEqual(60.5m, f.Venta.Total); Assert.AreEqual(10.5m, f.Venta.Iva);
        Assert.AreEqual(60.5m, (await f.Db.Cobranzas.SingleAsync()).Monto);
        Assert.AreEqual(.5m, (await f.Db.MovimientosStock.SingleAsync()).Cantidad);
        await Assert.ThrowsExceptionAsync<FiscalException>(() => f.Service.CorregirAsync(original.Id,
            new(receptor, [p.Nombre], null, FiscalRules.Hoy, before.Huella, true), f.User, true, default));
        var after = await f.Service.PreviewReemplazoAsync(original.Id, default);
        Assert.IsFalse(after.SinCambios);
        var replacement = await f.Service.CorregirAsync(original.Id,
            new(receptor, [p.Nombre], null, FiscalRules.Hoy, after.Huella), f.User, true, default);
        Assert.AreEqual(60.5m, replacement.Total);
        Assert.AreEqual(.5m, FiscalRules.Deserialize<DatosFiscales>(replacement.DatosJson).Items.Single().Cantidad);
        Assert.AreEqual(121m, original.Total); Assert.AreEqual(121m, nc.Total);
        Assert.IsFalse(await FacturacionService.PuedeEditarProductosAsync(f.Db, f.Venta.Id));
        var repeated = await f.Service.CorregirAsync(original.Id,
            new(receptor, [p.Nombre], null, FiscalRules.Hoy, after.Huella), f.User, true, default);
        Assert.AreEqual(replacement.Id, repeated.Id);
    }
}
