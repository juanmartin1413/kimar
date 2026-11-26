using System.Security.Claims;
using System.Text.Json;
using KimarApi.Controllers;
using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services;
using KimarApi.Services.Facturacion;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class CobranzasTests
{
    private static List<Cobranza> Deudas() => Enumerable.Range(1, 3).Select(n => new Cobranza {
        Fecha = new DateOnly(2026, 11, n), Monto = n * 100
    }).ToList();

    [TestMethod]
    public void DistribuyePorVencimientoYPermitePriorizarFila()
    {
        var deudas = Deudas();
        var propuesta = CobranzaRules.Proponer(deudas.AsEnumerable().Reverse(), 350, null);
        CollectionAssert.AreEqual(new decimal[] { 100, 200, 50 }, propuesta.Select(p => p.Aplicar).ToArray());
        var fila = CobranzaRules.Proponer(deudas, 350, deudas[2].Id);
        Assert.AreEqual(deudas[2].Id, fila[0].CobranzaId);
        CollectionAssert.AreEqual(new decimal[] { 300, 50, 0 }, fila.Select(p => p.Aplicar).ToArray());
        deudas[0].Imputaciones.Add(new() { Monto = 25 });
        Assert.AreEqual(75m, CobranzaRules.Proponer(deudas, 75, null)[0].Aplicar);
    }

    [TestMethod]
    public void ValidaDistribucionManualYRechazaExcesos()
    {
        var deudas = Deudas();
        CobranzaRules.ValidarAplicaciones(deudas, 150, [new(deudas[1].Id, 150)]);
        Assert.ThrowsException<FiscalException>(() => CobranzaRules.Proponer(deudas, 600.01m, null));
        Assert.ThrowsException<FiscalException>(() => CobranzaRules.Proponer(deudas, 0, null));
        Assert.ThrowsException<FiscalException>(() => CobranzaRules.Proponer(deudas, 0.001m, null));
        Assert.ThrowsException<FiscalException>(() => CobranzaRules.ValidarAplicaciones(deudas, 101, [new(deudas[0].Id, 101)]));
        Assert.ThrowsException<FiscalException>(() => CobranzaRules.ValidarAplicaciones(deudas, 100, [new(Guid.NewGuid(), 100)]));
        Assert.ThrowsException<FiscalException>(() => CobranzaRules.ValidarAplicaciones(deudas, 100, [new(deudas[0].Id, 50), new(deudas[0].Id, 50)]));
        deudas[0].Estado = "cancelado";
        Assert.AreEqual(0m, CobranzaRules.Saldo(deudas[0]));
    }

    [TestMethod]
    public void EntregaAceptaHoraOpcionalExactaORangoDelMismoDia()
    {
        var fecha = new DateOnly(2026, 11, 26);
        Assert.IsTrue(CobranzaRules.HorarioValido(fecha, null, null));
        Assert.IsTrue(CobranzaRules.HorarioValido(fecha, new(9, 0), null));
        Assert.IsTrue(CobranzaRules.HorarioValido(fecha, new(9, 0), new(18, 0)));
        Assert.IsFalse(CobranzaRules.HorarioValido(fecha, new(18, 0), new(9, 0)));
        Assert.IsFalse(CobranzaRules.HorarioValido(fecha, null, new(9, 0)));
        Assert.IsFalse(CobranzaRules.HorarioValido(default, null, null));
    }

    private static CobranzasController Controller(KimarDbContext db, Guid user) => new(db, new VentaService(db, new StockService(db))) {
        ControllerContext = new() { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, user.ToString()), new Claim("rol", "admin")], "test")) } }
    };
    private static JsonElement Json(IActionResult result) => JsonSerializer.SerializeToElement(((OkObjectResult)result).Value, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

    private static async Task<List<Cobranza>> CrearDeudas(Fixture f)
    {
        var deudas = Deudas();
        foreach (var c in deudas) {
            c.ClienteId = f.Cliente.Id;
            c.Venta = new Venta { ClienteId = f.Cliente.Id, VendedorId = f.Venta.VendedorId, FechaEntrega = c.Fecha, Total = c.Monto };
        }
        f.Db.AddRange(deudas); await f.Db.SaveChangesAsync();
        return deudas;
    }

    private static async Task<ConfirmarPagoRequest> Solicitud(CobranzasController controller, Guid cliente, decimal monto)
    {
        var preview = Json(await controller.Preview(new(cliente, monto)));
        var apps = preview.GetProperty("deudas").EnumerateArray().Where(d => d.GetProperty("aplicar").GetDecimal() > 0)
            .Select(d => new AplicacionPagoRequest(d.GetProperty("cobranzaId").GetGuid(), d.GetProperty("aplicar").GetDecimal())).ToList();
        return new(Guid.NewGuid(), cliente, FiscalRules.Hoy, monto, "transferencia", null, preview.GetProperty("version").GetString()!, apps);
    }

    [TestMethod]
    public async Task Pago350EsAtomicoIdempotenteYActualizaEstados()
    {
        await using var f = await Fixture.Create(); var deudas = await CrearDeudas(f);
        var c = Controller(f.Db, f.User); var req = await Solicitud(c, f.Cliente.Id, 350);
        var id = Json(await c.Confirmar(req)).GetProperty("id").GetGuid();
        Assert.AreEqual(id, Json(await c.Confirmar(req)).GetProperty("id").GetGuid());
        Assert.AreEqual(1, await f.Db.PagosCliente.CountAsync());
        Assert.AreEqual(3, await f.Db.ImputacionesPago.CountAsync());
        Assert.AreEqual(350m, await f.Db.ImputacionesPago.SumAsync(i => i.Monto));
        CollectionAssert.AreEqual(new[] { "pagado", "pagado", "cobrado_parcial" }, deudas.Select(d => d.Venta!.Estado).ToArray());
        Assert.AreEqual(250m, CobranzaRules.Saldo(deudas[2]));
        Assert.IsInstanceOfType(await c.Confirmar(req with { Monto = 300 }), typeof(ConflictObjectResult));
        var movimientos = (IEnumerable<CobranzaDto>)((OkObjectResult)await c.GetAll(null, f.Cliente.Id)).Value!;
        Assert.AreEqual(350m, movimientos.Where(m => m.Estado == "cobrado").Sum(m => m.Monto));
        Assert.AreEqual(250m, movimientos.Where(m => m.Estado == "pendiente").Sum(m => m.Monto));
    }

    [TestMethod]
    public async Task ConfirmacionesConcurrentesRechazanPreviewVieja()
    {
        await using var f = await Fixture.Create(); await CrearDeudas(f);
        var req = await Solicitud(Controller(f.Db, f.User), f.Cliente.Id, 350);
        async Task<IActionResult> Confirmar(Guid operacion) {
            await using var db = new KimarDbContext(f.Options);
            return await Controller(db, f.User).Confirmar(req with { OperacionId = operacion });
        }
        var results = await Task.WhenAll(Confirmar(req.OperacionId), Confirmar(Guid.NewGuid()));
        Assert.AreEqual(1, results.Count(r => r is OkObjectResult));
        Assert.AreEqual(1, results.Count(r => r is ConflictObjectResult));
        Assert.AreEqual(1, await f.Db.PagosCliente.CountAsync());
        Assert.AreEqual(350m, await f.Db.ImputacionesPago.SumAsync(i => i.Monto));
    }

    [TestMethod]
    public async Task PedidosNoPermitenClientesAjenosNiVendedorSinVinculo()
    {
        await using var f = await Fixture.Create();
        var c = new PedidosController(f.Db) { ControllerContext = Controller(f.Db, f.User).ControllerContext };
        c.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, f.User.ToString()), new Claim("rol", "vendedor")], "test"));
        var producto = new Producto { Nombre = "Prueba" }; f.Db.Add(producto); await f.Db.SaveChangesAsync();
        var req = new CreatePedidoRequest(f.Cliente.Id, f.Venta.VendedorId, FiscalRules.Hoy, null,
            [new(producto.Id, producto.Nombre, 1, 100)], FiscalRules.Hoy, new(9, 0), new(12, 0));
        Assert.IsInstanceOfType(await c.Create(req), typeof(ForbidResult));
        f.Venta.Vendedor.UsuarioId = f.User; await f.Db.SaveChangesAsync();
        Assert.IsInstanceOfType(await c.Create(req), typeof(ForbidResult));
        f.Cliente.VendedorId = f.Venta.VendedorId; await f.Db.SaveChangesAsync();
        Assert.IsInstanceOfType(await c.Create(req with { VendedorId = Guid.NewGuid() }), typeof(CreatedAtActionResult));
        var pedido = await f.Db.Pedidos.SingleAsync();
        Assert.AreEqual(f.Venta.VendedorId, pedido.VendedorId);
        Assert.AreEqual(new TimeOnly(9, 0), pedido.HoraEntregaDesde);
    }

    [TestMethod]
    public async Task PlazoCeroSePersisteYVentasConservanElPlazoAplicado()
    {
        await using var f = await Fixture.Create();
        var contado = new Cliente { Nombre = "Contado", DiasPlazoPago = 0 };
        f.Db.Add(contado); await f.Db.SaveChangesAsync();
        await f.Db.Entry(contado).ReloadAsync();
        Assert.AreEqual(0, contado.DiasPlazoPago);
        var producto = new Producto { Nombre = "Prueba", Unidad = "kg" }; f.Db.Add(producto); await f.Db.SaveChangesAsync();
        var controller = new VentasController(f.Db, new StockService(f.Db), new VentaService(f.Db, new StockService(f.Db)), f.Service) {
            ControllerContext = Controller(f.Db, f.User).ControllerContext
        };
        var fecha = FiscalRules.Hoy.AddDays(7);
        var request = new CreateVentaRequest(null, contado.Id, f.Venta.VendedorId, fecha, null, null,
            [new(producto.Id, producto.Nombre, 1, 100)], HoraEntregaDesde: new(10, 0));
        await controller.Create(request);
        var venta = await f.Db.Ventas.Include(v => v.Cobranzas).SingleAsync(v => v.ClienteId == contado.Id);
        Assert.AreEqual(fecha, venta.Cobranzas.Single().Fecha);
        contado.DiasPlazoPago = 30; await f.Db.SaveChangesAsync();
        Assert.AreEqual(0, venta.DiasPlazoPago);
        var edit = new UpdateVentaCompletaRequest(contado.Id, venta.VendedorId, fecha.AddDays(1), venta.NroRemito, null, null, request.Items);
        Assert.IsTrue((await new VentaService(f.Db, new StockService(f.Db)).ActualizarVentaCompletaAsync(venta.Id, edit, f.User)).Ok);
        Assert.AreEqual(fecha.AddDays(1), venta.Cobranzas.Single().Fecha);
        await controller.Create(request);
        Assert.AreEqual(30, (await f.Db.Ventas.Where(v => v.ClienteId == contado.Id && v.Id != venta.Id).SingleAsync()).DiasPlazoPago);
    }

    [TestMethod]
    public async Task AdjuntosSeAsocianAlPagoYNoALasVentas()
    {
        await using var f = await Fixture.Create(); await CrearDeudas(f);
        var c = Controller(f.Db, f.User);
        var id = Json(await c.Confirmar(await Solicitud(c, f.Cliente.Id, 350))).GetProperty("id").GetGuid();
        var adjuntos = new AdjuntosController(new AdjuntoService(f.Db, f.Configuration), f.Db) { ControllerContext = c.ControllerContext };
        var req = new CreateAdjuntoRequest("PagoCliente", id, "comprobante_pago", "pago.pdf", "application/pdf", Convert.ToBase64String("%PDF-test"u8.ToArray()));
        Assert.IsInstanceOfType(await adjuntos.Create(req), typeof(CreatedAtActionResult));
        var adjunto = await f.Db.Adjuntos.SingleAsync();
        Assert.AreEqual(id, adjunto.EntidadId);
        Assert.IsInstanceOfType(await adjuntos.GetById(adjunto.Id), typeof(OkObjectResult));
        Assert.IsInstanceOfType(await adjuntos.Create(req with { EntidadId = Guid.NewGuid() }), typeof(BadRequestObjectResult));
        Assert.IsInstanceOfType(await adjuntos.Create(req with { ContentType = "text/html" }), typeof(BadRequestObjectResult));
        Assert.IsInstanceOfType(await adjuntos.Create(req with { ContenidoBase64 = "inválido" }), typeof(BadRequestObjectResult));
        Assert.AreEqual(1, await f.Db.PagosCliente.CountAsync());
    }
}
