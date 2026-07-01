using KimarApi.Data;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services;

public class VentaService(KimarDbContext db)
{
    public async Task RecalcularEstadoAsync(Guid ventaId)
    {
        var venta = await db.Ventas
            .Include(v => v.Cobranzas)
            .FirstOrDefaultAsync(v => v.Id == ventaId);

        if (venta is null) return;

        var cobrado = venta.Cobranzas
            .Where(c => c.Estado == "cobrado")
            .Sum(c => c.Monto);

        venta.Estado = cobrado >= venta.Total ? "pagado"
            : cobrado > 0 ? "cobrado_parcial"
            : "debe";

        await db.SaveChangesAsync();
    }

    public string CalcularEstado(decimal total, IEnumerable<Cobranza> cobranzas)
    {
        var cobrado = cobranzas.Where(c => c.Estado == "cobrado").Sum(c => c.Monto);
        return cobrado >= total ? "pagado"
            : cobrado > 0 ? "cobrado_parcial"
            : "debe";
    }
}
