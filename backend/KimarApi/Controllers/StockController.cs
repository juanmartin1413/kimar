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
[Route("api/stock")]
[Authorize(Roles = "admin,gestor")]
public class StockController(KimarDbContext db, StockService stockSvc) : ControllerBase
{
    [HttpGet("actual")]
    public async Task<IActionResult> GetActual()
    {
        var productos = await db.Productos.Where(p => p.Activo).ToListAsync();
        var stocks = await db.StockPorProducto.ToListAsync();
        var stockMap = stocks.ToDictionary(s => s.ProductoId);

        var result = productos.Select(p =>
        {
            stockMap.TryGetValue(p.Id, out var s);
            var cantidad = s?.Cantidad ?? 0;
            var minimo = s?.StockMinimo ?? 0;
            var estado = cantidad == 0 ? "SIN_STOCK" : cantidad < minimo ? "BAJO" : "NORMAL";
            return new StockActualDto(p.Id, p.Nombre, p.Categoria, cantidad, minimo, estado,
                s?.FechaActualizacion ?? DateTime.MinValue);
        });

        return Ok(result);
    }

    [HttpGet("movimientos")]
    public async Task<IActionResult> GetMovimientos([FromQuery] Guid? productoId, [FromQuery] int pagina = 1)
    {
        var query = db.MovimientosStock
            .Include(m => m.Producto).Include(m => m.Usuario).Include(m => m.Proveedor)
            .AsQueryable();

        if (productoId.HasValue) query = query.Where(m => m.ProductoId == productoId);

        var list = await query
            .OrderByDescending(m => m.FechaCreacion)
            .Skip((pagina - 1) * 50).Take(50)
            .ToListAsync();

        return Ok(list.Select(Map));
    }

    [HttpPost("entrada")]
    public async Task<IActionResult> RegistrarEntrada([FromBody] RegistrarEntradaRequest req)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var mov = new MovimientoStock
        {
            ProductoId = req.ProductoId,
            Tipo = "entrada",
            Cantidad = req.Cantidad,
            Motivo = "compra",
            UsuarioId = userId,
            ProveedorId = req.ProveedorId,
            Fecha = req.Fecha,
            Observaciones = req.Observaciones
        };
        await stockSvc.AplicarMovimientoAsync(mov);
        return Ok(new { id = mov.Id });
    }

    [HttpPost("ajuste")]
    public async Task<IActionResult> AjusteManual([FromBody] AjusteStockRequest req)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var actual = await stockSvc.GetStockActualAsync(req.ProductoId);
        var diferencia = req.CantidadNueva - actual;

        if (diferencia == 0) return Ok(new { mensaje = "Sin cambios" });

        var mov = new MovimientoStock
        {
            ProductoId = req.ProductoId,
            Tipo = diferencia > 0 ? "entrada" : "salida",
            Cantidad = Math.Abs(diferencia),
            Motivo = "ajuste",
            UsuarioId = userId,
            Fecha = DateOnly.FromDateTime(DateTime.UtcNow),
            Observaciones = req.Observaciones ?? "Ajuste manual"
        };
        await stockSvc.AplicarMovimientoAsync(mov);
        return Ok(new { id = mov.Id, diferencia });
    }

    [HttpPut("{productoId}/minimo")]
    public async Task<IActionResult> UpdateMinimo(Guid productoId, [FromBody] UpdateStockMinimoRequest req)
    {
        var stock = await db.StockPorProducto.FirstOrDefaultAsync(s => s.ProductoId == productoId);
        if (stock is null)
        {
            stock = new StockPorProducto { ProductoId = productoId, StockMinimo = req.StockMinimo };
            db.StockPorProducto.Add(stock);
        }
        else
        {
            stock.StockMinimo = req.StockMinimo;
        }
        await db.SaveChangesAsync();
        return Ok(new { productoId, stockMinimo = req.StockMinimo });
    }

    [HttpPost("real")]
    public async Task<IActionResult> RegistrarStockReal([FromBody] RegistrarStockRealRequest req)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var registro = new StockRealRegistrado
        {
            ProductoId = req.ProductoId,
            Cantidad = req.Cantidad,
            Fecha = req.Fecha,
            UsuarioId = userId,
            Observaciones = req.Observaciones
        };
        db.StockRealRegistrado.Add(registro);
        await db.SaveChangesAsync();
        return Ok(new { id = registro.Id });
    }

    [HttpGet("auditoria")]
    public async Task<IActionResult> GetAuditoria()
    {
        var productos = await db.Productos.Where(p => p.Activo).ToListAsync();
        var stocks = await db.StockPorProducto.ToDictionaryAsync(s => s.ProductoId);
        var reales = await db.StockRealRegistrado
            .GroupBy(r => r.ProductoId)
            .Select(g => new { ProductoId = g.Key, Ultimo = g.OrderByDescending(r => r.Fecha).First() })
            .ToListAsync();
        var realMap = reales.ToDictionary(r => r.ProductoId, r => r.Ultimo);

        var result = productos.Select(p =>
        {
            stocks.TryGetValue(p.Id, out var s);
            realMap.TryGetValue(p.Id, out var r);
            var teorico = s?.Cantidad ?? 0;
            var fisico = r?.Cantidad;
            var discrepancia = fisico.HasValue ? fisico.Value - teorico : (decimal?)null;
            return new
            {
                ProductoId = p.Id,
                p.Nombre,
                StockTeorico = teorico,
                StockFisico = fisico,
                Discrepancia = discrepancia,
                Estado = fisico is null ? "SIN_CONTEO"
                    : discrepancia == 0 ? "OK"
                    : discrepancia > 0 ? "SOBRANTE"
                    : "FALTANTE",
                UltimoConteo = r?.Fecha
            };
        });

        return Ok(result);
    }

    private static MovimientoStockDto Map(MovimientoStock m) => new(
        m.Id, m.ProductoId, m.Producto?.Nombre ?? "", m.Tipo, m.Cantidad, m.Motivo,
        m.UsuarioId, m.Usuario?.Nombre ?? "", m.VentaId, m.ProveedorId,
        m.Proveedor?.Nombre, m.Fecha, m.Observaciones, m.FechaCreacion);
}
