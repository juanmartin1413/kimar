using System.Security.Claims;
using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/compras")]
[Authorize(Roles = "admin,gestor")]
public class ComprasController(KimarDbContext db, CompraService compraSvc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? proveedorId, [FromQuery] DateOnly? desde,
        [FromQuery] DateOnly? hasta, [FromQuery] int pagina = 1)
    {
        var query = IncludeAll(db.Compras.AsQueryable());

        if (proveedorId.HasValue) query = query.Where(c => c.ProveedorId == proveedorId);
        if (desde.HasValue) query = query.Where(c => c.FechaRecepcion >= desde);
        if (hasta.HasValue) query = query.Where(c => c.FechaRecepcion <= hasta);

        var list = await query
            .OrderByDescending(c => c.FechaCreacion)
            .Skip((pagina - 1) * 50).Take(50)
            .ToListAsync();

        return Ok(list.Select(Map));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var compra = await IncludeAll(db.Compras.AsQueryable()).FirstOrDefaultAsync(c => c.Id == id);
        if (compra is null) return NotFound();
        return Ok(Map(compra));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCompraRequest req)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var resultado = await compraSvc.RegistrarCompraAsync(req, userId);
        if (!resultado.Ok) return BadRequest(new { error = resultado.Error });

        var compra = await IncludeAll(db.Compras.AsQueryable()).FirstAsync(c => c.Id == resultado.Compra!.Id);
        return CreatedAtAction(nameof(GetById), new { id = compra.Id }, Map(compra));
    }

    private static IQueryable<Compra> IncludeAll(IQueryable<Compra> query) => query
        .Include(c => c.Proveedor)
        .Include(c => c.Usuario)
        .Include(c => c.Items).ThenInclude(i => i.Producto)
        .Include(c => c.Items).ThenInclude(i => i.Calidad)
        .Include(c => c.Compromiso).ThenInclude(co => co!.Cuotas);

    private static CompraDto Map(Compra c) => new(
        c.Id, c.ProveedorId, c.Proveedor?.Nombre ?? "", c.UsuarioId, c.Usuario?.Nombre ?? "",
        c.FormaPagoProveedorId, c.FechaRecepcion, c.NroRemito, c.NroFactura, c.Total, c.Estado,
        c.Observaciones, c.FechaCreacion,
        c.Items.Select(i => new ItemCompraDto(
            i.Id, i.ProductoId, i.Producto?.Nombre ?? "", i.CalidadId, i.Calidad?.Nombre,
            i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList(),
        c.Compromiso is null ? null : new CompromisoProvDto(
            c.Compromiso.Id, c.Compromiso.ProveedorId, c.Proveedor?.Nombre ?? "", c.Compromiso.CompraId,
            c.Compromiso.Concepto, c.Compromiso.Observaciones, c.Compromiso.FechaCreacion,
            c.Compromiso.Cuotas.Select(q => new CuotaProvDto(
                q.Id, q.Fecha, q.Monto, q.FormaPago, q.Estado, q.FechaPago, q.MontoPagado, q.FormaPagoReal)).ToList()));
}
