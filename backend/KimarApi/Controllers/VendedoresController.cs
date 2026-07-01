using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/vendedores")]
[Authorize]
public class VendedoresController(KimarDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.Vendedores
            .Include(v => v.Usuario)
            .Where(v => v.Activo)
            .Select(v => new VendedorDto(v.Id, v.Nombre, v.UsuarioId, v.Usuario != null ? v.Usuario.Email : null, v.Activo))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var v = await db.Vendedores.Include(x => x.Usuario).FirstOrDefaultAsync(x => x.Id == id);
        if (v is null) return NotFound();
        return Ok(new VendedorDto(v.Id, v.Nombre, v.UsuarioId, v.Usuario?.Email, v.Activo));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateVendedorRequest req)
    {
        var v = new Vendedor { Nombre = req.Nombre, UsuarioId = req.UsuarioId };
        db.Vendedores.Add(v);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = v.Id },
            new VendedorDto(v.Id, v.Nombre, v.UsuarioId, null, v.Activo));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVendedorRequest req)
    {
        var v = await db.Vendedores.FindAsync(id);
        if (v is null) return NotFound();

        if (req.Nombre is not null) v.Nombre = req.Nombre;
        if (req.UsuarioId.HasValue) v.UsuarioId = req.UsuarioId;
        if (req.Activo.HasValue) v.Activo = req.Activo.Value;

        await db.SaveChangesAsync();
        return Ok(new VendedorDto(v.Id, v.Nombre, v.UsuarioId, null, v.Activo));
    }
}
