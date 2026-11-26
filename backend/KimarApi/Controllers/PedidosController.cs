using System.Security.Claims;
using KimarApi.Data;
using KimarApi.Models;
using KimarApi.Services;
using KimarApi.Services.Facturacion;
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
        await using var tx = await db.Database.BeginTransactionAsync();
        var key = FiscalRules.LockKey("pedido:" + id);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({key})");
        var p = await db.Pedidos.FindAsync(id);
        if (p is null) return NotFound();
        if (req.Estado is not null) p.Estado = req.Estado;
        if (req.Observaciones is not null) p.Observaciones = req.Observaciones;
        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return Ok(new { id = p.Id, estado = p.Estado });
    }

    [HttpPut("{id}/completo")]
    [Authorize(Roles = Roles.Comercial)]
    public async Task<IActionResult> UpdateCompleto(Guid id, [FromBody] CreatePedidoRequest req)
    {
        await using var tx = await db.Database.BeginTransactionAsync();
        // Comparte el bloqueo con la confirmación de venta y los cambios de estado.
        var key = FiscalRules.LockKey("pedido:" + id);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({key})");
        var pedido = await db.Pedidos.Include(p => p.Cliente).Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
        if (pedido is null) return NotFound();
        var esVendedor = User.FindFirst("rol")?.Value == Roles.Vendedor;
        if (esVendedor)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var vendedor = await db.Vendedores.FirstOrDefaultAsync(v => v.UsuarioId == userId && v.Activo);
            if (vendedor is null || pedido.VendedorId != vendedor.Id || pedido.Cliente.VendedorId != vendedor.Id) return NotFound();
            if (req.VendedorId != vendedor.Id) return Forbid();
            if (!await db.Clientes.AnyAsync(c => c.Id == req.ClienteId && c.VendedorId == vendedor.Id && c.Activo)) return Forbid();
        }
        if (pedido.Estado != "pendiente" || await db.Ventas.AnyAsync(v => v.PedidoId == id))
            return Conflict(new { error = "Solo se pueden editar pedidos pendientes que todavía no tienen una venta. Actualizá el pedido para ver su estado actual." });
        if (!CobranzaRules.HorarioValido(req.FechaEntrega, req.HoraEntregaDesde, req.HoraEntregaHasta) || req.Fecha == default)
            return BadRequest(new { error = "Revisá las fechas y el horario de entrega." });
        if (req.Observaciones?.Length > 500 || req.Items.Count == 0 || req.Items.Any(i => i.Cantidad <= 0 || i.PrecioUnitario < 0))
            return BadRequest(new { error = "Revisá los productos, cantidades, precios y observaciones del pedido." });
        var cliente = await db.Clientes.FirstOrDefaultAsync(c => c.Id == req.ClienteId && c.Activo);
        var asignado = await db.Vendedores.FirstOrDefaultAsync(v => v.Id == req.VendedorId && v.Activo);
        if (cliente is null || asignado is null) return BadRequest(new { error = "Cliente o vendedor inválido." });
        var ids = req.Items.Select(i => i.ProductoId).Distinct().ToList();
        var productos = await db.Productos.Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
        if (productos.Count != ids.Count || req.Items.Any(i => !productos[i.ProductoId].Activo && !pedido.Items.Any(p => p.ProductoId == i.ProductoId)))
            return BadRequest(new { error = "Hay productos no disponibles en el pedido." });

        db.ItemsPedido.RemoveRange(pedido.Items);
        db.ItemsPedido.AddRange(req.Items.Select(i => new ItemPedido {
            PedidoId = pedido.Id, ProductoId = i.ProductoId, ProductoNombre = productos[i.ProductoId].Nombre,
            Cantidad = i.Cantidad, PrecioUnitario = i.PrecioUnitario, Subtotal = FiscalRules.Money(i.Cantidad * i.PrecioUnitario)
        }));
        pedido.Cliente = cliente;
        pedido.Vendedor = asignado;
        pedido.Fecha = req.Fecha;
        pedido.FechaEntrega = req.FechaEntrega;
        pedido.HoraEntregaDesde = req.HoraEntregaDesde;
        pedido.HoraEntregaHasta = req.HoraEntregaHasta;
        pedido.Observaciones = req.Observaciones;
        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return Ok(new { id = pedido.Id });
    }

    private static PedidoDto Map(Pedido p) => new(
        p.Id, p.ClienteId, p.Cliente?.Nombre ?? "", p.VendedorId, p.Vendedor?.Nombre ?? "",
        p.Fecha, p.Estado, p.Observaciones, p.FechaCreacion,
        p.Items.Select(i => new ItemPedidoDto(i.Id, i.ProductoId, i.ProductoNombre, i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList(), p.FechaEntrega, p.HoraEntregaDesde, p.HoraEntregaHasta);
}
