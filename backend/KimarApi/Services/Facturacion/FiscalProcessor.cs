using KimarApi.Data;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services.Facturacion;

public class FiscalProcessor(KimarDbContext db, IArcaClient arca, FiscalConfig config, FiscalPdf pdf, ILogger<FiscalProcessor> logger)
{
    public async Task ProcessAsync(Guid id, CancellationToken ct)
    {
        var c = await db.ComprobantesFiscales.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (c is null || c.Estado == "borrador") return;
        await using var gate = new FiscalLock(db, FiscalRules.LockKey($"{c.Ambiente}:{c.CuitEmisor}:{c.PuntoVenta}:{c.Tipo}"));
        if (!await gate.TryAcquireAsync(ct)) return;
        await db.Entry(c).ReloadAsync(ct);
        if (c.Estado == "autorizado") { await SavePdfAsync(c, ct); return; }
        if (c.ProximoIntento is null || c.ProximoIntento > DateTime.UtcNow) return;
        // No avanzar una serie si hay un número cuyo resultado todavía no conocemos.
        if (await db.ComprobantesFiscales.AnyAsync(o => o.Id != c.Id && o.Ambiente == c.Ambiente &&
            o.CuitEmisor == c.CuitEmisor && o.PuntoVenta == c.PuntoVenta && o.Tipo == c.Tipo && o.Numero != null && o.Cae == null, ct))
        {
            c.UltimoError = "La serie tiene una emisión pendiente de conciliación. Se reintentará automáticamente.";
            c.ProximoIntento = DateTime.UtcNow.AddMinutes(config.RetryMinutes);
            await db.SaveChangesAsync(ct); return;
        }
        c.Estado = "en_proceso"; c.Intentos++; c.UltimoIntento = DateTime.UtcNow;
        c.ProximoIntento = DateTime.UtcNow.AddMinutes(config.RetryMinutes);
        await db.SaveChangesAsync(ct); // durable antes de cualquier llamada; recuperable tras reinicio
        var attempt = new IntentoFiscal { ComprobanteFiscalId = c.Id, Numero = c.Numero, Resultado = "en_proceso" };
        db.IntentosFiscales.Add(attempt); await db.SaveChangesAsync(ct);
        try
        {
            config.Credentials(c.EmisorId, c.Ambiente, c.CuitEmisor, c.PuntoVenta);
            ArcaAuthorization? authorization = null;
            if (c.Numero.HasValue)
            {
                authorization = await arca.ConsultarAsync(c, ct);
                if (authorization is null && await arca.UltimoAsync(c, ct) >= c.Numero)
                    throw new FiscalException("La numeración avanzó sin poder recuperar este comprobante. Requiere conciliación.");
            }
            if (authorization is null)
            {
                try { FiscalRules.ValidateDate(c.Fecha); }
                catch (FiscalException) { c.Numero = null; throw; } // consulta previa descartó autorización
                if (c.Numero is null)
                {
                    c.Numero = await arca.UltimoAsync(c, ct) + 1;
                    attempt.Numero = c.Numero;
                    await db.SaveChangesAsync(ct); // reservar el número antes de emitir
                }
                var original = c.ComprobanteOrigenId.HasValue ? await db.ComprobantesFiscales.FindAsync([c.ComprobanteOrigenId.Value], ct) : null;
                authorization = await arca.EmitirAsync(c, original, ct);
            }
            // Autorización y efecto comercial se confirman juntos; nunca duplicar el ajuste al recuperar.
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            var moneyKey = FiscalRules.LockKey("cobranza:" + c.VentaId);
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({moneyKey})", ct);
            c.Cae = authorization.Cae; c.VencimientoCae = authorization.Vencimiento;
            c.ObservacionesArca = authorization.Observaciones; c.Estado = "autorizado";
            c.AutorizadoEn = DateTime.UtcNow; c.ProximoIntento = null; c.UltimoError = null;
            var venta = await db.Ventas.Include(v => v.Cobranzas).FirstAsync(v => v.Id == c.VentaId, ct);
            if (c.Tipo == 1) venta.NroFactura = $"{c.PuntoVenta:D5}-{c.Numero:D8}";
            if (c.Tipo == 3 && c.EfectoComercial == "anular_venta")
            {
                venta.CreditoAplicado = venta.Total;
                // No borrar pagos, no inventar reintegros, no devolver stock automáticamente.
                db.Cobranzas.RemoveRange(venta.Cobranzas.Where(x => x.Estado != "cobrado"));
                venta.Estado = "pagado";
            }
            attempt.Resultado = "autorizado"; attempt.Detalle = authorization.Observaciones;
            await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        }
        catch (ArcaRejectedException ex)
        {
            c.Estado = "rechazado"; c.Numero = null; c.ProximoIntento = null; c.UltimoError = ex.Message;
            attempt.Resultado = c.Estado; attempt.Detalle = ex.Message; await db.SaveChangesAsync(ct);
        }
        catch (FiscalException ex)
        {
            c.Estado = "requiere_atencion"; c.ProximoIntento = null; c.UltimoError = ex.Message;
            attempt.Resultado = c.Estado; attempt.Detalle = ex.Message; await db.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is ArcaTransientException or HttpRequestException or TaskCanceledException or System.Xml.XmlException)
        {
            c.Estado = c.Numero.HasValue ? "desconocido" : "pendiente";
            c.UltimoError = ex is ArcaTransientException ? ex.Message : "Error de comunicación con ARCA. Se verificará la emisión y se reintentará automáticamente.";
            attempt.Resultado = c.Estado; attempt.Detalle = c.UltimoError;
            await db.SaveChangesAsync(CancellationToken.None);
        }
        // Los errores de persistencia no se convierten en rechazos: queda en_proceso y se concilia.
        if (c.Estado == "autorizado") await SavePdfAsync(c, ct);
    }
    private async Task SavePdfAsync(ComprobanteFiscal c, CancellationToken ct)
    {
        if (c.RutaPdf is not null && File.Exists(Path.Combine(config.StorageRoot, c.RutaPdf))) return;
        try
        {
            var original = c.ComprobanteOrigenId.HasValue ? await db.ComprobantesFiscales.FindAsync([c.ComprobanteOrigenId.Value], ct) : null;
            var file = await pdf.SaveAsync(c, original, ct);
            c.RutaPdf = file.Path; c.HashPdf = file.Hash; c.ErrorPdf = null;
            c.ProximoIntento = null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Error generando PDF fiscal {Id}", c.Id);
            c.ErrorPdf = "El comprobante está autorizado. La generación del PDF se reintentará automáticamente.";
            c.ProximoIntento = DateTime.UtcNow.AddMinutes(config.RetryMinutes);
        }
        await db.SaveChangesAsync(ct);
    }
}

public class FiscalWorker(IServiceScopeFactory scopes, ILogger<FiscalWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(15));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                List<Guid> ids;
                using (var scope = scopes.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<KimarDbContext>();
                    ids = await db.ComprobantesFiscales.AsNoTracking().Where(c => c.VentaId != null &&
                        (c.ProximoIntento <= DateTime.UtcNow || c.Estado == "autorizado" && c.RutaPdf == null && c.ProximoIntento == null))
                        .OrderBy(c => c.FechaCreacion).Select(c => c.Id).Take(100).ToListAsync(stoppingToken);
                }
                foreach (var id in ids)
                {
                    using var scope = scopes.CreateScope();
                    try { await scope.ServiceProvider.GetRequiredService<FiscalProcessor>().ProcessAsync(id, stoppingToken); }
                    catch (Exception ex) when (!stoppingToken.IsCancellationRequested) { logger.LogError(ex, "No se pudo procesar solicitud fiscal {Id}", id); }
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested) { logger.LogError(ex, "Error consultando pendientes fiscales"); }
            if (!await timer.WaitForNextTickAsync(stoppingToken)) break;
        }
    }
}
