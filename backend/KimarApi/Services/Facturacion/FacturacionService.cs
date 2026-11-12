using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services.Facturacion;

public class FacturacionService(KimarDbContext db, FiscalConfig config)
{
    public static ComprobanteFiscalDto Map(ComprobanteFiscal c) => new(c.Id, c.VentaId, c.EmisorId, c.Ambiente,
        c.Tipo, c.PuntoVenta, c.Numero, c.Cae is null ? null : $"{c.PuntoVenta:D5}-{c.Numero:D8}", c.Fecha, c.Neto, c.Iva,
        c.Total, c.Estado, c.Cae, c.VencimientoCae, FiscalRules.Deserialize<DatosFiscales>(c.DatosJson),
        c.ComprobanteOrigenId, c.ReemplazaId, c.Motivo, c.EfectoComercial, c.UltimoError, c.ObservacionesArca,
        c.Intentos, c.ProximoIntento, c.UltimoIntento, c.FechaCreacion, c.RutaPdf is not null, c.ErrorPdf);

    public async Task<ComprobanteFiscal> PreviewAsync(PreviewFacturaRequest req, Guid user)
    {
        FiscalRules.ValidateItems(req.Items);
        FiscalRules.ValidateReceptor(req.Receptor);
        if (!await db.Clientes.AnyAsync(x => x.Id == req.ClienteId && x.Activo)) throw new FiscalException("Cliente inválido.");
        ValidateDescriptions(req.Descripciones, req.Items.Count, req.Observaciones);
        var emisor = config.Emisor(config.EmisorActivo, config.Ambiente);
        var productIds = req.Items.Select(i => i.ProductoId).Distinct().ToList();
        var products = await db.Productos.Where(p => productIds.Contains(p.Id) && p.Activo).ToDictionaryAsync(p => p.Id);
        if (products.Count != productIds.Count) throw new FiscalException("Hay productos inexistentes o inactivos.");
        var items = req.Items.Select((i, index) => {
            var neto = FiscalRules.Money(i.Cantidad * i.PrecioUnitario);
            return new ItemFiscal(req.Descripciones[index].Trim(), i.Cantidad, products[i.ProductoId].Unidad, i.PrecioUnitario, neto, FiscalRules.Money(neto * .21m));
        }).ToList();
        var c = new ComprobanteFiscal {
            UsuarioId = user, ClienteId = req.ClienteId, EmisorId = emisor.Id, CuitEmisor = emisor.Cuit,
            Ambiente = config.Ambiente, PuntoVenta = emisor.PuntoVenta, Fecha = FiscalRules.Hoy,
            Neto = items.Sum(i => i.Neto), Iva = FiscalRules.Money(items.Sum(i => i.Neto) * .21m),
            DatosJson = FiscalRules.Serialize(new DatosFiscales(emisor, req.Receptor with { Cuit = FiscalRules.NormalizeCuit(req.Receptor.Cuit) }, items, req.Observaciones)),
            HuellaVenta = FiscalRules.Fingerprint(req.ClienteId, req.Items)
        };
        c.Total = c.Neto + c.Iva;
        db.ComprobantesFiscales.Add(c);
        await db.SaveChangesAsync();
        return c;
    }
    public async Task<ComprobanteFiscal> ConfirmarBorradorAsync(CreateVentaRequest req, Guid user)
    {
        var c = await db.ComprobantesFiscales.FindAsync(req.BorradorFiscalId);
        if (c is null || c.UsuarioId != user || c.Estado != "borrador" || c.VentaId is not null ||
            c.Fecha != FiscalRules.Hoy || c.FechaCreacion < DateTime.UtcNow.AddHours(-24) ||
            c.HuellaVenta != FiscalRules.Fingerprint(req.ClienteId, req.Items))
            throw new FiscalException("La vista previa falta, venció o cambió la venta. Revisá nuevamente la factura.");
        if (c.EmisorId != config.EmisorActivo || c.Ambiente != config.Ambiente ||
            FiscalRules.Deserialize<DatosFiscales>(c.DatosJson).Emisor != config.Emisor(config.EmisorActivo, config.Ambiente))
            throw new FiscalException("Cambió el emisor o ambiente. Revisá nuevamente la factura.");
        c.Estado = "pendiente";
        c.ProximoIntento = DateTime.UtcNow;
        return c;
    }
    public async Task<ComprobanteFiscal> CrearNcAsync(Guid id, NotaCreditoRequest req, Guid user, CancellationToken ct)
    {
        await using var gate = new FiscalLock(db, FiscalRules.LockKey("nc:" + id));
        if (!await gate.TryAcquireAsync(ct)) throw new FiscalException("Otra operación está procesando esta factura. Volvé a consultar.");
        var original = await db.ComprobantesFiscales.Include(c => c.Venta).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (original is null || original.Tipo != 1 || original.Estado != "autorizado" || original.VentaId is null)
            throw new FiscalException("Elegí una factura autorizada emitida desde este módulo.");
        var existing = await db.ComprobantesFiscales.FirstOrDefaultAsync(c => c.ComprobanteOrigenId == id, ct);
        if (existing is not null) return existing; // una sola NC total, incluidos los reenvíos concurrentes
        if (string.IsNullOrWhiteSpace(req.Motivo) || req.Motivo.Length > 500 || req.EfectoComercial is not ("anular_venta" or "correccion_fiscal"))
            throw new FiscalException("Indicá motivo y si se anula la venta o solamente se corrige la factura.");
        var c = new ComprobanteFiscal {
            VentaId = original.VentaId, ClienteId = original.ClienteId, UsuarioId = user, EmisorId = original.EmisorId,
            Ambiente = original.Ambiente, CuitEmisor = original.CuitEmisor, PuntoVenta = original.PuntoVenta, Tipo = 3,
            Fecha = FiscalRules.Hoy, Neto = original.Neto, Iva = original.Iva, Total = original.Total, DatosJson = original.DatosJson,
            ComprobanteOrigenId = original.Id, EfectoComercial = req.EfectoComercial, Motivo = req.Motivo.Trim(),
            Estado = "pendiente", ProximoIntento = DateTime.UtcNow
        };
        db.ComprobantesFiscales.Add(c);
        await db.SaveChangesAsync(ct);
        return c;
    }
    public static void ValidateDescriptions(IList<string> descriptions, int count, string? notes)
    {
        if (descriptions.Count != count || descriptions.Any(s => string.IsNullOrWhiteSpace(s) || s.Length > 300) || notes?.Length > 500)
            throw new FiscalException("Ingresá una descripción de hasta 300 caracteres por ítem y observaciones de hasta 500.");
    }
    public async Task<ComprobanteFiscal> CorregirAsync(Guid id, CorregirFiscalRequest req, Guid user, bool reemplazo, CancellationToken ct)
    {
        var c = await db.ComprobantesFiscales.FindAsync([id], ct) ?? throw new FiscalException("Comprobante inexistente.");
        await using var gate = new FiscalLock(db, FiscalRules.LockKey($"{c.Ambiente}:{c.CuitEmisor}:{c.PuntoVenta}:{c.Tipo}"));
        if (!await gate.TryAcquireAsync(ct)) throw new FiscalException("Emisión en curso. Volvé a consultar.");
        await db.Entry(c).ReloadAsync(ct);
        var data = FiscalRules.Deserialize<DatosFiscales>(c.DatosJson);
        FiscalRules.ValidateReceptor(req.Receptor);
        FiscalRules.ValidateDate(req.Fecha);
        ValidateDescriptions(req.Descripciones, data.Items.Count, req.Observaciones);
        if (reemplazo)
        {
            if (c.Tipo != 1 || c.Estado != "autorizado" || !await db.ComprobantesFiscales.AnyAsync(n =>
                n.ComprobanteOrigenId == id && n.Estado == "autorizado" && n.EfectoComercial == "correccion_fiscal", ct))
                throw new FiscalException("Primero debe autorizarse una NC total por corrección fiscal.");
            var existing = await db.ComprobantesFiscales.FirstOrDefaultAsync(n => n.ReemplazaId == id, ct);
            if (existing is not null) return existing;
            c = new ComprobanteFiscal { VentaId = c.VentaId, ClienteId = c.ClienteId, UsuarioId = user,
                EmisorId = c.EmisorId, Ambiente = c.Ambiente, CuitEmisor = c.CuitEmisor, PuntoVenta = c.PuntoVenta,
                Tipo = 1, Neto = c.Neto, Iva = c.Iva, Total = c.Total, ReemplazaId = id, Estado = "pendiente" };
            db.ComprobantesFiscales.Add(c);
        }
        else if (c.Numero is not null || c.Estado is not ("rechazado" or "requiere_atencion"))
            throw new FiscalException("Solo se corrigen solicitudes sin número y sin autorización. Una emisión incierta debe conciliarse primero.");
        if (c.Tipo == 3 && req.Receptor != data.Receptor)
            throw new FiscalException("La NC conserva el receptor de su factura original.");
        c.DatosJson = FiscalRules.Serialize(data with { Receptor = req.Receptor with { Cuit = FiscalRules.NormalizeCuit(req.Receptor.Cuit) },
            Items = data.Items.Select((i, n) => i with { Descripcion = req.Descripciones[n].Trim() }).ToList(), Observaciones = req.Observaciones });
        c.Fecha = req.Fecha; c.Estado = "pendiente"; c.ProximoIntento = DateTime.UtcNow; c.UltimoError = null;
        db.IntentosFiscales.Add(new IntentoFiscal { ComprobanteFiscalId = c.Id, Resultado = "correccion", Detalle = $"Datos confirmados por {user}" });
        await db.SaveChangesAsync(ct);
        return c;
    }
}
