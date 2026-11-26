using System.Security.Claims;
using KimarApi.Controllers;
using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services.Facturacion;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class PedidosEdicionTests
{
    private static PedidosController Controller(KimarDbContext db, Guid usuario) => new(db) {
        ControllerContext = new() { HttpContext = new DefaultHttpContext {
            User = new ClaimsPrincipal(new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, usuario.ToString()), new Claim("rol", "vendedor")], "test"))
        } }
    };

    private static async Task<(Pedido Pedido, CreatePedidoRequest Request)> Preparar(Fixture f)
    {
        f.Cliente.Vendedor = f.Venta.Vendedor;
        f.Venta.Vendedor.UsuarioId = f.User;
        var producto = new Producto { Nombre = "Langostino", Unidad = "kg" };
        f.Db.Add(producto);
        var pedido = new Pedido { Cliente = f.Cliente, Vendedor = f.Venta.Vendedor,
            Fecha = FiscalRules.Hoy, FechaEntrega = FiscalRules.Hoy.AddDays(1), Observaciones = "Original",
            Items = [new() { Producto = producto, ProductoNombre = producto.Nombre, Cantidad = 1, PrecioUnitario = 100, Subtotal = 100 }] };
        f.Db.Add(pedido); await f.Db.SaveChangesAsync();
        return (pedido, new(f.Cliente.Id, f.Venta.VendedorId, FiscalRules.Hoy.AddDays(-1), "",
            [new(producto.Id, "Nombre no confiable", 2.5m, 150)], FiscalRules.Hoy.AddDays(2), new(10, 0), new(12, 0)));
    }

    [TestMethod]
    public async Task VendedorEditaPedidoPropioYSeGuardanTodosLosDatos()
    {
        await using var f = await Fixture.Create(); var (pedido, req) = await Preparar(f);
        var otroCliente = new Cliente { Nombre = "Otro propio", VendedorId = pedido.VendedorId };
        f.Db.Add(otroCliente); await f.Db.SaveChangesAsync();
        await using var db = new KimarDbContext(f.Options);
        Assert.IsInstanceOfType(await Controller(db, f.User).UpdateCompleto(pedido.Id, req with { ClienteId = otroCliente.Id }), typeof(OkObjectResult));
        f.Db.ChangeTracker.Clear();
        var guardado = await f.Db.Pedidos.Include(p => p.Items).SingleAsync();
        Assert.AreEqual("pendiente", guardado.Estado);
        Assert.AreEqual(otroCliente.Id, guardado.ClienteId);
        Assert.AreEqual(req.Fecha, guardado.Fecha);
        Assert.AreEqual(req.FechaEntrega, guardado.FechaEntrega);
        Assert.AreEqual(req.HoraEntregaDesde, guardado.HoraEntregaDesde);
        Assert.AreEqual(req.HoraEntregaHasta, guardado.HoraEntregaHasta);
        Assert.AreEqual("", guardado.Observaciones);
        Assert.AreEqual(1, guardado.Items.Count);
        Assert.AreEqual("Langostino", guardado.Items.Single().ProductoNombre);
        Assert.AreEqual(375m, guardado.Items.Single().Subtotal);
        Assert.AreEqual(0, await f.Db.MovimientosStock.CountAsync());
    }

    [TestMethod]
    public async Task NoPermitePedidosAjenosCambiarVendedorNiClienteAjeno()
    {
        await using var f = await Fixture.Create(); var (pedido, req) = await Preparar(f);
        var controller = Controller(f.Db, f.User);
        Assert.IsInstanceOfType(await Controller(f.Db, Guid.NewGuid()).UpdateCompleto(pedido.Id, req), typeof(NotFoundResult));
        Assert.IsInstanceOfType(await controller.UpdateCompleto(pedido.Id, req with { VendedorId = Guid.NewGuid() }), typeof(ForbidResult));
        var ajeno = new Cliente { Nombre = "Ajeno" }; f.Db.Add(ajeno); await f.Db.SaveChangesAsync();
        Assert.IsInstanceOfType(await controller.UpdateCompleto(pedido.Id, req with { ClienteId = ajeno.Id }), typeof(ForbidResult));
        Assert.AreEqual(100m, (await f.Db.ItemsPedido.SingleAsync()).Subtotal);
    }

    [TestMethod]
    public async Task RechazaCerradosVentaExistenteEImportesInvalidos()
    {
        await using var f = await Fixture.Create(); var (pedido, req) = await Preparar(f);
        var controller = Controller(f.Db, f.User);
        foreach (var estado in new[] { "confirmado", "cancelado" }) {
            pedido.Estado = estado; await f.Db.SaveChangesAsync();
            Assert.IsInstanceOfType(await controller.UpdateCompleto(pedido.Id, req), typeof(ConflictObjectResult));
        }
        pedido.Estado = "pendiente"; await f.Db.SaveChangesAsync();
        Assert.IsInstanceOfType(await controller.UpdateCompleto(pedido.Id, req with { Items = [] }), typeof(BadRequestObjectResult));
        Assert.IsInstanceOfType(await controller.UpdateCompleto(pedido.Id, req with { Items = [req.Items[0] with { Cantidad = -1 }] }), typeof(BadRequestObjectResult));
        Assert.IsInstanceOfType(await controller.UpdateCompleto(pedido.Id, req with { FechaEntrega = default }), typeof(BadRequestObjectResult));
        Assert.IsInstanceOfType(await controller.UpdateCompleto(pedido.Id, req with { HoraEntregaHasta = new(9, 0) }), typeof(BadRequestObjectResult));
        f.Venta.PedidoId = pedido.Id; await f.Db.SaveChangesAsync();
        Assert.IsInstanceOfType(await controller.UpdateCompleto(pedido.Id, req), typeof(ConflictObjectResult));
    }

    [TestMethod]
    public async Task ConfirmacionConcurrenteImpideEdicionDespuesDeEsperarBloqueo()
    {
        await using var f = await Fixture.Create(); var (pedido, req) = await Preparar(f);
        await using var confirmacion = new KimarDbContext(f.Options);
        await using var tx = await confirmacion.Database.BeginTransactionAsync();
        var key = FiscalRules.LockKey("pedido:" + pedido.Id);
        await confirmacion.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({key})");
        await confirmacion.Pedidos.Where(p => p.Id == pedido.Id).ExecuteUpdateAsync(s => s.SetProperty(p => p.Estado, "confirmado"));
        await using var edicion = new KimarDbContext(f.Options);
        var resultado = Controller(edicion, f.User).UpdateCompleto(pedido.Id, req);
        await tx.CommitAsync();
        Assert.IsInstanceOfType(await resultado, typeof(ConflictObjectResult));
        Assert.AreEqual(100m, (await f.Db.ItemsPedido.AsNoTracking().SingleAsync()).Subtotal);
    }
}
