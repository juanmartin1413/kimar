using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using KimarApi.Controllers;
using KimarApi.Data;
using KimarApi.Models.Entities;
using KimarApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class ComisionTests
{
    [TestMethod]
    public void ProporcionalLimitesYRedondeo()
    {
        Assert.AreEqual(25000m, ComisionService.Habilitada(50000, 60500, 121000));
        Assert.AreEqual(50000m, ComisionService.Habilitada(50000, 150000, 121000));
        Assert.AreEqual(0m, ComisionService.Habilitada(50000, -10, 121000));
        Assert.AreEqual(0m, ComisionService.Habilitada(50000, 100, 0));
        var primerCobro = ComisionService.Habilitada(500, 1, 3);
        var segundoCobro = ComisionService.Habilitada(500, 2, 3) - primerCobro;
        var ultimoCobro = ComisionService.Habilitada(500, 3, 3) - primerCobro - segundoCobro;
        Assert.AreEqual(500m, primerCobro + segundoCobro + ultimoCobro);
    }

    private static async Task<Fixture> Setup(decimal cobrado = 500)
    {
        var f = await Fixture.Create();
        f.Venta.Total = 1000; f.Venta.Iva = 0; f.Venta.EmitirFactura = false;
        f.Venta.Vendedor.ComisionPorKg = 500; f.Venta.Vendedor.UsuarioId = f.User;
        var kg = new Producto { Nombre = "Langostino", Unidad = "kg" };
        var unidad = new Producto { Nombre = "Caja", Unidad = "unidad" };
        f.Db.AddRange(new ItemVenta { VentaId = f.Venta.Id, Producto = kg, Cantidad = 100, Unidad = "kg", Descripcion = "Langostino" },
            new ItemVenta { VentaId = f.Venta.Id, Producto = unidad, Cantidad = 5, Unidad = "unidad", Descripcion = "Caja" });
        if (cobrado > 0) f.AddPago(cobrado);
        await f.Db.SaveChangesAsync(); return f;
    }

    private static async Task<ComisionConfirmar> Solicitud(ComisionService s, Guid vendedor)
    {
        var filtro = new ComisionFiltro(vendedor, ComisionService.Hoy);
        var p = await s.Preview(filtro);
        return new(filtro, Guid.NewGuid(), p.Huella, ComisionService.Hoy, "transferencia", "prueba", null);
    }

    [TestMethod]
    public async Task AnticipoCompensaYPeriodoSuperpuestoNoDuplica()
    {
        await using var f = await Setup(); var s = new ComisionService(f.Db);
        var vendedor = f.Venta.VendedorId;
        var p = await s.Preview(new(vendedor, ComisionService.Hoy));
        Assert.AreEqual(50000m, p.Total); Assert.AreEqual(25000m, p.Habilitada);
        Assert.AreEqual(0m, p.Ventas[0].Items.Single(i => i.Unidad == "unidad").Comision);
        var advanceReq = new ComisionAnticipo(vendedor, Guid.NewGuid(), 20000, ComisionService.Hoy, "efectivo", null, "Adelanto");
        var anticipo = await s.Anticipar(advanceReq, f.User);
        Assert.AreEqual(anticipo.Id, (await s.Anticipar(advanceReq, f.User)).Id);
        var req = await Solicitud(s, vendedor);
        var d = await s.Confirmar(req, f.User);
        Assert.AreEqual(25000m, d.Comision); Assert.AreEqual(20000m, d.Compensado); Assert.AreEqual(5000m, d.Pago);
        Assert.AreEqual(anticipo.Id, d.Aplicaciones.Single().AnticipoId);
        Assert.AreEqual(d.Id, (await s.Confirmar(req, f.User)).Id);
        p = await s.Preview(new(vendedor, ComisionService.Hoy));
        Assert.AreEqual(0m, p.Comision); Assert.AreEqual(0m, p.Neto); Assert.AreEqual(0m, p.AnticiposPendientes);
        f.AddPago(500);
        await f.Db.SaveChangesAsync();
        d = await s.Confirmar(await Solicitud(s, vendedor), f.User);
        Assert.AreEqual(25000m, d.Pago);
        Assert.AreEqual(50000m, await f.Db.ComisionDocumentos.SumAsync(x => x.Pago));
    }

    [TestMethod]
    public async Task AnticiposRechazanNetoCeroYCompensanCuandoHayPago()
    {
        await using var f = await Setup(240); var s = new ComisionService(f.Db); var id = f.Venta.VendedorId;
        await s.Anticipar(new(id, Guid.NewGuid(), 10000, ComisionService.Hoy, "efectivo", null, "Primero"), f.User);
        await s.Anticipar(new(id, Guid.NewGuid(), 10000, ComisionService.Hoy, "efectivo", null, "Segundo"), f.User);
        await Assert.ThrowsExceptionAsync<ComisionException>(() => s.Anticipar(new(id, Guid.NewGuid(), 30000.01m, ComisionService.Hoy, "efectivo", null, "Exceso"), f.User));
        await Assert.ThrowsExceptionAsync<ComisionException>(async () => await s.Confirmar(await Solicitud(s, id), f.User));
        Assert.AreEqual(2, await f.Db.ComisionDocumentos.CountAsync());
        Assert.AreEqual(0, await f.Db.ComisionAplicaciones.CountAsync());
        f.AddPago(260); await f.Db.SaveChangesAsync();
        var d = await s.Confirmar(await Solicitud(s, id), f.User);
        Assert.AreEqual(5000m, d.Pago); Assert.AreEqual(20000m, d.Compensado);
        var p = await s.Preview(new(id, ComisionService.Hoy));
        Assert.AreEqual(0m, p.AnticiposPendientes); Assert.AreEqual(0, p.Anticipos.Count);
        Assert.AreEqual(25000m, p.LimiteAnticipo);
    }

    [TestMethod]
    public async Task LiquidarSinCompensarConservaAdelantoParaLaProximaLiquidacion()
    {
        await using var f = await Setup(); var s = new ComisionService(f.Db); var id = f.Venta.VendedorId;
        await s.Anticipar(new(id, Guid.NewGuid(), 20000, ComisionService.Hoy, "efectivo", null, "Adelanto"), f.User);
        var req = (await Solicitud(s, id)) with { CompensarAdelantos = false };
        var d = await s.Confirmar(req, f.User);
        Assert.AreEqual(25000m, d.Pago); Assert.AreEqual(0m, d.Compensado); Assert.AreEqual(0, d.Aplicaciones.Count);
        Assert.IsFalse(JsonSerializer.Deserialize<ComisionSnapshot>(d.DatosJson, ComisionService.Json)!.CompensarAdelantos);
        Assert.AreEqual(d.Id, (await s.Confirmar(req, f.User)).Id);
        await Assert.ThrowsExceptionAsync<ComisionException>(() => s.Confirmar(req with { CompensarAdelantos = true }, f.User));
        var p = await s.Preview(new(id, ComisionService.Hoy));
        Assert.AreEqual(20000m, p.AnticiposPendientes); Assert.AreEqual(0m, p.Comision);
        f.AddPago(500);
        await f.Db.SaveChangesAsync();
        d = await s.Confirmar(await Solicitud(s, id), f.User);
        Assert.AreEqual(5000m, d.Pago); Assert.AreEqual(20000m, d.Compensado);
        Assert.AreEqual(0m, (await s.Preview(new(id, ComisionService.Hoy))).AnticiposPendientes);
    }

    [TestMethod]
    public void PdfAdelantoDestacaImporteYOcultalosDatosQueNoAplican()
    {
        var d = new ComisionDocumento { Numero = 1, Tipo = "anticipo", Pago = 10000, Fecha = ComisionService.Hoy,
            FormaPago = "transferencia", Motivo = "Solicita un adelanto por vacaciones",
            DatosJson = ComisionService.Serialize(new ComisionSnapshot("Manolo", 500, [], 0, [])) };
        var bytes = ComisionPdf.Render(d); var text = Encoding.Latin1.GetString(bytes);
        StringAssert.Contains(text, "Comisión adelantada"); StringAssert.Contains(text, "$ 10.000,00");
        Assert.IsFalse(text.Contains("negativo:")); Assert.IsFalse(text.Contains("Tarifa"));
        Assert.IsFalse(text.Contains("Compensado con")); Assert.IsFalse(text.Contains(d.UsuarioId.ToString()));
        Assert.AreEqual(1, Regex.Matches(text, @"/Type /Page\b").Count);
        File.WriteAllBytes(Path.Combine(Path.GetTempPath(), "kimar-adelanto-test.pdf"), bytes);
    }

    [TestMethod]
    public async Task CambiosRechazanPreviewYAnulacionRecuperaLoPagadoSinReescribirHistoria()
    {
        await using var f = await Setup(); var s = new ComisionService(f.Db); var id = f.Venta.VendedorId;
        var req = await Solicitud(s, id);
        f.Venta.NroRemito = "Nuevo"; await f.Db.SaveChangesAsync();
        await Assert.ThrowsExceptionAsync<ComisionException>(() => s.Confirmar(req, f.User));
        var d = await s.Confirmar(await Solicitud(s, id), f.User); var snapshot = d.DatosJson;
        f.Venta.CreditoAplicado = f.Venta.Total; await f.Db.SaveChangesAsync();
        var p = await s.Preview(new(id, ComisionService.Hoy, ClienteIds: []));
        Assert.AreEqual(-25000m, p.Comision); Assert.IsTrue(p.Ventas.Single().Incluida);
        await Assert.ThrowsExceptionAsync<ComisionException>(async () => await s.Confirmar(await Solicitud(s, id), f.User));
        Assert.AreEqual(1, await f.Db.ComisionDocumentos.CountAsync());
        p = await s.Preview(new(id, ComisionService.Hoy));
        Assert.AreEqual(-25000m, p.Comision); Assert.AreEqual(0m, p.LimiteAnticipo);
        Assert.AreEqual(snapshot, (await f.Db.ComisionDocumentos.AsNoTracking().SingleAsync(x => x.Id == d.Id)).DatosJson);
    }

    [TestMethod]
    public async Task ContrapartidaConservaDineroYDevolucionEsExplicita()
    {
        await using var f = await Setup(); var s = new ComisionService(f.Db); var id = f.Venta.VendedorId;
        var d = await s.Confirmar(await Solicitud(s, id), f.User);
        var contra = await s.Corregir(d.Id, new(Guid.NewGuid(), ComisionService.Hoy, "Corrección"), f.User);
        Assert.AreEqual(-25000m, contra.Comision); Assert.AreEqual(0m, contra.Pago);
        await Assert.ThrowsExceptionAsync<ComisionException>(async () => await s.Confirmar(await Solicitud(s, id), f.User));
        Assert.AreEqual(2, await f.Db.ComisionDocumentos.CountAsync());
        var a = await s.Anticipar(new(id, Guid.NewGuid(), 10000, ComisionService.Hoy, "efectivo", null, "Anticipo"), f.User);
        var devolucion = await s.Corregir(a.Id, new(Guid.NewGuid(), ComisionService.Hoy, "Dinero devuelto", "efectivo"), f.User);
        Assert.AreEqual(-10000m, devolucion.Pago);
        Assert.AreEqual(0m, (await s.Preview(new(id, ComisionService.Hoy))).AnticiposPendientes);
    }

    [TestMethod]
    public async Task ConfirmacionesConcurrentesNoPaganDosVeces()
    {
        await using var f = await Setup(); var s = new ComisionService(f.Db);
        var req = await Solicitud(s, f.Venta.VendedorId);
        async Task<Guid> Run()
        {
            await using var db = new KimarDbContext(f.Options);
            return (await new ComisionService(db).Confirmar(req, f.User)).Id;
        }
        var ids = await Task.WhenAll(Run(), Run());
        Assert.AreEqual(ids[0], ids[1]); Assert.AreEqual(25000m, await f.Db.ComisionDocumentos.SumAsync(d => d.Pago));
    }

    [TestMethod]
    public async Task VendedorNoPuedeDescargarConstanciaAjena()
    {
        await using var f = await Setup(); var s = new ComisionService(f.Db);
        var d = await s.Confirmar(await Solicitud(s, f.Venta.VendedorId), f.User);
        var controller = new ComisionesController(f.Db, s) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()), new Claim(ClaimTypes.Role, "vendedor")], "test"))
        } } };
        Assert.IsInstanceOfType(await controller.Pdf(d.Id), typeof(NotFoundResult));
        Assert.IsInstanceOfType(await controller.Detalle(d.Id), typeof(NotFoundResult));
        controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, f.User.ToString()), new Claim(ClaimTypes.Role, "vendedor")], "test"));
        Assert.IsInstanceOfType(await controller.Pdf(d.Id), typeof(FileContentResult));
    }

    [TestMethod]
    public async Task UnidadHistoricaYTarifaNoCambianConCatalogoONombre()
    {
        await using var f = await Setup(); var s = new ComisionService(f.Db); var id = f.Venta.VendedorId;
        var d = await s.Confirmar(await Solicitud(s, id), f.User);
        var producto = await f.Db.Productos.SingleAsync(p => p.Nombre == "Langostino");
        producto.Unidad = "unidad";
        f.Venta.Vendedor.Nombre = "Nombre actualizado";
        f.Venta.Vendedor.ComisionPorKg = 700;
        await f.Db.SaveChangesAsync();
        var p = await s.Preview(new(id, ComisionService.Hoy));
        Assert.AreEqual(50000m, p.Total); Assert.AreEqual(0m, p.Comision);
        Assert.AreEqual(500m, p.Ventas.Single().Tarifa);
        Assert.AreEqual("Vendedor", JsonSerializer.Deserialize<ComisionSnapshot>(d.DatosJson, ComisionService.Json)!.Vendedor);
        var req = new KimarApi.Models.DTOs.UpdateVentaCompletaRequest(f.Cliente.Id, Guid.NewGuid(), f.Venta.FechaEntrega,
            null, null, null, [], []);
        var result = await new VentaService(f.Db, new StockService(f.Db)).ActualizarVentaCompletaAsync(f.Venta.Id, req, f.User);
        Assert.IsFalse(result.Ok); StringAssert.Contains(result.Error!, "vendedor");
    }

    [TestMethod]
    public async Task AnticiposConcurrentesNoSuperanComisionGenerada()
    {
        await using var f = await Setup(0); var id = f.Venta.VendedorId;
        async Task<bool> Run()
        {
            await using var db = new KimarDbContext(f.Options);
            try { await new ComisionService(db).Anticipar(new(id, Guid.NewGuid(), 30000, ComisionService.Hoy, "efectivo", null, "Anticipo"), f.User); return true; }
            catch (ComisionException) { return false; }
        }
        var resultados = await Task.WhenAll(Run(), Run());
        Assert.AreEqual(1, resultados.Count(x => x));
        Assert.AreEqual(30000m, await f.Db.ComisionDocumentos.SumAsync(d => d.Pago));
    }

    [TestMethod]
    public void PdfIncluyeLogoDetalleYPaginacionSinMutarDocumento()
    {
        var ventas = Enumerable.Range(1, 25).Select(n => new ComisionVenta(Guid.NewGuid(), Guid.NewGuid(), $"CLIENTE_{n:D3}", ComisionService.Hoy,
            $"REM-{n}", null, 1000, 500, 100, 500, 50000, 25000, 0, 25000, true,
            [new("Langostino", "kg", 100, 500, 50000)], [])).ToList();
        var doc = new ComisionDocumento { Numero = 123, Fecha = ComisionService.Hoy, Pago = 625000, Comision = 625000,
            DatosJson = ComisionService.Serialize(new ComisionSnapshot("Luciano", 500, ventas, 0, [])) };
        var before = doc.DatosJson; var bytes = ComisionPdf.Render(doc); var text = Encoding.Latin1.GetString(bytes);
        StringAssert.Contains(text, "/Logo Do"); StringAssert.Contains(text, "00000123");
        Assert.IsTrue(Regex.Matches(text, @"/Type /Page\b").Count > 1);
        foreach (var n in Enumerable.Range(1, 25)) StringAssert.Contains(text, $"CLIENTE_{n:D3}");
        Assert.AreEqual(before, doc.DatosJson);
        var path = Path.Combine(Path.GetTempPath(), "kimar-comisiones-test.pdf"); File.WriteAllBytes(path, bytes);
    }
}
