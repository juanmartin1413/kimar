using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using KimarApi.Data;
using KimarApi.Models;
using KimarApi.Models.Entities;
using KimarApi.Services;
using KimarApi.Services.Facturacion;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/cobranzas")]
[Authorize(Roles = Roles.Comercial)]
public class CobranzasController(KimarDbContext db, VentaService ventaSvc) : ControllerBase
{
    private IQueryable<Cobranza> Consulta() {
        var query = db.Cobranzas.Include(c => c.Cliente).Include(c => c.Venta)
            .Include(c => c.Imputaciones).ThenInclude(i => i.Pago).AsQueryable();
        if (User.FindFirst("rol")?.Value == Roles.Vendedor) {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            query = query.Where(c => db.Vendedores.Any(v => v.UsuarioId == userId && v.Id == c.Cliente.VendedorId));
        }
        return query;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? estado, [FromQuery] Guid? clienteId) {
        var query = Consulta();
        if (clienteId.HasValue) query = query.Where(c => c.ClienteId == clienteId);
        var list = await query.ToListAsync();
        return Ok(list.SelectMany(CobranzaRules.Movimientos).Where(c => estado == null || c.Estado == estado).OrderBy(c => c.Fecha));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id) {
        var compromiso = await Consulta().FirstOrDefaultAsync(c => c.Id == id);
        return compromiso is null ? NotFound() : Ok(CobranzaRules.Movimientos(compromiso));
    }

    [HttpGet("cuenta/{clienteId}")]
    public async Task<IActionResult> Cuenta(Guid clienteId) {
        var cliente = await db.Clientes.FindAsync(clienteId);
        if (cliente is null) return NotFound();
        if (User.FindFirst("rol")?.Value == Roles.Vendedor) {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            if (!await db.Vendedores.AnyAsync(v => v.UsuarioId == userId && v.Id == cliente.VendedorId)) return NotFound();
        }
        var compromisos = await Consulta().Where(c => c.ClienteId == clienteId).OrderBy(c => c.Fecha).ToListAsync();
        return Ok(new { saldo = compromisos.Sum(c => c.Monto - (c.Venta?.CreditoAplicado ?? 0) - c.Imputaciones.Sum(i => i.Monto)),
            operaciones = compromisos.Select(c => new { ventaId = c.VentaId, nroRemito = c.Venta?.NroRemito, vencimiento = c.Fecha,
                total = c.Monto, credito = c.Venta?.CreditoAplicado ?? 0, cobrado = c.Imputaciones.Sum(i => i.Monto),
                saldo = c.Monto - (c.Venta?.CreditoAplicado ?? 0) - c.Imputaciones.Sum(i => i.Monto),
                pagos = c.Imputaciones.Select(i => new { id = i.PagoId, fecha = i.Pago.Fecha, monto = i.Monto, formaPago = i.Pago.FormaPago }) }) });
    }

    [HttpGet("pagos")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Pagos() {
        var pagos = await db.PagosCliente.Include(p => p.Cliente).Include(p => p.Imputaciones).ThenInclude(i => i.Cobranza).ThenInclude(c => c.Venta)
            .OrderByDescending(p => p.Fecha).ThenByDescending(p => p.FechaCreacion).ToListAsync();
        return Ok(pagos.Select(p => new { p.Id, p.ClienteId, clienteNombre = p.Cliente.Nombre, p.Fecha, p.Monto, p.FormaPago, p.Observaciones,
            imputaciones = p.Imputaciones.Select(i => new { i.CobranzaId, i.Cobranza.VentaId, nroRemito = i.Cobranza.Venta?.NroRemito, i.Monto }) }));
    }

    private async Task<List<Cobranza>> Deudas(Guid clienteId) => await db.Cobranzas.Include(c => c.Venta).Include(c => c.Imputaciones)
        .Where(c => c.ClienteId == clienteId && c.Estado != "cancelado" && c.Venta != null && c.Venta.CreditoAplicado == 0).ToListAsync();

    private static string Version(List<Cobranza> deudas) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
        FiscalRules.Serialize(deudas.OrderBy(c => c.Id).Select(c => new { c.Id, c.Fecha, saldo = CobranzaRules.Saldo(c).ToString("F2", System.Globalization.CultureInfo.InvariantCulture) })))));

    [HttpPost("previsualizar")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Preview(PreviewPagoRequest req) {
        var deudas = await Deudas(req.ClienteId);
        return Ok(new { version = Version(deudas), deudas = CobranzaRules.Proponer(deudas, req.Monto, req.PrioridadId) });
    }

    [HttpPost("pagos")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Confirmar(ConfirmarPagoRequest req) {
        if (req.OperacionId == Guid.Empty || req.Fecha == default || req.FormaPago is not ("efectivo" or "transferencia" or "cheque") || req.Observaciones?.Length > 500)
            return BadRequest(new { error = "Revisá los datos del pago." });
        var huella = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(FiscalRules.Serialize(req))));
        await using var tx = await db.Database.BeginTransactionAsync();
        // Mismo orden de bloqueo que edición y liquidación de comisiones. También bloquea las escrituras fiscales.
        await db.Database.ExecuteSqlRawAsync("LOCK TABLE \"Ventas\", \"ItemsVenta\", \"Cobranzas\", \"Vendedores\" IN SHARE ROW EXCLUSIVE MODE");
        var existente = await db.PagosCliente.FirstOrDefaultAsync(p => p.OperacionId == req.OperacionId);
        if (existente is not null) return existente.Huella == huella ? Ok(new { id = existente.Id }) : Conflict(new { error = "La operación ya fue registrada con otros datos." });
        var deudas = await Deudas(req.ClienteId);
        if (Version(deudas) != req.Version) return Conflict(new { error = "Cambió el estado de cuenta. Actualizá y revisá la distribución antes de confirmar." });
        CobranzaRules.Proponer(deudas, req.Monto, null);
        CobranzaRules.ValidarAplicaciones(deudas, req.Monto, req.Imputaciones);
        var pago = new PagoCliente { OperacionId = req.OperacionId, Huella = huella, ClienteId = req.ClienteId,
            UsuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value), Fecha = req.Fecha, Monto = req.Monto,
            FormaPago = req.FormaPago, Observaciones = req.Observaciones,
            Imputaciones = req.Imputaciones.Select(i => new ImputacionPago { CobranzaId = i.CobranzaId, Monto = i.Monto }).ToList() };
        db.PagosCliente.Add(pago);
        await db.SaveChangesAsync();
        foreach (var ventaId in deudas.Where(c => req.Imputaciones.Any(i => i.CobranzaId == c.Id)).Select(c => c.VentaId!.Value).Distinct())
            await ventaSvc.RecalcularEstadoAsync(ventaId);
        await tx.CommitAsync();
        return Ok(new { id = pago.Id });
    }
}
