using KimarApi.Data;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services;

public class StockService(KimarDbContext db)
{
    public async Task<decimal> GetStockActualAsync(Guid productoId)
    {
        var stock = await db.StockPorProducto
            .FirstOrDefaultAsync(s => s.ProductoId == productoId);
        return stock?.Cantidad ?? 0;
    }

    public async Task AplicarMovimientoAsync(MovimientoStock mov)
    {
        db.MovimientosStock.Add(mov);

        var stock = await db.StockPorProducto
            .FirstOrDefaultAsync(s => s.ProductoId == mov.ProductoId);

        if (stock is null)
        {
            stock = new StockPorProducto { ProductoId = mov.ProductoId };
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
}
