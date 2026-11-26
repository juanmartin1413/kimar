using KimarApi.Data;
using KimarApi.Services.Facturacion;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace KimarApi.Services;

public record ResultadoEdicionVenta(bool Ok, string? Error, bool NotFound = false);

public class VentaService(KimarDbContext db, StockService stockSvc)
{
    public async Task RecalcularEstadoAsync(Guid ventaId)
    {
        var venta = await db.Ventas
            .Include(v => v.Cobranzas).ThenInclude(c => c.Imputaciones).ThenInclude(i => i.Pago)
            .FirstOrDefaultAsync(v => v.Id == ventaId);

        if (venta is null) return;

        var cobrado = venta.Cobranzas.SelectMany(c => c.Imputaciones).Sum(i => i.Monto);

        venta.Estado = cobrado >= venta.Total - venta.CreditoAplicado ? "pagado"
            : cobrado > 0 ? "cobrado_parcial"
            : "debe";

        await db.SaveChangesAsync();
    }

    public string CalcularEstado(decimal total, IEnumerable<Cobranza> cobranzas)
    {
        var cobrado = cobranzas.SelectMany(c => c.Imputaciones).Sum(i => i.Monto);
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
    // Reemplaza ítems (sincronizando stock por diferencia), datos de cabecera y el compromiso automático.
    // Los pagos e imputaciones son inmutables; se actualizan importe y vencimiento del compromiso.
    public async Task<ResultadoEdicionVenta> ActualizarVentaCompletaAsync(
        Guid ventaId, UpdateVentaCompletaRequest req, Guid usuarioId, bool esAdmin = true)
    {
        await using var gate = new FiscalLock(db, FiscalRules.LockKey("editar-venta:" + ventaId));
        if (!await gate.TryAcquireAsync(default)) return new(false, "Otra operación está procesando la venta.");
        await using var tx = await db.Database.BeginTransactionAsync();
        await db.Database.ExecuteSqlRawAsync("LOCK TABLE \"Ventas\", \"ItemsVenta\", \"Cobranzas\", \"Vendedores\" IN SHARE ROW EXCLUSIVE MODE");
        var venta = await db.Ventas
            .Include(v => v.Items)
            .Include(v => v.Cobranzas).ThenInclude(c => c.Imputaciones).ThenInclude(i => i.Pago)
            .FirstOrDefaultAsync(v => v.Id == ventaId);
        if (venta is null) return new ResultadoEdicionVenta(false, null, NotFound: true);
        if (!CobranzaRules.HorarioValido(req.FechaEntrega, req.HoraEntregaDesde, req.HoraEntregaHasta)) return new(false, "Revisá el horario de entrega.");
        if (req.Cobranzas?.Count > 0) return new(false, "El compromiso se calcula automáticamente.");
        if (venta.VendedorId != req.VendedorId && await db.ComisionDetalles.AnyAsync(d => d.VentaId == ventaId))
            return new ResultadoEdicionVenta(false, "La venta tiene movimientos de comisión. No se puede cambiar el vendedor.");
        if (!esAdmin && !venta.EmitirFactura) return new(false, "Solo un administrador puede editar estos productos.");
        if (venta.EmitirFactura)
        {
            if (!await FacturacionService.PuedeEditarProductosAsync(db, ventaId))
                return new(false, "Para editar productos se necesita una NC total autorizada por corrección fiscal, sin reemplazo solicitado.");
            if (req.ClienteId != venta.ClienteId || req.VendedorId != venta.VendedorId || req.FechaEntrega != venta.FechaEntrega ||
                req.HoraEntregaDesde != venta.HoraEntregaDesde || req.HoraEntregaHasta != venta.HoraEntregaHasta || req.NroFactura != venta.NroFactura)
                return new(false, "La corrección fiscal permite editar productos; conservá cliente, vendedor, entrega y número fiscal.");
            FiscalRules.ValidateItems(req.Items);
        }

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
                Unidad = venta.Items.FirstOrDefault(x => x.ProductoId == i.ProductoId)?.Unidad
                    ?? await db.Productos.Where(p => p.Id == i.ProductoId).Select(p => p.Unidad).SingleAsync(),
                CalidadId = resolucion.CalidadId,
                Descripcion = i.Descripcion,
                Cantidad = i.Cantidad,
                PrecioUnitario = i.PrecioUnitario,
                Subtotal = venta.EmitirFactura ? FiscalRules.Money(i.Cantidad * i.PrecioUnitario) : i.Cantidad * i.PrecioUnitario
            });
        }
        var neto = nuevosItems.Sum(i => i.Subtotal);
        var iva = venta.EmitirFactura ? FiscalRules.Money(neto * .21m) : 0;
        var nuevoTotal = neto + iva;

        // ── Validaciones de importes e imputaciones ──
        var totalCobrado = venta.Cobranzas.SelectMany(c => c.Imputaciones).Sum(i => i.Monto);
        if (nuevoTotal < totalCobrado) return new(false, "El total no puede ser menor a lo ya cobrado.");
        if (venta.ClienteId != req.ClienteId && totalCobrado > 0) return new(false, "No se puede cambiar el cliente de una venta con pagos.");
        if (!await db.Clientes.AnyAsync(c => c.Id == req.ClienteId && c.Activo) || !await db.Vendedores.AnyAsync(v => v.Id == req.VendedorId && v.Activo)) return new(false, "Cliente o vendedor inválido.");

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

        // Los ítems nuevos se agregan vía DbSet (estado Added) y NO reasignando venta.Items: como ItemVenta.Id
        // ya viene con Guid.NewGuid(), al descubrirlos por la navegación EF los trataría como Modified y emitiría
        // un UPDATE sobre filas inexistentes (DbUpdateConcurrencyException: 0 rows). Mismo caso que CompraService.
        db.ItemsVenta.RemoveRange(venta.Items);
        db.ItemsVenta.AddRange(nuevosItems);
        venta.Total = nuevoTotal;
        venta.Iva = iva;

        // Solo puede cambiar el cliente cuando el compromiso no tiene pagos.
        if (venta.ClienteId != req.ClienteId)
            foreach (var c in venta.Cobranzas) c.ClienteId = req.ClienteId;

        venta.ClienteId = req.ClienteId;
        venta.VendedorId = req.VendedorId;
        venta.FechaEntrega = req.FechaEntrega;
        venta.NroRemito = req.NroRemito;
        venta.NroFactura = req.NroFactura;
        venta.Observaciones = req.Observaciones;

        venta.HoraEntregaDesde = req.HoraEntregaDesde;
        venta.HoraEntregaHasta = req.HoraEntregaHasta;
        var compromiso = venta.Cobranzas.Single();
        compromiso.Monto = nuevoTotal;
        compromiso.Fecha = req.FechaEntrega.AddDays(venta.DiasPlazoPago);

        await db.SaveChangesAsync();
        await RecalcularEstadoAsync(venta.Id);
        await tx.CommitAsync();

        return new ResultadoEdicionVenta(true, null);
    }
}
