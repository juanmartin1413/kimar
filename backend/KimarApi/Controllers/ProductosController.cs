using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/productos")]
[Authorize]
public class ProductosController(KimarDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? activo)
    {
        var query = db.Productos.AsQueryable();
        if (activo.HasValue) query = query.Where(p => p.Activo == activo.Value);

        var list = await query
            .OrderBy(p => p.Categoria).ThenBy(p => p.Nombre)
            .Select(p => new ProductoDto(p.Id, p.Nombre, p.Categoria, p.PrecioKg, p.Unidad, p.Activo))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var p = await db.Productos.FindAsync(id);
        if (p is null) return NotFound();
        return Ok(new ProductoDto(p.Id, p.Nombre, p.Categoria, p.PrecioKg, p.Unidad, p.Activo));
    }

    [HttpPost]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Create([FromBody] CreateProductoRequest req)
    {
        var prod = new Producto
        {
            Nombre = req.Nombre,
            Categoria = req.Categoria,
            PrecioKg = req.PrecioKg,
            Unidad = req.Unidad
        };
        db.Productos.Add(prod);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = prod.Id },
            new ProductoDto(prod.Id, prod.Nombre, prod.Categoria, prod.PrecioKg, prod.Unidad, prod.Activo));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductoRequest req)
    {
        var p = await db.Productos.FindAsync(id);
        if (p is null) return NotFound();

        if (req.Nombre is not null) p.Nombre = req.Nombre;
        if (req.Categoria is not null) p.Categoria = req.Categoria;
        if (req.PrecioKg.HasValue) p.PrecioKg = req.PrecioKg.Value;
        if (req.Unidad is not null) p.Unidad = req.Unidad;
        if (req.Activo.HasValue) p.Activo = req.Activo.Value;

        await db.SaveChangesAsync();
        return Ok(new ProductoDto(p.Id, p.Nombre, p.Categoria, p.PrecioKg, p.Unidad, p.Activo));
    }
}
