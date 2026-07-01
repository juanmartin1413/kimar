using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/cobranzas")]
[Authorize]
public class CobranzasController(KimarDbContext db, VentaService ventaSvc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? estado, [FromQuery] Guid? clienteId)
    {
        var query = db.Cobranzas.Include(c => c.Cliente).AsQueryable();
        if (estado is not null) query = query.Where(c => c.Estado == estado);
        if (clienteId.HasValue) query = query.Where(c => c.ClienteId == clienteId);

        var list = await query.OrderBy(c => c.Fecha).ToListAsync();
        return Ok(list.Select(Map));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var c = await db.Cobranzas.Include(x => x.Cliente).FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return NotFound();
        return Ok(Map(c));
    }

    [HttpPost]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Create([FromBody] CobranzaRequest req, [FromQuery] Guid? ventaId, [FromQuery] Guid clienteId)
    {
        var c = new Cobranza
        {
            VentaId = ventaId,
            ClienteId = clienteId,
            Fecha = req.Fecha,
            Monto = req.Monto,
            FormaPago = req.FormaPago,
            Estado = req.Estado,
            Observaciones = req.Observaciones
        };
        db.Cobranzas.Add(c);
        await db.SaveChangesAsync();
        if (ventaId.HasValue) await ventaSvc.RecalcularEstadoAsync(ventaId.Value);
        return CreatedAtAction(nameof(GetById), new { id = c.Id }, Map(c));
    }

    [HttpPost("{id}/cobrar")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Cobrar(Guid id)
    {
        var c = await db.Cobranzas.FindAsync(id);
        if (c is null) return NotFound();
        c.Estado = "cobrado";
        await db.SaveChangesAsync();
        if (c.VentaId.HasValue) await ventaSvc.RecalcularEstadoAsync(c.VentaId.Value);
        return Ok(new { id = c.Id, estado = c.Estado });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CobranzaRequest req)
    {
        var c = await db.Cobranzas.FindAsync(id);
        if (c is null) return NotFound();
        c.Fecha = req.Fecha;
        c.Monto = req.Monto;
        c.FormaPago = req.FormaPago;
        c.Estado = req.Estado;
        c.Observaciones = req.Observaciones;
        await db.SaveChangesAsync();
        if (c.VentaId.HasValue) await ventaSvc.RecalcularEstadoAsync(c.VentaId.Value);
        return Ok(Map(c));
    }

    private static CobranzaDto Map(Cobranza c) => new(
        c.Id, c.VentaId, c.ClienteId, c.Cliente?.Nombre ?? "", c.Fecha, c.Monto,
        c.FormaPago, c.Estado, c.Observaciones, c.FechaCreacion);
}
