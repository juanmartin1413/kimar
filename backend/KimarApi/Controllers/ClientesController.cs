using System.Security.Claims;
using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/clientes")]
[Authorize]
public class ClientesController(KimarDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? vendedorId)
    {
        var rol = User.FindFirst("rol")?.Value;
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

        var query = db.Clientes
            .Include(c => c.Vendedor)
            .Where(c => c.Activo)
            .AsQueryable();

        if (rol == "vendedor")
        {
            var vendedor = await db.Vendedores.FirstOrDefaultAsync(v => v.UsuarioId == userId);
            if (vendedor is not null)
                query = query.Where(c => c.VendedorId == vendedor.Id);
        }
        else if (vendedorId.HasValue)
        {
            query = query.Where(c => c.VendedorId == vendedorId);
        }

        var list = await query
            .OrderBy(c => c.Nombre)
            .Select(c => new ClienteDto(
                c.Id, c.Nombre, c.Calle, c.Altura, c.Localidad, c.Provincia,
                c.Telefono1, c.Telefono2, c.Email, c.Cuit,
                c.VendedorId, c.Vendedor != null ? c.Vendedor.Nombre : null,
                c.Activo, c.FechaCreacion))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var c = await db.Clientes.Include(x => x.Vendedor).FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return NotFound();
        return Ok(new ClienteDto(c.Id, c.Nombre, c.Calle, c.Altura, c.Localidad, c.Provincia,
            c.Telefono1, c.Telefono2, c.Email, c.Cuit,
            c.VendedorId, c.Vendedor?.Nombre, c.Activo, c.FechaCreacion));
    }

    [HttpPost]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Create([FromBody] CreateClienteRequest req)
    {
        var cliente = new Cliente
        {
            Nombre = req.Nombre,
            Calle = req.Calle,
            Altura = req.Altura,
            Localidad = req.Localidad,
            Provincia = req.Provincia,
            Telefono1 = req.Telefono1,
            Telefono2 = req.Telefono2,
            Email = req.Email,
            Cuit = req.Cuit,
            VendedorId = req.VendedorId
        };
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = cliente.Id },
            new ClienteDto(cliente.Id, cliente.Nombre, cliente.Calle, cliente.Altura, cliente.Localidad,
                cliente.Provincia, cliente.Telefono1, cliente.Telefono2, cliente.Email, cliente.Cuit,
                cliente.VendedorId, null, cliente.Activo, cliente.FechaCreacion));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClienteRequest req)
    {
        var c = await db.Clientes.FindAsync(id);
        if (c is null) return NotFound();

        if (req.Nombre is not null) c.Nombre = req.Nombre;
        if (req.Calle is not null) c.Calle = req.Calle;
        if (req.Altura is not null) c.Altura = req.Altura;
        if (req.Localidad is not null) c.Localidad = req.Localidad;
        if (req.Provincia is not null) c.Provincia = req.Provincia;
        if (req.Telefono1 is not null) c.Telefono1 = req.Telefono1;
        if (req.Telefono2 is not null) c.Telefono2 = req.Telefono2;
        if (req.Email is not null) c.Email = req.Email;
        if (req.Cuit is not null) c.Cuit = req.Cuit;
        if (req.VendedorId.HasValue) c.VendedorId = req.VendedorId;
        if (req.Activo.HasValue) c.Activo = req.Activo.Value;

        await db.SaveChangesAsync();
        return Ok(new ClienteDto(c.Id, c.Nombre, c.Calle, c.Altura, c.Localidad, c.Provincia,
            c.Telefono1, c.Telefono2, c.Email, c.Cuit, c.VendedorId, null, c.Activo, c.FechaCreacion));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var c = await db.Clientes.FindAsync(id);
        if (c is null) return NotFound();
        c.Activo = false;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
