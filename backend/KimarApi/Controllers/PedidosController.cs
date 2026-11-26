using System.Security.Claims;
using KimarApi.Data;
using KimarApi.Models;
using KimarApi.Services;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/pedidos")]
[Authorize(Roles = Roles.Comercial)]
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
            query = vendedor is null ? query.Where(p => false) : query.Where(p => p.Cliente.VendedorId == vendedor.Id);
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
        if (User.FindFirst("rol")?.Value == "vendedor") {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            if (!await db.Vendedores.AnyAsync(v => v.UsuarioId == userId && v.Id == p.Cliente.VendedorId)) return NotFound();
        }
        return Ok(Map(p));
    }

    [HttpPost]
    [Authorize(Roles = Roles.Comercial)]
    public async Task<IActionResult> Create([FromBody] CreatePedidoRequest req)
    {
        if (!CobranzaRules.HorarioValido(req.FechaEntrega, req.HoraEntregaDesde, req.HoraEntregaHasta) || req.Fecha == default)
            return BadRequest(new { error = "Revisá las fechas y el rango de entrega." });
        var cliente = await db.Clientes.FindAsync(req.ClienteId);
        if (cliente is null || !cliente.Activo) return BadRequest(new { error = "Cliente inválido." });
        var vendedorId = req.VendedorId;
        if (User.FindFirst("rol")?.Value == "vendedor") {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var vendedor = await db.Vendedores.FirstOrDefaultAsync(v => v.UsuarioId == userId && v.Activo);
            if (vendedor is null || cliente.VendedorId != vendedor.Id) return Forbid();
            vendedorId = vendedor.Id;
        }
        if (!await db.Vendedores.AnyAsync(v => v.Id == vendedorId && v.Activo)) return BadRequest(new { error = "Vendedor inválido." });
        if (req.Items.Count == 0 || req.Items.Any(i => i.Cantidad <= 0 || i.PrecioUnitario < 0)) return BadRequest(new { error = "Revisá los productos del pedido." });
        var pedido = new Pedido
        {
            ClienteId = req.ClienteId,
            VendedorId = vendedorId,
            FechaEntrega = req.FechaEntrega, HoraEntregaDesde = req.HoraEntregaDesde, HoraEntregaHasta = req.HoraEntregaHasta,
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
        p.Items.Select(i => new ItemPedidoDto(i.Id, i.ProductoId, i.ProductoNombre, i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList(), p.FechaEntrega, p.HoraEntregaDesde, p.HoraEntregaHasta);
}
