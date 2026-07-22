using KimarApi.Data;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services;

public record ResolucionCalidad(bool Ok, string? Error, Guid? CalidadId);

public class StockService(KimarDbContext db)
{
    public async Task<decimal> GetStockActualAsync(Guid productoId, Guid? calidadId = null)
    {
        var stock = await db.StockPorProducto
            .FirstOrDefaultAsync(s => s.ProductoId == productoId && s.CalidadId == calidadId);
        return stock?.Cantidad ?? 0;
    }

    // Suma el stock de todas las calidades de un producto (o su única fila si no tiene variantes).
    // Usado por vistas que no conocen calidad, como el banner de stock en Pedidos.
    public async Task<decimal> GetStockTotalAsync(Guid productoId)
    {
        return await db.StockPorProducto
            .Where(s => s.ProductoId == productoId)
            .SumAsync(s => (decimal?)s.Cantidad) ?? 0;
    }

    public async Task AplicarMovimientoAsync(MovimientoStock mov)
    {
        db.MovimientosStock.Add(mov);

        var stock = await db.StockPorProducto
            .FirstOrDefaultAsync(s => s.ProductoId == mov.ProductoId && s.CalidadId == mov.CalidadId);

        if (stock is null)
        {
            stock = new StockPorProducto { ProductoId = mov.ProductoId, CalidadId = mov.CalidadId };
            db.StockPorProducto.Add(stock);
        }

        stock.Cantidad += mov.Tipo == "entrada" ? mov.Cantidad : -mov.Cantidad;
        stock.FechaActualizacion = DateTime.UtcNow;

        await db.SaveChangesAsync();
    }

    public async Task RegistrarSalidaVentaAsync(Venta venta, Guid usuarioId)
    {
        foreach (var item in venta.Items)
        {
            await AplicarMovimientoAsync(new MovimientoStock
            {
                ProductoId = item.ProductoId,
                CalidadId = item.CalidadId,
                Tipo = "salida",
                Cantidad = item.Cantidad,
                Motivo = "venta",
                UsuarioId = usuarioId,
                VentaId = venta.Id,
                Fecha = DateOnly.FromDateTime(DateTime.UtcNow),
                Observaciones = $"Venta automática"
            });
        }
    }

    public async Task<bool> IsStockBajoAsync(Guid productoId)
    {
        var stock = await db.StockPorProducto
            .FirstOrDefaultAsync(s => s.ProductoId == productoId);
        if (stock is null) return false;
        return stock.Cantidad < stock.StockMinimo;
    }

    // Decide qué CalidadId le corresponde a un ítem de venta:
    // - producto sin calidades activas -> null (comportamiento de siempre)
    // - producto con exactamente 1 calidad activa -> se autoselecciona en silencio
    // - producto con 2+ calidades activas -> exige que se haya elegido una válida, si no rechaza
    public async Task<ResolucionCalidad> ResolverCalidadVentaAsync(Guid productoId, Guid? calidadIdSolicitada)
    {
        var activas = await db.Calidades
            .Where(c => c.ProductoId == productoId && c.Activo)
            .ToListAsync();

        if (activas.Count == 0)
            return new ResolucionCalidad(true, null, null);

        if (activas.Count == 1)
            return new ResolucionCalidad(true, null, activas[0].Id);

        if (calidadIdSolicitada is null)
            return new ResolucionCalidad(false,
                "Este producto tiene varias calidades activas: debe seleccionar una para registrar la venta.", null);

        if (!activas.Any(c => c.Id == calidadIdSolicitada))
            return new ResolucionCalidad(false,
                "La calidad seleccionada no es válida o ya no está activa para este producto.", null);

        return new ResolucionCalidad(true, null, calidadIdSolicitada);
    }
}
