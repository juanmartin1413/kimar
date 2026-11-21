using System.Security.Claims;
using System.Text.Json;
using KimarApi.Data;
using KimarApi.Models.Entities;
using KimarApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController, Route("api/comisiones"), Authorize(Roles = "admin,vendedor")]
public class ComisionesController(KimarDbContext db, ComisionService service) : ControllerBase
{
    private Guid UsuarioId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool Admin => User.IsInRole("admin");
    private IQueryable<ComisionDocumento> Documentos => db.ComisionDocumentos.AsNoTracking()
        .Where(d => Admin || d.Vendedor.UsuarioId == UsuarioId);
    private static object Map(ComisionDocumento d) => new { d.Id, d.Numero, d.VendedorId, d.Tipo, d.Fecha, d.Creado, d.UsuarioId,
        d.OrigenId, d.Comision, d.Pago, d.Compensado, d.FormaPago, d.Referencia, d.Motivo,
        Datos = JsonSerializer.Deserialize<ComisionSnapshot>(d.DatosJson, ComisionService.Json) };

    [HttpGet("vendedores")]
    public async Task<IActionResult> Vendedores() => Ok(await db.Vendedores.AsNoTracking()
        .Where(v => v.ComisionPorKg > 0 && (Admin || v.UsuarioId == UsuarioId))
        .OrderBy(v => v.Nombre).Select(v => new { v.Id, v.Nombre, Tarifa = v.ComisionPorKg, v.Activo }).ToListAsync());

    [HttpPost("preview"), Authorize(Roles = "admin")]
    public async Task<IActionResult> Preview(ComisionFiltro filtro) => Ok(await service.Preview(filtro));

    [HttpGet("historial")]
    public async Task<IActionResult> Historial([FromQuery] Guid? vendedorId, [FromQuery] int pagina = 1)
    {
        if (pagina < 1) return BadRequest(new { error = "Página inválida." });
        var q = Documentos.Where(d => !vendedorId.HasValue || d.VendedorId == vendedorId);
        var total = await q.CountAsync();
        var rows = await q.OrderByDescending(d => d.Numero).Skip((pagina - 1) * 30).Take(30).ToListAsync();
        return Ok(new { total, pagina, documentos = rows.Select(Map) });
    }

    [HttpGet("saldos")]
    public async Task<IActionResult> Saldos([FromQuery] Guid vendedorId)
    {
        if (!await db.Vendedores.AnyAsync(v => v.Id == vendedorId && (Admin || v.UsuarioId == UsuarioId))) return NotFound();
        var p = await service.Preview(new(vendedorId, ComisionService.Hoy));
        return Ok(new { p.Pagado, p.Liquidada, p.AnticiposPendientes, p.AjusteAnterior, p.Anticipos });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detalle(Guid id)
    {
        var d = await Documentos.SingleOrDefaultAsync(d => d.Id == id);
        return d == null ? NotFound() : Ok(Map(d));
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> Pdf(Guid id)
    {
        var d = await Documentos.SingleOrDefaultAsync(d => d.Id == id);
        return d == null ? NotFound() : File(ComisionPdf.Render(d), "application/pdf", $"Kimar-Comisiones-{d.Numero:D8}.pdf");
    }

    [HttpPost("liquidaciones"), Authorize(Roles = "admin")]
    public async Task<IActionResult> Liquidar(ComisionConfirmar req) => Ok(Map(await service.Confirmar(req, UsuarioId)));

    [HttpPost("anticipos"), Authorize(Roles = "admin")]
    public async Task<IActionResult> Anticipar(ComisionAnticipo req) => Ok(Map(await service.Anticipar(req, UsuarioId)));

    [HttpPost("{id:guid}/contrapartida"), Authorize(Roles = "admin")]
    public async Task<IActionResult> Corregir(Guid id, ComisionCorreccion req) => Ok(Map(await service.Corregir(id, req, UsuarioId)));
}
