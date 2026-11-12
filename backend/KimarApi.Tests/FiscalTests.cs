using System.Security.Claims;
using System.Text;
using KimarApi.Controllers;
using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services;
using KimarApi.Services.Facturacion;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Npgsql;

namespace KimarApi.Tests;

[TestClass]
public class FiscalTests
{
    [TestMethod]
    public void CuitAndRounding()
    {
        Assert.IsTrue(FiscalRules.ValidCuit("20-12345678-6"));
        Assert.IsFalse(FiscalRules.ValidCuit("20123456780"));
        Assert.AreEqual(10.01m, FiscalRules.Money(10.005m));
        Assert.ThrowsException<FiscalException>(() => FiscalRules.ValidateReceptor(new("Cliente", "20123456786", 5, "Calle 1")));
        Assert.ThrowsException<FiscalException>(() => FiscalRules.ValidateDate(FiscalRules.Hoy.AddDays(-6)));
    }
    [TestMethod]
    public void SoapAndPdfPreserveFiscalData()
    {
        var c = Fixture.Document(Guid.NewGuid(), Guid.NewGuid()); c.Numero = 42; c.Cae = "12345678901234";
        c.Estado = "autorizado"; c.VencimientoCae = FiscalRules.Hoy.AddDays(10);
        var detail = ArcaClient.BuildDetail(c, null);
        var names = detail.Elements().Select(x => x.Name.LocalName).ToArray();
        Assert.IsTrue(Array.IndexOf(names, "CondicionIVAReceptorId") < Array.IndexOf(names, "Iva"));
        Assert.AreEqual("121.00", detail.Elements().First(x => x.Name.LocalName == "ImpTotal").Value);
        var pdf = FiscalPdf.Render(c, null);
        var text = Encoding.Latin1.GetString(pdf);
        Assert.IsTrue(text.StartsWith("%PDF-1.4"));
        Assert.IsTrue(text.Contains("00001-00000042")); Assert.IsTrue(text.Contains(c.Cae));
        Assert.IsTrue(text.Contains("SIN VALIDEZ FISCAL"));
        c.Tipo = 3;
        var original = Fixture.Document(c.VentaId!.Value, c.ClienteId); original.Numero = 40;
        Assert.IsTrue(ArcaClient.BuildDetail(c, original).ToString().Contains("CbtesAsoc"));
        Assert.IsTrue(Encoding.Latin1.GetString(FiscalPdf.Render(c, original)).Contains("Factura asociada"));
    }
    [TestMethod]
    public async Task TimeoutAfterAuthorizationRecoversWithoutSecondEmission()
    {
        await using var f = await Fixture.Create();
        var c = Fixture.Document(f.Venta.Id, f.Cliente.Id); f.Db.Add(c); await f.Db.SaveChangesAsync();
        var fake = new FakeArca { LoseResponse = true };
        await f.Processor(fake).ProcessAsync(c.Id, default);
        Assert.AreEqual("desconocido", c.Estado); Assert.AreEqual(1L, c.Numero);
        Assert.IsTrue(c.ProximoIntento > DateTime.UtcNow.AddMinutes(14));
        c.ProximoIntento = DateTime.UtcNow.AddSeconds(-1); await f.Db.SaveChangesAsync();
        await f.Processor(fake).ProcessAsync(c.Id, default);
        Assert.AreEqual("autorizado", c.Estado); Assert.AreEqual(1, fake.Emissions);
        Assert.IsNotNull(c.RutaPdf); Assert.AreEqual("00001-00000001", f.Venta.NroFactura);
    }
    [TestMethod]
    public async Task TransientRetriesDoNotStopAfterTwelve()
    {
        await using var f = await Fixture.Create();
        var c = Fixture.Document(f.Venta.Id, f.Cliente.Id); c.Intentos = 12; f.Db.Add(c); await f.Db.SaveChangesAsync();
        var fake = new FakeArca { Offline = true };
        await f.Processor(fake).ProcessAsync(c.Id, default);
        Assert.AreEqual(13, c.Intentos); Assert.AreEqual("pendiente", c.Estado); Assert.IsNotNull(c.ProximoIntento);
    }
    [TestMethod]
    public async Task UnknownNumberBlocksFollowingDocumentAndManualSharesLock()
    {
        await using var f = await Fixture.Create();
        var first = Fixture.Document(f.Venta.Id, f.Cliente.Id); first.Numero = 1; first.Estado = "desconocido";
        var next = Fixture.Document(f.Venta.Id, f.Cliente.Id); f.Db.AddRange(first, next); await f.Db.SaveChangesAsync();
        var fake = new FakeArca(); await f.Processor(fake).ProcessAsync(next.Id, default);
        Assert.AreEqual(0, fake.Emissions); Assert.IsNull(next.Numero);
        await using var other = new KimarDbContext(f.Options);
        await using var a = new FiscalLock(f.Db, 999); Assert.IsTrue(await a.TryAcquireAsync(default));
        await using var b = new FiscalLock(other, 999); Assert.IsFalse(await b.TryAcquireAsync(default));
    }
    [TestMethod]
    public async Task CreditCancellationPreservesPaymentsAndDoesNotReturnStock()
    {
        await using var f = await Fixture.Create();
        var fc = Fixture.Document(f.Venta.Id, f.Cliente.Id); fc.Estado = "autorizado"; fc.Numero = 1; fc.Cae = "12345678901234";
        f.Db.Add(fc); f.Db.Cobranzas.AddRange(new Cobranza { VentaId = f.Venta.Id, ClienteId = f.Cliente.Id, Fecha = FiscalRules.Hoy, Monto = 60, Estado = "cobrado", FormaPago = "efectivo" },
            new Cobranza { VentaId = f.Venta.Id, ClienteId = f.Cliente.Id, Fecha = FiscalRules.Hoy, Monto = 61, Estado = "pendiente", FormaPago = "efectivo" });
        await f.Db.SaveChangesAsync();
        var nc = await f.Service.CrearNcAsync(fc.Id, new("Anulación", "anular_venta"), f.User, default);
        var duplicate = await f.Service.CrearNcAsync(fc.Id, new("Anulación", "anular_venta"), f.User, default);
        Assert.AreEqual(nc.Id, duplicate.Id);
        await f.Processor(new FakeArca()).ProcessAsync(nc.Id, default);
        Assert.AreEqual(121m, f.Venta.CreditoAplicado);
        Assert.AreEqual(1, await f.Db.Cobranzas.CountAsync()); Assert.AreEqual(60m, await f.Db.Cobranzas.SumAsync(c => c.Monto));
        Assert.AreEqual(0, await f.Db.MovimientosStock.CountAsync());
        await f.Processor(new FakeArca()).ProcessAsync(nc.Id, default);
        Assert.AreEqual(121m, f.Venta.CreditoAplicado);
    }
    [TestMethod]
    public async Task FiscalCorrectionKeepsDebtAndOriginalIssuerAfterSwitch()
    {
        await using var f = await Fixture.Create();
        var fc = Fixture.Document(f.Venta.Id, f.Cliente.Id); fc.Estado = "autorizado"; fc.Numero = 1; fc.Cae = "12345678901234";
        f.Db.Add(fc); await f.Db.SaveChangesAsync();
        f.Configuration["FACTURACION_EMISOR_ACTIVO"] = "sas";
        var nc = await f.Service.CrearNcAsync(fc.Id, new("Corregir descripción", "correccion_fiscal"), f.User, default);
        await f.Processor(new FakeArca()).ProcessAsync(nc.Id, default);
        Assert.AreEqual(0m, f.Venta.CreditoAplicado);
        var datos = FiscalRules.Deserialize<DatosFiscales>(fc.DatosJson);
        var replacement = await f.Service.CorregirAsync(fc.Id, new(datos.Receptor, ["Nueva descripción"], null, FiscalRules.Hoy), f.User, true, default);
        Assert.AreEqual("dueno", replacement.EmisorId); Assert.AreEqual("homologation", replacement.Ambiente);
        Assert.AreEqual(f.Venta.Id, replacement.VentaId); Assert.AreEqual(1, await f.Db.Ventas.CountAsync());
    }
    [TestMethod]
    public async Task PreviewCannotBeConfirmedAfterItemsChange()
    {
        await using var f = await Fixture.Create();
        var p = new Producto { Nombre = "Langostinos", PrecioKg = 100 }; f.Db.Add(p); await f.Db.SaveChangesAsync();
        var items = new List<ItemVentaRequest> { new(p.Id, p.Nombre, 1, 100) };
        var preview = await f.Service.PreviewAsync(new(f.Cliente.Id, items, new("Cliente", "20123456786", 1, "Calle 1"), ["Langostinos premium"]), f.User);
        var req = new CreateVentaRequest(null, f.Cliente.Id, f.Venta.VendedorId, FiscalRules.Hoy, null, null, [new(p.Id, p.Nombre, 2, 100)], [], true, preview.Id, Guid.NewGuid());
        await Assert.ThrowsExceptionAsync<FiscalException>(() => f.Service.ConfirmarBorradorAsync(req, f.User));
    }
    [TestMethod]
    public async Task SaleRegistrationIsAtomicAndIdempotent()
    {
        await using var f = await Fixture.Create();
        var p = new Producto { Nombre = "Langostinos", PrecioKg = 100 }; f.Db.Add(p); await f.Db.SaveChangesAsync();
        var items = new List<ItemVentaRequest> { new(p.Id, p.Nombre, 1, 100) };
        var draft = await f.Service.PreviewAsync(new(f.Cliente.Id, items, new("Cliente", "20123456786", 1, "Calle 1"), ["Detalle fiscal"]), f.User);
        var req = new CreateVentaRequest(null, f.Cliente.Id, f.Venta.VendedorId, FiscalRules.Hoy, null, null, items, [new(FiscalRules.Hoy, 121, "efectivo")], true, draft.Id, Guid.NewGuid());
        var stock = new StockService(f.Db);
        var controller = new VentasController(f.Db, stock, new VentaService(f.Db, stock), f.Service) {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext {
                User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, f.User.ToString())])) } }
        };
        Assert.IsInstanceOfType(await controller.Create(req), typeof(CreatedAtActionResult));
        Assert.IsInstanceOfType(await controller.Create(req), typeof(OkObjectResult));
        Assert.AreEqual(2, await f.Db.Ventas.CountAsync()); // fixture + nueva
        Assert.AreEqual(1, await f.Db.MovimientosStock.CountAsync());
        var sale = await f.Db.Ventas.SingleAsync(v => v.OperacionId == req.OperacionId);
        Assert.AreEqual(121m, sale.Total); Assert.AreEqual(21m, sale.Iva);
        var invalid = req with { OperacionId = Guid.NewGuid(), EmitirFactura = false, BorradorFiscalId = null, Cobranzas = [new(FiscalRules.Hoy, 1000, "efectivo")] };
        await Assert.ThrowsExceptionAsync<FiscalException>(() => controller.Create(invalid));
        Assert.AreEqual(2, await f.Db.Ventas.CountAsync());
    }
    [TestMethod]
    public async Task RejectionCanBeCorrectedButUnknownCannot()
    {
        await using var f = await Fixture.Create();
        var c = Fixture.Document(f.Venta.Id, f.Cliente.Id); f.Db.Add(c); await f.Db.SaveChangesAsync();
        await f.Processor(new FakeArca { Reject = true }).ProcessAsync(c.Id, default);
        Assert.AreEqual("rechazado", c.Estado); Assert.IsNull(c.Numero); Assert.IsNull(c.ProximoIntento);
        var data = FiscalRules.Deserialize<DatosFiscales>(c.DatosJson);
        await f.Service.CorregirAsync(c.Id, new(data.Receptor, ["Corregido"], null, FiscalRules.Hoy), f.User, false, default);
        Assert.AreEqual("pendiente", c.Estado);
        c.Numero = 1; c.Estado = "desconocido"; await f.Db.SaveChangesAsync();
        await Assert.ThrowsExceptionAsync<FiscalException>(() => f.Service.CorregirAsync(c.Id, new(data.Receptor, ["Otro"], null, FiscalRules.Hoy), f.User, false, default));
    }
}

