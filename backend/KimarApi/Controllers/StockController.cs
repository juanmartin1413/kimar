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
        var calidades = await db.Calidades.ToListAsync();
        var stocks = await db.StockPorProducto.ToListAsync();

        var result = new List<StockActualDto>();
        foreach (var p in productos)
        {
            var calidadesProducto = calidades.Where(c => c.ProductoId == p.Id).ToList();
            var stocksProducto = stocks.Where(s => s.ProductoId == p.Id).ToList();

            if (calidadesProducto.Count == 0)
            {
                var s = stocksProducto.FirstOrDefault(x => x.CalidadId == null);
                result.Add(BuildStockDto(p, null, null, s));
                continue;
            }

            foreach (var c in calidadesProducto.Where(c => c.Activo))
            {
                var s = stocksProducto.FirstOrDefault(x => x.CalidadId == c.Id);
                result.Add(BuildStockDto(p, c.Id, c.Nombre, s));
            }

            // Calidades desactivadas que aún tienen stock remanente: se muestran para no ocultar existencias
            foreach (var c in calidadesProducto.Where(c => !c.Activo))
            {
                var s = stocksProducto.FirstOrDefault(x => x.CalidadId == c.Id);
                if (s is not null && s.Cantidad != 0)
                    result.Add(BuildStockDto(p, c.Id, $"{c.Nombre} (inactiva)", s));
            }
        }

        return Ok(result);
    }

    private static StockActualDto BuildStockDto(Producto p, Guid? calidadId, string? calidadNombre, StockPorProducto? s)
    {
        var cantidad = s?.Cantidad ?? 0;
        var minimo = s?.StockMinimo ?? 0;
        var estado = cantidad == 0 ? "SIN_STOCK" : cantidad < minimo ? "BAJO" : "NORMAL";
        return new StockActualDto(p.Id, p.Nombre, p.Categoria, calidadId, calidadNombre, cantidad, minimo, estado,
            s?.FechaActualizacion ?? DateTime.MinValue);
    }

    [HttpGet("movimientos")]
    public async Task<IActionResult> GetMovimientos([FromQuery] Guid? productoId, [FromQuery] int pagina = 1)
    {
        var query = db.MovimientosStock
            .Include(m => m.Producto).Include(m => m.Usuario).Include(m => m.Proveedor).Include(m => m.Calidad)
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
            CalidadId = req.CalidadId,
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

    [HttpPost("salida")]
    public async Task<IActionResult> RegistrarSalida([FromBody] RegistrarSalidaRequest req)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var mov = new MovimientoStock
        {
            ProductoId = req.ProductoId,
            CalidadId = req.CalidadId,
            Tipo = "salida",
            Cantidad = req.Cantidad,
            Motivo = req.Motivo,
            UsuarioId = userId,
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
        var actual = await stockSvc.GetStockActualAsync(req.ProductoId, req.CalidadId);
        var diferencia = req.CantidadNueva - actual;

        if (diferencia == 0) return Ok(new { mensaje = "Sin cambios" });

        var mov = new MovimientoStock
        {
            ProductoId = req.ProductoId,
            CalidadId = req.CalidadId,
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
        var stock = await db.StockPorProducto
            .FirstOrDefaultAsync(s => s.ProductoId == productoId && s.CalidadId == req.CalidadId);
        if (stock is null)
        {
            stock = new StockPorProducto { ProductoId = productoId, CalidadId = req.CalidadId, StockMinimo = req.StockMinimo };
            db.StockPorProducto.Add(stock);
        }
        else
        {
            stock.StockMinimo = req.StockMinimo;
        }
        await db.SaveChangesAsync();
        return Ok(new { productoId, calidadId = req.CalidadId, stockMinimo = req.StockMinimo });
    }

    [HttpPost("real")]
    public async Task<IActionResult> RegistrarStockReal([FromBody] RegistrarStockRealRequest req)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var registro = new StockRealRegistrado
        {
            ProductoId = req.ProductoId,
            CalidadId = req.CalidadId,
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
        var calidades = await db.Calidades.ToListAsync();
        var stocks = await db.StockPorProducto.ToListAsync();
        // El último conteo físico se registra por (producto, calidad) igual que el stock teórico,
        // para poder auditar cada variante por separado.
        var reales = await db.StockRealRegistrado
            .GroupBy(r => new { r.ProductoId, r.CalidadId })
            .Select(g => new { g.Key.ProductoId, g.Key.CalidadId, Ultimo = g.OrderByDescending(r => r.Fecha).First() })
            .ToListAsync();
        var realMap = reales.ToDictionary(r => (r.ProductoId, r.CalidadId), r => r.Ultimo);

        var result = new List<AuditoriaDto>();
        foreach (var p in productos)
        {
            var calidadesProducto = calidades.Where(c => c.ProductoId == p.Id).ToList();
            var stocksProducto = stocks.Where(s => s.ProductoId == p.Id).ToList();

            if (calidadesProducto.Count == 0)
            {
                var s = stocksProducto.FirstOrDefault(x => x.CalidadId == null);
                result.Add(BuildAuditoriaDto(p, null, null, s?.Cantidad ?? 0, realMap.GetValueOrDefault((p.Id, (Guid?)null))));
                continue;
            }

            foreach (var c in calidadesProducto.Where(c => c.Activo))
            {
                var s = stocksProducto.FirstOrDefault(x => x.CalidadId == c.Id);
                result.Add(BuildAuditoriaDto(p, c.Id, c.Nombre, s?.Cantidad ?? 0, realMap.GetValueOrDefault((p.Id, (Guid?)c.Id))));
            }

            foreach (var c in calidadesProducto.Where(c => !c.Activo))
            {
                var s = stocksProducto.FirstOrDefault(x => x.CalidadId == c.Id);
                if (s is not null && s.Cantidad != 0)
                    result.Add(BuildAuditoriaDto(p, c.Id, $"{c.Nombre} (inactiva)", s.Cantidad, realMap.GetValueOrDefault((p.Id, (Guid?)c.Id))));
            }
        }

        return Ok(result);
    }

    private static AuditoriaDto BuildAuditoriaDto(Producto p, Guid? calidadId, string? calidadNombre, decimal teorico, StockRealRegistrado? r)
    {
        var fisico = r?.Cantidad;
        var discrepancia = fisico.HasValue ? fisico.Value - teorico : (decimal?)null;
        var estado = fisico is null ? "SIN_CONTEO"
            : discrepancia == 0 ? "OK"
            : discrepancia > 0 ? "SOBRANTE"
            : "FALTANTE";
        return new AuditoriaDto(p.Id, p.Nombre, calidadId, calidadNombre, teorico, fisico, discrepancia, estado, r?.Fecha);
    }

    private static MovimientoStockDto Map(MovimientoStock m) => new(
        m.Id, m.ProductoId, m.Producto?.Nombre ?? "", m.CalidadId, m.Calidad?.Nombre, m.Tipo, m.Cantidad, m.Motivo,
        m.UsuarioId, m.Usuario?.Nombre ?? "", m.VentaId, m.ProveedorId,
        m.Proveedor?.Nombre, m.Fecha, m.Observaciones, m.FechaCreacion);
}
