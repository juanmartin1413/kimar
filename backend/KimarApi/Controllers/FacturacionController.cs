using System.Security.Claims;
using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Services.Facturacion;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController, Route("api/facturacion"), Authorize(Roles = "admin,gestor")]
public class FacturacionController(KimarDbContext db, FacturacionService svc, FiscalConfig config) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet("configuracion")]
    public IActionResult Configuracion()
    {
        try { return Ok(new { ambiente = config.Ambiente, emisor = config.Emisor(config.EmisorActivo, config.Ambiente), reintentoMinutos = config.RetryMinutes, error = (string?)null }); }
        catch (FiscalException ex) { return Ok(new { ambiente = config.Ambiente, emisor = (object?)null, reintentoMinutos = config.RetryMinutes, error = ex.Message }); }
    }
    [HttpPost("preview")]
    public async Task<IActionResult> Preview(PreviewFacturaRequest req) => Ok(FacturacionService.Map(await svc.PreviewAsync(req, UserId)));
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] Guid? ventaId, [FromQuery] string? estado, [FromQuery] int pagina = 1)
    {
        var q = db.ComprobantesFiscales.AsNoTracking().Where(c => c.VentaId != null);
        if (ventaId.HasValue) q = q.Where(c => c.VentaId == ventaId);
        if (!string.IsNullOrWhiteSpace(estado)) q = q.Where(c => c.Estado == estado);
        var total = await q.CountAsync();
        var rows = await q.OrderByDescending(c => c.FechaCreacion).Skip((Math.Max(1, pagina) - 1) * 50).Take(50).ToListAsync();
        return Ok(new { total, items = rows.Select(FacturacionService.Map) });
    }
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var c = await db.ComprobantesFiscales.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (c is null) return NotFound();
        return Ok(FacturacionService.Map(c));
    }
    [HttpGet("{id:guid}/historial")]
    public async Task<IActionResult> Historial(Guid id) => Ok(await db.IntentosFiscales.Where(i => i.ComprobanteFiscalId == id)
        .OrderByDescending(i => i.Fecha).Take(100).Select(i => new { i.Fecha, i.Numero, i.Resultado, i.Detalle }).ToListAsync());
    [HttpPost("{id:guid}/reintentar")]
    public async Task<IActionResult> Reintentar(Guid id)
    {
        var c = await db.ComprobantesFiscales.FindAsync(id);
        if (c is null || c.VentaId is null) return NotFound();
        await using var gate = new FiscalLock(db, FiscalRules.LockKey($"{c.Ambiente}:{c.CuitEmisor}:{c.PuntoVenta}:{c.Tipo}"));
        if (!await gate.TryAcquireAsync(HttpContext.RequestAborted)) return Conflict(new { error = "Hay una emisión en curso. Volvé a consultar." });
        await db.Entry(c).ReloadAsync();
        if (c.Estado == "rechazado") throw new FiscalException("Corregí los datos rechazados antes de reintentar.");
        if (c.Estado == "autorizado")
        {
            if (c.RutaPdf is not null && System.IO.File.Exists(Path.Combine(config.StorageRoot, c.RutaPdf))) return Ok(FacturacionService.Map(c));
            c.RutaPdf = null; // solo regenerar documento, nunca emitir de nuevo
        }
        else { c.Estado = c.Numero.HasValue ? "desconocido" : "pendiente"; c.ProximoIntento = DateTime.UtcNow; }
        db.IntentosFiscales.Add(new() { ComprobanteFiscalId = c.Id, Resultado = "reintento_manual", Detalle = $"Solicitado por {UserId}" });
        await db.SaveChangesAsync();
        return Accepted(FacturacionService.Map(c));
    }
    [HttpPost("{id:guid}/nota-credito"), Authorize(Roles = "admin")]
    public async Task<IActionResult> NotaCredito(Guid id, NotaCreditoRequest req) =>
        Accepted(FacturacionService.Map(await svc.CrearNcAsync(id, req, UserId, HttpContext.RequestAborted)));
    [HttpPost("{id:guid}/corregir")]
    public async Task<IActionResult> Corregir(Guid id, CorregirFiscalRequest req) =>
        Ok(FacturacionService.Map(await svc.CorregirAsync(id, req, UserId, false, HttpContext.RequestAborted)));
    [HttpPost("{id:guid}/reemplazar"), Authorize(Roles = "admin")]
    public async Task<IActionResult> Reemplazar(Guid id, CorregirFiscalRequest req) =>
        Accepted(FacturacionService.Map(await svc.CorregirAsync(id, req, UserId, true, HttpContext.RequestAborted)));
    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> Pdf(Guid id)
    {
        var c = await db.ComprobantesFiscales.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (c is null || c.Estado != "autorizado") return NotFound();
        if (c.RutaPdf is null || !System.IO.File.Exists(Path.Combine(config.StorageRoot, c.RutaPdf)))
            return Conflict(new { error = "El PDF todavía no está disponible. Usá Reintentar para regenerarlo." });
        var bytes = await System.IO.File.ReadAllBytesAsync(Path.Combine(config.StorageRoot, c.RutaPdf));
        Response.Headers.CacheControl = "private, no-store";
        return File(bytes, "application/pdf", $"{(c.Tipo == 1 ? "FC" : "NC")}-A-{c.PuntoVenta:D5}-{c.Numero:D8}.pdf");
    }
}
