using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/proveedores")]
[Authorize(Roles = "admin,gestor")]
public class ProveedoresController(KimarDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.Proveedores
            .Where(p => p.Activo)
            .Select(p => new ProveedorDto(p.Id, p.Nombre, p.Telefono, p.Email, p.Direccion, p.Activo, p.FechaCreacion))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var p = await db.Proveedores.FindAsync(id);
        if (p is null) return NotFound();
        return Ok(new ProveedorDto(p.Id, p.Nombre, p.Telefono, p.Email, p.Direccion, p.Activo, p.FechaCreacion));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProveedorRequest req)
    {
        var p = new Proveedor { Nombre = req.Nombre, Telefono = req.Telefono, Email = req.Email, Direccion = req.Direccion };
        db.Proveedores.Add(p);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = p.Id },
            new ProveedorDto(p.Id, p.Nombre, p.Telefono, p.Email, p.Direccion, p.Activo, p.FechaCreacion));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProveedorRequest req)
    {
        var p = await db.Proveedores.FindAsync(id);
        if (p is null) return NotFound();
        if (req.Nombre is not null) p.Nombre = req.Nombre;
        if (req.Telefono is not null) p.Telefono = req.Telefono;
        if (req.Email is not null) p.Email = req.Email;
        if (req.Direccion is not null) p.Direccion = req.Direccion;
        if (req.Activo.HasValue) p.Activo = req.Activo.Value;
        await db.SaveChangesAsync();
        return Ok(new ProveedorDto(p.Id, p.Nombre, p.Telefono, p.Email, p.Direccion, p.Activo, p.FechaCreacion));
    }

    // ── Compromisos ───────────────────────────────────────────────────────────

    [HttpGet("{id}/compromisos")]
    public async Task<IActionResult> GetCompromisos(Guid id)
    {
        var list = await db.CompromisosProveedor
            .Include(c => c.Proveedor).Include(c => c.Cuotas)
            .Where(c => c.ProveedorId == id)
            .OrderByDescending(c => c.FechaCreacion)
            .ToListAsync();
        return Ok(list.Select(MapCompromiso));
    }

    [HttpPost("compromisos")]
    public async Task<IActionResult> CreateCompromiso([FromBody] CreateCompromisoRequest req)
    {
        var comp = new CompromisoProv
        {
            ProveedorId = req.ProveedorId,
            Concepto = req.Concepto,
            Observaciones = req.Observaciones,
            Cuotas = req.Cuotas.Select(c => new CuotaProv
            {
                Fecha = c.Fecha,
                Monto = c.Monto,
                FormaPago = c.FormaPago
            }).ToList()
        };
        db.CompromisosProveedor.Add(comp);
        await db.SaveChangesAsync();
        return Ok(new { id = comp.Id });
    }

    [HttpPost("cuotas/{id}/pagar")]
    public async Task<IActionResult> PagarCuota(Guid id)
    {
        var cuota = await db.CuotasProveedor.FindAsync(id);
        if (cuota is null) return NotFound();
        cuota.Estado = "pagado";
        cuota.FechaPago = DateOnly.FromDateTime(DateTime.UtcNow);
        await db.SaveChangesAsync();
        return Ok(new { id = cuota.Id, estado = cuota.Estado });
    }

    private static CompromisoProvDto MapCompromiso(CompromisoProv c) => new(
        c.Id, c.ProveedorId, c.Proveedor?.Nombre ?? "", c.Concepto, c.Observaciones, c.FechaCreacion,
        c.Cuotas.Select(q => new CuotaProvDto(q.Id, q.Fecha, q.Monto, q.FormaPago, q.Estado, q.FechaPago)).ToList());
}
