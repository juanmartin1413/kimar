using KimarApi.Data;
using KimarApi.Models;
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
    [Authorize(Roles = Roles.Comercial)]
    public async Task<IActionResult> GetAll([FromQuery] string? estado, [FromQuery] Guid? clienteId)
    {
        var query = db.Cobranzas.Include(c => c.Cliente).AsQueryable();
        if (estado is not null) query = query.Where(c => c.Estado == estado);
        if (clienteId.HasValue) query = query.Where(c => c.ClienteId == clienteId);

        var list = await query.OrderBy(c => c.Fecha).ToListAsync();
        return Ok(list.Select(Map));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = Roles.Comercial)]
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
            // Alta ya cobrada (pago contado): la fecha planificada es la fecha real de cobro.
            FechaCobro = req.Estado == "cobrado" ? req.Fecha : null,
            Observaciones = req.Observaciones
        };
        db.Cobranzas.Add(c);
        await db.SaveChangesAsync();
        if (ventaId.HasValue) await ventaSvc.RecalcularEstadoAsync(ventaId.Value);
        return CreatedAtAction(nameof(GetById), new { id = c.Id }, Map(c));
    }

    [HttpPost("{id}/cobrar")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Cobrar(Guid id, [FromBody] CobrarCobranzaRequest? req = null)
    {
        var c = await db.Cobranzas.FindAsync(id);
        if (c is null) return NotFound();
        // No se vuelve a cobrar: pisaría la fecha de cobro original.
        if (c.Estado == "cobrado") return BadRequest(new { error = "La cobranza ya está cobrada." });
        c.Estado = "cobrado";
        c.FechaCobro = req?.FechaCobro ?? DateOnly.FromDateTime(DateTime.UtcNow);
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
        // Una cobranza cobrada es intocable; para cobrar existe POST {id}/cobrar.
        if (c.Estado == "cobrado") return BadRequest(new { error = "No se puede modificar una cobranza ya cobrada." });
        if (req.Estado == "cobrado") return BadRequest(new { error = "Para marcar como cobrada usá la acción Cobrar." });
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
        c.FormaPago, c.Estado, c.Observaciones, c.FechaCreacion, c.FechaCobro);
}
