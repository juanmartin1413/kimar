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
            .OrderBy(p => p.Orden).ThenBy(p => p.Nombre)
            .Select(p => new ProductoDto(p.Id, p.Nombre, p.Categoria, p.PrecioKg, p.Unidad, p.Activo, p.Orden))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var p = await db.Productos.FindAsync(id);
        if (p is null) return NotFound();
        return Ok(new ProductoDto(p.Id, p.Nombre, p.Categoria, p.PrecioKg, p.Unidad, p.Activo, p.Orden));
    }

    [HttpPost]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Create([FromBody] CreateProductoRequest req)
    {
        var maxOrden = await db.Productos.Select(p => (int?)p.Orden).MaxAsync() ?? -1;
        var prod = new Producto
        {
            Nombre = req.Nombre,
            Categoria = req.Categoria,
            PrecioKg = req.PrecioKg,
            Unidad = req.Unidad,
            Orden = maxOrden + 1
        };
        db.Productos.Add(prod);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = prod.Id },
            new ProductoDto(prod.Id, prod.Nombre, prod.Categoria, prod.PrecioKg, prod.Unidad, prod.Activo, prod.Orden));
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
        if (req.Orden.HasValue) p.Orden = req.Orden.Value;

        await db.SaveChangesAsync();
        return Ok(new ProductoDto(p.Id, p.Nombre, p.Categoria, p.PrecioKg, p.Unidad, p.Activo, p.Orden));
    }

    [HttpPut("reorden")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Reordenar([FromBody] List<ReordenProductoItem> items)
    {
        var ids = items.Select(i => i.Id).ToList();
        var productos = await db.Productos.Where(p => ids.Contains(p.Id)).ToListAsync();
        var ordenPorId = items.ToDictionary(i => i.Id, i => i.Orden);
        foreach (var p in productos)
            p.Orden = ordenPorId[p.Id];

        await db.SaveChangesAsync();
        return NoContent();
    }

    // Calidades: variantes internas de stock (ej. "Glaseado 20%"). Nunca se exponen en GetAll/GetById
    // (los endpoints públicos de lista de precios), solo bajo estas rutas protegidas.

    [HttpGet("{productoId}/calidades")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> GetCalidades(Guid productoId)
    {
        var list = await db.Calidades
            .Where(c => c.ProductoId == productoId)
            .OrderBy(c => c.Nombre)
            .Select(c => new CalidadDto(c.Id, c.ProductoId, c.Nombre, c.Activo))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("calidades")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> CreateCalidad([FromBody] CreateCalidadRequest req)
    {
        var producto = await db.Productos.FindAsync(req.ProductoId);
        if (producto is null) return NotFound(new { error = "Producto no encontrado" });

        var existe = await db.Calidades.AnyAsync(c => c.ProductoId == req.ProductoId && c.Nombre == req.Nombre);
        if (existe) return BadRequest(new { error = "Ya existe una calidad con ese nombre para este producto" });

        var cal = new Calidad { ProductoId = req.ProductoId, Nombre = req.Nombre };
        db.Calidades.Add(cal);
        await db.SaveChangesAsync();
        return Ok(new CalidadDto(cal.Id, cal.ProductoId, cal.Nombre, cal.Activo));
    }

    [HttpPut("calidades/{id}")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> UpdateCalidad(Guid id, [FromBody] UpdateCalidadRequest req)
    {
        var cal = await db.Calidades.FindAsync(id);
        if (cal is null) return NotFound();

        if (req.Nombre is not null) cal.Nombre = req.Nombre;
        if (req.Activo.HasValue) cal.Activo = req.Activo.Value;

        await db.SaveChangesAsync();
        return Ok(new CalidadDto(cal.Id, cal.ProductoId, cal.Nombre, cal.Activo));
    }
}