internal sealed class FakeArca : IArcaClient
{
    public bool LoseResponse, Offline, Reject;
    public int Emissions;
    private ArcaAuthorization? issued;
    public Task<long> UltimoAsync(ComprobanteFiscal c, CancellationToken ct) => Offline ? throw new ArcaTransientException("Fuera de servicio") : Task.FromResult(0L);
    public Task<ArcaAuthorization?> ConsultarAsync(ComprobanteFiscal c, CancellationToken ct) => Task.FromResult(issued);
    public Task<ArcaAuthorization> EmitirAsync(ComprobanteFiscal c, ComprobanteFiscal? origin, CancellationToken ct)
    {
        Emissions++;
        if (Reject) throw new ArcaRejectedException("Dato rechazado");
        issued = new("12345678901234", FiscalRules.Hoy.AddDays(10), null);
        if (LoseResponse) { LoseResponse = false; throw new ArcaTransientException("Respuesta perdida"); }
        return Task.FromResult(issued);
    }
}

internal sealed class Fixture : IAsyncDisposable
{
    public KimarDbContext Db = null!;
    public DbContextOptions<KimarDbContext> Options = null!;
    public IConfigurationRoot Configuration = null!;
    public FiscalConfig Config = null!;
    public FacturacionService Service => new(Db, Config);
    public Guid User = Guid.NewGuid();
    public Cliente Cliente = null!;
    public Venta Venta = null!;
    private string directory = "";
    public FiscalProcessor Processor(IArcaClient fake) => new(Db, fake, Config, new FiscalPdf(Config), NullLogger<FiscalProcessor>.Instance);
    public static async Task<Fixture> Create()
    {
        var connection = Environment.GetEnvironmentVariable("KIMAR_TEST_DB");
        if (string.IsNullOrEmpty(connection)) Assert.Inconclusive("Configurar KIMAR_TEST_DB con un servidor PostgreSQL temporal aislado.");
        var cs = new NpgsqlConnectionStringBuilder(connection) { Database = "kimar_fiscal_test_" + Guid.NewGuid().ToString("N") };
        var f = new Fixture();
        f.Options = new DbContextOptionsBuilder<KimarDbContext>().UseNpgsql(cs.ConnectionString).Options;
        f.Db = new(f.Options); await f.Db.Database.MigrateAsync();
        f.directory = Path.Combine(Path.GetTempPath(), "kimar-fiscal-artifacts-" + Guid.NewGuid().ToString("N")); Directory.CreateDirectory(f.directory);
        var cred = Path.Combine(f.directory, "fake-credentials"); await File.WriteAllTextAsync(cred, "test-double-only");
        f.Configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> {
            ["ARCA_ENVIRONMENT"] = "homologation", ["FACTURACION_EMISOR_ACTIVO"] = "dueno",
            ["Storage:UploadsPath"] = f.directory,
            ["Facturacion:Emisores:dueno:Cuit"] = "30712345671", ["Facturacion:Emisores:dueno:RazonSocial"] = "Emisor de prueba",
            ["Facturacion:Emisores:dueno:Domicilio"] = "Calle 1", ["Facturacion:Emisores:dueno:IngresosBrutos"] = "123",
            ["Facturacion:Emisores:dueno:InicioActividades"] = "2020-01-01", ["Facturacion:Emisores:dueno:homologation:PuntoVenta"] = "1",
            ["Facturacion:Emisores:dueno:homologation:CertificadoPath"] = cred, ["Facturacion:Emisores:dueno:homologation:ClavePrivadaPath"] = cred
        }).Build();
        f.Config = new(f.Configuration);
        f.Cliente = new() { Nombre = "Cliente", Cuit = "20123456786" };
        var vendedor = new Vendedor { Nombre = "Vendedor" };
        f.Venta = new() { Cliente = f.Cliente, Vendedor = vendedor, Total = 121, Iva = 21, EmitirFactura = true, FechaEntrega = FiscalRules.Hoy };
        f.Db.Add(new Usuario { Id = f.User, Nombre = "Tester", Email = "test@example.invalid", Rol = "admin" });
        f.Db.Add(f.Venta); await f.Db.SaveChangesAsync(); return f;
    }
    public static ComprobanteFiscal Document(Guid venta, Guid cliente) => new() {
        VentaId = venta, ClienteId = cliente, EmisorId = "dueno", Ambiente = "homologation", CuitEmisor = "30712345671", PuntoVenta = 1,
        Fecha = FiscalRules.Hoy, Neto = 100, Iva = 21, Total = 121, Estado = "pendiente", ProximoIntento = DateTime.UtcNow.AddSeconds(-1),
        DatosJson = FiscalRules.Serialize(new DatosFiscales(new("dueno", "30712345671", "Emisor de prueba", "Calle 1", "123", "2020-01-01", 1),
            new("Cliente", "20123456786", 1, "Calle 2"), [new("Langostinos", 1, "kg", 100, 100, 21)], null))
    };
    public async ValueTask DisposeAsync()
    {
        // Solo bases creadas por esta fixture; nunca se elimina la indicada en la conexión base.
        var database = Db.Database.GetDbConnection().Database;
        if (!database.StartsWith("kimar_fiscal_test_", StringComparison.Ordinal)) throw new InvalidOperationException("Unexpected test database");
        await Db.Database.EnsureDeletedAsync(); await Db.DisposeAsync();
        // Los PDF de prueba quedan en TEMP para inspección; no se borra ningún directorio del usuario.
    }
}
