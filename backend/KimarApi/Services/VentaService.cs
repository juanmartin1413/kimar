using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace KimarApi.Services;

public record ResultadoEdicionVenta(bool Ok, string? Error, bool NotFound = false);

public class VentaService(KimarDbContext db, StockService stockSvc)
{
    private static readonly HashSet<string> FormasPagoValidas = ["efectivo", "transferencia", "cheque"];

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

    // Serie "00002" identifica al remito digital (00001 fue la serie del talonario físico).
    // El UPDATE ... RETURNING de Postgres toma un lock de fila e incrementa de forma atómica,
    // evitando números duplicados si dos ventas se crean al mismo tiempo.
    // Se ejecuta con ADO.NET directo (no LINQ de EF) porque EF intenta envolver el SQL en un
    // SELECT para darle forma al resultado, y un UPDATE ... RETURNING no es "componible" así.
    public async Task<string> SiguienteNumeroRemitoAsync()
    {
        var conn = (NpgsqlConnection)db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"UPDATE ""ContadoresRemito"" SET ""Ultimo"" = ""Ultimo"" + 1 WHERE ""Id"" = 1 RETURNING ""Ultimo""";
        if (db.Database.CurrentTransaction is not null)
            cmd.Transaction = (NpgsqlTransaction)db.Database.CurrentTransaction.GetDbTransaction();

        var ultimo = (long)(await cmd.ExecuteScalarAsync())!;
        return $"00002-{ultimo:D8}";
    }

