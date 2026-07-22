using System.Security.Claims;
using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/ventas")]
[Authorize]
public class VentasController(KimarDbContext db, StockService stockSvc, VentaService ventaSvc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? estado, [FromQuery] Guid? clienteId)
    {
        var rol = User.FindFirst("rol")?.Value;
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        var query = db.Ventas
            .Include(v => v.Cliente).Include(v => v.Vendedor)
            .Include(v => v.Items).ThenInclude(i => i.Calidad)
            .Include(v => v.Cobranzas).ThenInclude(c => c.Cliente)
            .AsQueryable();

        if (rol == "vendedor")
        {
            var vendedor = await db.Vendedores.FirstOrDefaultAsync(v => v.UsuarioId == userId);
            if (vendedor is not null) query = query.Where(v => v.VendedorId == vendedor.Id);
        }

        if (estado is not null) query = query.Where(v => v.Estado == estado);
        if (clienteId.HasValue) query = query.Where(v => v.ClienteId == clienteId);

        var list = await query.OrderByDescending(v => v.FechaCreacion).ToListAsync();
        return Ok(list.Select(Map));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var v = await db.Ventas
            .Include(x => x.Cliente).Include(x => x.Vendedor)
            .Include(x => x.Items).ThenInclude(i => i.Calidad)
            .Include(x => x.Cobranzas).ThenInclude(c => c.Cliente)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (v is null) return NotFound();
        return Ok(Map(v));
    }

    [HttpPost]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Create([FromBody] CreateVentaRequest req)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        var items = new List<ItemVenta>();
        foreach (var i in req.Items)
        {
            var resolucion = await stockSvc.ResolverCalidadVentaAsync(i.ProductoId, i.CalidadId);
            if (!resolucion.Ok)
                return BadRequest(new { error = resolucion.Error, productoId = i.ProductoId });

            items.Add(new ItemVenta
            {
                ProductoId = i.ProductoId,
                CalidadId = resolucion.CalidadId,
                Descripcion = i.Descripcion,
                Cantidad = i.Cantidad,
                PrecioUnitario = i.PrecioUnitario,
                Subtotal = i.Cantidad * i.PrecioUnitario
            });
        }

        var total = items.Sum(i => i.Subtotal);

        var cobranzas = req.Cobranzas.Select(c => new Cobranza
        {
            ClienteId = req.ClienteId,
            Fecha = c.Fecha,
            Monto = c.Monto,
            FormaPago = c.FormaPago,
            Estado = c.Estado,
            Observaciones = c.Observaciones
        }).ToList();

        var venta = new Venta
        {
            PedidoId = req.PedidoId,
            ClienteId = req.ClienteId,
            VendedorId = req.VendedorId,
            FechaEntrega = req.FechaEntrega,
            NroRemito = req.NroRemito,
            NroFactura = req.NroFactura,
            Total = total,
            Observaciones = req.Observaciones,
            Items = items,
            Cobranzas = cobranzas
        };

        venta.Estado = ventaSvc.CalcularEstado(total, cobranzas);

        db.Ventas.Add(venta);

        // Mark pedido as confirmed
        if (req.PedidoId.HasValue)
        {
            var pedido = await db.Pedidos.FindAsync(req.PedidoId.Value);
            if (pedido is not null) pedido.Estado = "confirmado";
        }

        await db.SaveChangesAsync();

        // Register stock exits
        await stockSvc.RegistrarSalidaVentaAsync(venta, userId);

        return CreatedAtAction(nameof(GetById), new { id = venta.Id }, new { id = venta.Id });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,gestor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVentaRequest req)
    {
        var v = await db.Ventas.FindAsync(id);
        if (v is null) return NotFound();
        if (req.NroRemito is not null) v.NroRemito = req.NroRemito;
        if (req.NroFactura is not null) v.NroFactura = req.NroFactura;
        if (req.Observaciones is not null) v.Observaciones = req.Observaciones;
        await db.SaveChangesAsync();
        return Ok(new { id = v.Id });
    }

    private static VentaDto Map(Venta v) => new(
        v.Id, v.PedidoId, v.ClienteId, v.Cliente?.Nombre ?? "", v.VendedorId, v.Vendedor?.Nombre ?? "",
        v.FechaEntrega, v.NroRemito, v.NroFactura, v.Total, v.Estado, v.Observaciones, v.FechaCreacion,
        v.Items.Select(i => new ItemVentaDto(i.Id, i.ProductoId, i.CalidadId, i.Calidad?.Nombre, i.Descripcion, i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList(),
        v.Cobranzas.Select(c => new CobranzaDto(c.Id, c.VentaId, c.ClienteId, c.Cliente?.Nombre ?? "", c.Fecha, c.Monto, c.FormaPago, c.Estado, c.Observaciones, c.FechaCreacion)).ToList());
}
