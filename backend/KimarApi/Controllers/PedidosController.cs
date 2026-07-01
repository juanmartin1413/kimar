using System.Security.Claims;
using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/pedidos")]
[Authorize]
public class PedidosController(KimarDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? estado)
    {
        var rol = User.FindFirst("rol")?.Value;
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        var query = db.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Vendedor)
            .Include(p => p.Items)
            .AsQueryable();

        if (rol == "vendedor")
        {
            var vendedor = await db.Vendedores.FirstOrDefaultAsync(v => v.UsuarioId == userId);
            if (vendedor is not null) query = query.Where(p => p.VendedorId == vendedor.Id);
        }

        if (estado is not null) query = query.Where(p => p.Estado == estado);

        var list = await query.OrderByDescending(p => p.FechaCreacion).ToListAsync();
        return Ok(list.Select(Map));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var p = await db.Pedidos
            .Include(x => x.Cliente).Include(x => x.Vendedor).Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound();
        return Ok(Map(p));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePedidoRequest req)
    {
        var pedido = new Pedido
        {
            ClienteId = req.ClienteId,
            VendedorId = req.VendedorId,
            Fecha = req.Fecha,
            Observaciones = req.Observaciones,
            Items = req.Items.Select(i => new ItemPedido
            {
                ProductoId = i.ProductoId,
                ProductoNombre = i.ProductoNombre,
                Cantidad = i.Cantidad,
                PrecioUnitario = i.PrecioUnitario,
                Subtotal = i.Cantidad * i.PrecioUnitario
            }).ToList()
        };
        db.Pedidos.Add(pedido);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = pedido.Id }, new { id = pedido.Id });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePedidoRequest req)
    {
        var p = await db.Pedidos.FindAsync(id);
        if (p is null) return NotFound();
        if (req.Estado is not null) p.Estado = req.Estado;
        if (req.Observaciones is not null) p.Observaciones = req.Observaciones;
        await db.SaveChangesAsync();
        return Ok(new { id = p.Id, estado = p.Estado });
    }

    private static PedidoDto Map(Pedido p) => new(
        p.Id, p.ClienteId, p.Cliente?.Nombre ?? "", p.VendedorId, p.Vendedor?.Nombre ?? "",
        p.Fecha, p.Estado, p.Observaciones, p.FechaCreacion,
        p.Items.Select(i => new ItemPedidoDto(i.Id, i.ProductoId, i.ProductoNombre, i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList());
}