    // ── Edición completa de una venta ya confirmada (solo admin) ─────────────
    // Reemplaza ítems (sincronizando stock por diferencia), datos de cabecera y el plan de cobro.
    // Reglas: las cobranzas "cobrado" son intocables; las pendientes se actualizan/agregan/eliminan.
    public async Task<ResultadoEdicionVenta> ActualizarVentaCompletaAsync(
        Guid ventaId, UpdateVentaCompletaRequest req, Guid usuarioId)
    {
        var venta = await db.Ventas
            .Include(v => v.Items)
            .Include(v => v.Cobranzas)
            .FirstOrDefaultAsync(v => v.Id == ventaId);
        if (venta is null) return new ResultadoEdicionVenta(false, null, NotFound: true);

        if (req.Items.Count == 0)
            return new ResultadoEdicionVenta(false, "La venta debe tener al menos un ítem.");
        if (req.Items.Any(i => i.Cantidad <= 0 || i.PrecioUnitario < 0))
            return new ResultadoEdicionVenta(false, "Los ítems deben tener cantidad mayor a 0 y precio no negativo.");

        // ── Ítems nuevos (resolviendo calidad como en el alta) ──
        var nuevosItems = new List<ItemVenta>();
        foreach (var i in req.Items)
        {
            var resolucion = await stockSvc.ResolverCalidadVentaAsync(i.ProductoId, i.CalidadId);
            if (!resolucion.Ok) return new ResultadoEdicionVenta(false, resolucion.Error);

            nuevosItems.Add(new ItemVenta
            {
                VentaId = venta.Id,
                ProductoId = i.ProductoId,
                CalidadId = resolucion.CalidadId,
                Descripcion = i.Descripcion,
                Cantidad = i.Cantidad,
                PrecioUnitario = i.PrecioUnitario,
                Subtotal = i.Cantidad * i.PrecioUnitario
            });
        }
        var nuevoTotal = nuevosItems.Sum(i => i.Subtotal);

        // ── Validaciones del plan de cobro ──
        var cobradas = venta.Cobranzas.Where(c => c.Estado == "cobrado").ToList();
        var pendientes = venta.Cobranzas.Where(c => c.Estado != "cobrado").ToDictionary(c => c.Id);
        var totalCobrado = cobradas.Sum(c => c.Monto);

        if (nuevoTotal < totalCobrado)
            return new ResultadoEdicionVenta(false,
                $"El total de la venta ({nuevoTotal:N0}) no puede ser menor a lo ya cobrado ({totalCobrado:N0}).");

        if (req.Cobranzas.Any(c => c.Monto <= 0))
            return new ResultadoEdicionVenta(false, "Todas las cuotas deben tener un monto mayor a 0.");
        if (req.Cobranzas.Any(c => !FormasPagoValidas.Contains(c.FormaPago)))
            return new ResultadoEdicionVenta(false, "Forma de pago inválida.");

        var idsEnviados = req.Cobranzas.Where(c => c.Id.HasValue).Select(c => c.Id!.Value).ToList();
        if (idsEnviados.Distinct().Count() != idsEnviados.Count)
            return new ResultadoEdicionVenta(false, "Hay cuotas repetidas en el plan de cobro.");
        foreach (var id in idsEnviados)
        {
            if (cobradas.Any(c => c.Id == id))
                return new ResultadoEdicionVenta(false, "No se puede modificar una cobranza ya cobrada.");
            if (!pendientes.ContainsKey(id))
                return new ResultadoEdicionVenta(false, "Una de las cuotas no pertenece a esta venta o ya no existe.");
        }

        var totalPlan = totalCobrado + req.Cobranzas.Sum(c => c.Monto);
        if (totalPlan > nuevoTotal + 0.01m)
            return new ResultadoEdicionVenta(false,
                $"El plan de cobro ({totalPlan:N0}) supera el total de la venta ({nuevoTotal:N0}).");

        // ── Persistencia atómica ──
        await using var tx = await db.Database.BeginTransactionAsync();

        // Stock: se ajusta por diferencia agrupando por (producto, calidad). Se conserva el historial de
        // movimientos previos; los deltas quedan asociados a la venta para poder auditarlos.
        var viejos = venta.Items
            .GroupBy(i => (i.ProductoId, i.CalidadId))
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Cantidad));
        var nuevos = nuevosItems
            .GroupBy(i => (i.ProductoId, i.CalidadId))
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Cantidad));
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var key in viejos.Keys.Union(nuevos.Keys).ToList())
        {
            var delta = nuevos.GetValueOrDefault(key) - viejos.GetValueOrDefault(key);
            if (delta == 0) continue;

            await stockSvc.AplicarMovimientoAsync(new MovimientoStock
            {
                ProductoId = key.ProductoId,
                CalidadId = key.CalidadId,
                Tipo = delta > 0 ? "salida" : "entrada",
                Cantidad = Math.Abs(delta),
                Motivo = delta > 0 ? "venta" : "devolucion",
                UsuarioId = usuarioId,
                VentaId = venta.Id,
                Fecha = hoy,
                Observaciones = delta > 0 ? "Edición de venta" : "Edición de venta (reversión)"
            });
        }

        db.ItemsVenta.RemoveRange(venta.Items);
        venta.Items = nuevosItems;
        venta.Total = nuevoTotal;

        // Cliente denormalizado en cada cobranza (incluidas las cobradas: solo cambia a quién pertenece,
        // nunca fecha/monto/estado).
        if (venta.ClienteId != req.ClienteId)
            foreach (var c in venta.Cobranzas) c.ClienteId = req.ClienteId;

        venta.ClienteId = req.ClienteId;
        venta.VendedorId = req.VendedorId;
        venta.FechaEntrega = req.FechaEntrega;
        venta.NroRemito = req.NroRemito;
        venta.NroFactura = req.NroFactura;
        venta.Observaciones = req.Observaciones;

        // Plan de cobro: reconciliar pendientes
        foreach (var p in pendientes.Values.Where(p => !idsEnviados.Contains(p.Id)).ToList())
            db.Cobranzas.Remove(p);

        foreach (var d in req.Cobranzas)
        {
            if (d.Id.HasValue)
            {
                var c = pendientes[d.Id.Value];
                c.Fecha = d.Fecha;
                c.Monto = d.Monto;
                c.FormaPago = d.FormaPago;
                c.Observaciones = d.Observaciones;
            }
            else
            {
                db.Cobranzas.Add(new Cobranza
                {
                    VentaId = venta.Id,
                    ClienteId = req.ClienteId,
                    Fecha = d.Fecha,
                    Monto = d.Monto,
                    FormaPago = d.FormaPago,
                    Estado = "pendiente",
                    Observaciones = d.Observaciones
                });
            }
        }

        await db.SaveChangesAsync();
        await RecalcularEstadoAsync(venta.Id);
        await tx.CommitAsync();

        return new ResultadoEdicionVenta(true, null);
    }
}
