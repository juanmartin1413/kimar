using System.Security.Claims;
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
[Route("api/ventas")]
[Authorize]
public class VentasController(KimarDbContext db, StockService stockSvc, VentaService ventaSvc) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = Roles.Comercial)]
    public async Task<IActionResult> GetAll([FromQuery] string? estado, [FromQuery] Guid? clienteId)
    {
        var rol = User.FindFirst("rol")?.Value;
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        var query = db.Ventas
            .Include(v => v.Cliente).Include(v => v.Vendedor).Include(v => v.Repartidor)
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
    [Authorize(Roles = Roles.Comercial)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var v = await db.Ventas
            .Include(x => x.Cliente).Include(x => x.Vendedor).Include(x => x.Repartidor)
            .Include(x => x.Items).ThenInclude(i => i.Calidad)
            .Include(x => x.Cobranzas).ThenInclude(c => c.Cliente)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (v is null) return NotFound();
        return Ok(Map(v));
    }

    // Listado para el depósito: qué hay que preparar por fecha de entrega. Sin precios ni cobranzas.
    [HttpGet("preparacion")]
    [Authorize(Roles = Roles.GestionYDeposito)]
    public async Task<IActionResult> GetPreparacion([FromQuery] DateOnly desde, [FromQuery] DateOnly hasta)
    {
        if (hasta < desde) return BadRequest(new { error = "El rango de fechas es inválido." });
        if (hasta.DayNumber - desde.DayNumber > 31) return BadRequest(new { error = "El rango máximo es de 31 días." });

        var list = await db.Ventas
            .Include(v => v.Cliente).Include(v => v.Vendedor).Include(v => v.Repartidor)
            .Include(v => v.Items).ThenInclude(i => i.Producto)
            .Include(v => v.Items).ThenInclude(i => i.Calidad)
            .Where(v => v.FechaEntrega >= desde && v.FechaEntrega <= hasta)
            .OrderBy(v => v.FechaEntrega).ThenBy(v => v.Cliente.Nombre)
            .ToListAsync();

        return Ok(list.Select(v => new VentaPreparacionDto(
            v.Id, v.FechaEntrega, v.Cliente?.Nombre ?? "", v.Vendedor?.Nombre ?? "", v.NroRemito, v.Observaciones,
            v.EstadoEntrega, v.RepartidorId, v.Repartidor?.Nombre,
            v.Items.Select(i => new ItemPreparacionDto(
                i.ProductoId, i.Producto?.Nombre ?? i.Descripcion, i.Descripcion,
                i.CalidadId, i.Calidad?.Nombre, i.Cantidad, i.Producto?.Unidad ?? "kg")).ToList())));
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
            NroRemito = await ventaSvc.SiguienteNumeroRemitoAsync(),
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

    // Edición completa (ítems + stock, cabecera y plan de cobro). Solo administrador.
    [HttpPut("{id}/completa")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> UpdateCompleta(Guid id, [FromBody] UpdateVentaCompletaRequest req)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var r = await ventaSvc.ActualizarVentaCompletaAsync(id, req, userId);
        if (r.NotFound) return NotFound();
        if (!r.Ok) return BadRequest(new { error = r.Error });
        return await GetById(id);
    }

    private static VentaDto Map(Venta v) => new(
        v.Id, v.PedidoId, v.ClienteId, v.Cliente?.Nombre ?? "", v.VendedorId, v.Vendedor?.Nombre ?? "",
        v.FechaEntrega, v.NroRemito, v.NroFactura, v.Total, v.Estado, v.Observaciones, v.FechaCreacion,
        v.Items.Select(i => new ItemVentaDto(i.Id, i.ProductoId, i.CalidadId, i.Calidad?.Nombre, i.Descripcion, i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList(),
        v.Cobranzas.Select(c => new CobranzaDto(c.Id, c.VentaId, c.ClienteId, c.Cliente?.Nombre ?? "", c.Fecha, c.Monto, c.FormaPago, c.Estado, c.Observaciones, c.FechaCreacion)).ToList(),
        v.EstadoEntrega, v.RepartidorId, v.Repartidor?.Nombre, v.FechaEntregado);
}
