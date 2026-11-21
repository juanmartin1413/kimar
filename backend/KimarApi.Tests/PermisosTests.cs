using System.Security.Claims;
using KimarApi.Controllers;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class PermisosTests
{
    private static T ComoVendedor<T>(T controller, Guid usuarioId) where T : ControllerBase
    {
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext {
            User = new ClaimsPrincipal(new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, usuarioId.ToString()), new Claim("rol", "vendedor")
            ], "test"))
        }};
        return controller;
    }

    [TestMethod]
    public async Task CuentaCorrienteUsaCarteraDelClienteAunqueLaVentaSeaDeOtroVendedor()
    {
        await using var f = await Fixture.Create();
        var vendedor = new Vendedor { Nombre = "Asignado", UsuarioId = f.User };
        f.Db.Add(vendedor);
        f.Cliente.Vendedor = vendedor;
        var ajeno = new Cliente { Nombre = "Ajeno" };
        var ventaAjena = new Venta { Cliente = ajeno, Vendedor = f.Venta.Vendedor, FechaEntrega = f.Venta.FechaEntrega };
        var cobro = new Cobranza { Cliente = f.Cliente, Venta = f.Venta, Monto = 10 };
        var cobroAjeno = new Cobranza { Cliente = ajeno, Venta = ventaAjena, Monto = 20 };
        f.Db.AddRange(ventaAjena, cobro, cobroAjeno);
        await f.Db.SaveChangesAsync();

        var ventas = ComoVendedor(new VentasController(f.Db, null!, null!, null!), f.User);
        var cuenta = (IEnumerable<VentaDto>)((OkObjectResult)await ventas.GetAll(null, null, true)).Value!;
        CollectionAssert.AreEqual(new[] { f.Venta.Id }, cuenta.Select(v => v.Id).ToArray());
        var propias = (IEnumerable<VentaDto>)((OkObjectResult)await ventas.GetAll(null, null)).Value!;
        Assert.AreEqual(0, propias.Count());
        Assert.IsInstanceOfType(await ventas.GetById(ventaAjena.Id), typeof(NotFoundResult));

        var cobranzas = ComoVendedor(new CobranzasController(f.Db, null!), f.User);
        var visibles = (IEnumerable<CobranzaDto>)((OkObjectResult)await cobranzas.GetAll(null, null)).Value!;
        CollectionAssert.AreEqual(new[] { cobro.Id }, visibles.Select(c => c.Id).ToArray());
        Assert.IsInstanceOfType(await cobranzas.GetById(cobroAjeno.Id), typeof(NotFoundResult));
        var clientes = ComoVendedor(new ClientesController(f.Db), f.User);
        Assert.IsInstanceOfType(await clientes.GetById(ajeno.Id), typeof(NotFoundResult));
    }

    [TestMethod]
    public async Task VendedorSinAsignacionNoRecibeDatos()
    {
        await using var f = await Fixture.Create();
        var ventas = ComoVendedor(new VentasController(f.Db, null!, null!, null!), f.User);
        foreach (var cuenta in new[] { false, true })
        {
            var rows = (IEnumerable<VentaDto>)((OkObjectResult)await ventas.GetAll(null, null, cuenta)).Value!;
            Assert.AreEqual(0, rows.Count());
        }
        var clientes = ComoVendedor(new ClientesController(f.Db), f.User);
        var lista = (IEnumerable<ClienteDto>)((OkObjectResult)await clientes.GetAll(null)).Value!;
        Assert.AreEqual(0, lista.Count());
        Assert.IsInstanceOfType(await clientes.GetById(f.Cliente.Id), typeof(NotFoundResult));
    }
}
