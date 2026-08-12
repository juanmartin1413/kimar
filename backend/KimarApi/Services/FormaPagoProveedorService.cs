using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services;

public record ResultadoFormaPago(bool Ok, string? Error, FormaPagoProveedor? FormaPago);

public class FormaPagoProveedorService(KimarDbContext db)
{
    public async Task<FormaPagoProveedor?> GetVigenteAsync(Guid proveedorId)
    {
        return await db.FormasPagoProveedor
            .Include(f => f.Tramos)
            .Where(f => f.ProveedorId == proveedorId && f.FechaHasta == null)
            .FirstOrDefaultAsync();
    }

    // Cierra la versión vigente (si existe) y crea una nueva con sus tramos. Nunca se edita in-place
    // una versión ya usada: así las Compras viejas siguen apuntando a la condición que tenían.
    public async Task<ResultadoFormaPago> CrearNuevaVersionAsync(Guid proveedorId, CreateFormaPagoRequest req)
    {
        var sumaPorcentajes = req.Tramos.Sum(t => t.Porcentaje);
        if (req.Tramos.Count == 0 || sumaPorcentajes != 100)
            return new ResultadoFormaPago(false, $"La suma de los porcentajes de los tramos debe ser 100 (actual: {sumaPorcentajes}).", null);

        await using var tx = await db.Database.BeginTransactionAsync();

        var vigente = await GetVigenteAsync(proveedorId);
        if (vigente is not null)
            vigente.FechaHasta = req.FechaDesde.AddDays(-1);

        var nueva = new FormaPagoProveedor
        {
            ProveedorId = proveedorId,
            FechaDesde = req.FechaDesde,
            Observaciones = req.Observaciones,
            Tramos = req.Tramos.Select(t => new TramoPago
            {
                Orden = t.Orden,
                Porcentaje = t.Porcentaje,
                DiasPlazo = t.DiasPlazo,
                MetodoPago = t.MetodoPago
            }).ToList()
        };
        db.FormasPagoProveedor.Add(nueva);

        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return new ResultadoFormaPago(true, null, nueva);
    }

    public async Task<List<FormaPagoProveedor>> GetHistorialAsync(Guid proveedorId)
    {
        return await db.FormasPagoProveedor
            .Include(f => f.Tramos)
            .Where(f => f.ProveedorId == proveedorId)
            .OrderByDescending(f => f.FechaDesde)
            .ToListAsync();
    }
}
