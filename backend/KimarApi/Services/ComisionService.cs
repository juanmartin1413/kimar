using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KimarApi.Data;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services;

public class ComisionException(string message, int status = 400) : Exception(message) { public int Status { get; } = status; }
public record ComisionFiltro(Guid VendedorId, DateOnly Hasta, DateOnly? Desde = null, Guid[]? ClienteIds = null, Guid[]? VentaIds = null);
public record ComisionConfirmar(ComisionFiltro Filtro, Guid OperacionId, string Huella, DateOnly Fecha, string? FormaPago, string? Referencia, string? Motivo, bool CompensarAdelantos = true);
public record ComisionAnticipo(Guid VendedorId, Guid OperacionId, decimal Monto, DateOnly Fecha, string FormaPago, string? Referencia, string Motivo);
public record ComisionCorreccion(Guid OperacionId, DateOnly Fecha, string Motivo, string? FormaPago = null, string? Referencia = null);
public record ComisionItem(string Nombre, string Unidad, decimal Cantidad, decimal Tarifa, decimal Comision);
public record ComisionCobro(Guid Id, DateOnly? Fecha, decimal Monto);
public record ComisionVenta(Guid VentaId, Guid ClienteId, string Cliente, DateOnly Fecha, string? Remito, string? Factura,
    decimal TotalVenta, decimal Cobrado, decimal Kilos, decimal Tarifa, decimal Total, decimal Habilitada,
    decimal Liquidada, decimal Pendiente, bool Incluida, List<ComisionItem> Items, List<ComisionCobro> Cobros);
public record ComisionSaldoAnticipo(Guid Id, long Numero, DateOnly Fecha, decimal Monto, decimal Pendiente);
public record ComisionPreview(Guid VendedorId, string Vendedor, decimal Tarifa, List<ComisionVenta> Ventas,
    decimal Total, decimal Habilitada, decimal Liquidada, decimal Pagado, decimal AnticiposPendientes,
    decimal AjusteAnterior, decimal Comision, decimal Compensado, decimal Neto, decimal LimiteAnticipo,
    List<ComisionSaldoAnticipo> Anticipos, string Huella);
public record ComisionSnapshot(string Vendedor, decimal Tarifa, List<ComisionVenta> Ventas, decimal SaldoAnterior,
    List<ComisionSaldoAnticipo> Aplicaciones, bool CompensarAdelantos = true);

public class ComisionService(KimarDbContext db)
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    public static decimal Money(decimal value) => decimal.Round(value, 2, MidpointRounding.AwayFromZero);
    public static DateOnly Hoy => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "America/Argentina/Buenos_Aires"));
    public static string Serialize<T>(T value) => JsonSerializer.Serialize(value, Json);
    public static string Hash<T>(T value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Serialize(value))));
    public static decimal Habilitada(decimal comision, decimal cobrado, decimal total) => total <= 0 ? 0 : Money(comision * Math.Clamp(cobrado / total, 0, 1));

    public async Task<ComisionPreview> Preview(ComisionFiltro f)
    {
        if (f.Hasta > Hoy || f.Hasta == default || f.Desde > f.Hasta) throw new ComisionException("Revisá las fechas del período.");
        var vendedor = await db.Vendedores.AsNoTracking().SingleOrDefaultAsync(v => v.Id == f.VendedorId && v.ComisionPorKg > 0)
            ?? throw new ComisionException("Vendedor sin esquema de comisión.", 404);
        var docs = await db.ComisionDocumentos.AsNoTracking().Where(d => d.VendedorId == f.VendedorId)
            .Include(d => d.Detalles).Include(d => d.Aplicaciones).OrderBy(d => d.Numero).ToListAsync();
        var previas = docs.SelectMany(d => d.Detalles).GroupBy(d => d.VentaId).ToDictionary(g => g.Key, g => g.Sum(d => d.Importe));
        var ventas = await db.Ventas.AsNoTracking().Where(v => v.VendedorId == f.VendedorId)
            .Include(v => v.Cliente).Include(v => v.Items).Include(v => v.Cobranzas).ThenInclude(c => c.Imputaciones).ThenInclude(i => i.Pago).OrderBy(v => v.FechaEntrega).ThenBy(v => v.Id).ToListAsync();
        var filas = new List<ComisionVenta>();
        decimal totalGeneradoActual = 0;
        foreach (var v in ventas)
        {
            // Una liquidación conserva su tarifa; cambios futuros de configuración no revalúan lo pagado.
            var tarifa = docs.Where(d => d.Tipo == "liquidacion" && d.Detalles.Any(x => x.VentaId == v.Id))
                .Select(d => JsonSerializer.Deserialize<ComisionSnapshot>(d.DatosJson, Json)?.Ventas.FirstOrDefault(x => x.VentaId == v.Id)?.Tarifa)
                .FirstOrDefault(t => t.HasValue) ?? vendedor.ComisionPorKg!.Value;
            var items = v.Items.OrderBy(i => i.Id).Select(i => new ComisionItem(i.Descripcion, i.Unidad, i.Cantidad, tarifa,
                i.Unidad == "kg" ? Money(i.Cantidad * tarifa) : 0)).ToList();
            var kg = v.Items.Where(i => i.Unidad == "kg").Sum(i => i.Cantidad);
            var total = v.Total > 0 && v.CreditoAplicado < v.Total ? Money(kg * tarifa) : 0;
            if (v.FechaEntrega <= Hoy) totalGeneradoActual += total;
            var cobros = v.Cobranzas.SelectMany(c => c.Imputaciones).Where(c => c.Pago.Fecha <= f.Hasta)
                .OrderBy(c => c.Id).Select(c => new ComisionCobro(c.Id, c.Pago.Fecha, c.Monto)).ToList();
            var cobrado = cobros.Sum(c => c.Monto);
            var habilitada = v.FechaEntrega <= f.Hasta ? Habilitada(total, cobrado, v.Total) : 0;
            var liquidada = previas.GetValueOrDefault(v.Id);
            // Un corte anterior no revierte cobros que simplemente quedan fuera del período.
            var actual = Habilitada(total, v.Cobranzas.SelectMany(c => c.Imputaciones).Sum(c => c.Monto), v.Total);
            var pendiente = actual < liquidada ? actual - liquidada : Math.Max(0, habilitada - liquidada);
            var incluida = pendiente < 0 || (v.FechaEntrega <= f.Hasta && (!f.Desde.HasValue || v.FechaEntrega >= f.Desde)
                && (f.ClienteIds == null || f.ClienteIds.Contains(v.ClienteId)) && (f.VentaIds == null || f.VentaIds.Contains(v.Id)));
            filas.Add(new(v.Id, v.ClienteId, v.Cliente.Nombre, v.FechaEntrega, v.NroRemito, v.NroFactura,
                v.Total, cobrado, kg, tarifa, total, habilitada, liquidada, pendiente, incluida, items, cobros));
        }
        var aplicaciones = docs.SelectMany(d => d.Aplicaciones).GroupBy(a => a.AnticipoId).ToDictionary(g => g.Key, g => g.Sum(a => a.Importe));
        var anticipos = docs.Where(d => d.Tipo == "anticipo").Select(d => new ComisionSaldoAnticipo(d.Id, d.Numero, d.Fecha, d.Pago,
            d.Pago - aplicaciones.GetValueOrDefault(d.Id))).Where(a => a.Pendiente > 0).ToList();
        var liquidado = docs.Sum(d => d.Comision);
        var pagado = docs.Sum(d => d.Pago);
        var comision = filas.Where(v => v.Incluida).Sum(v => v.Pendiente);
        var credito = Math.Max(0, pagado - liquidado);
        var neto = Math.Max(0, Money(comision - credito));
        var compensado = Math.Min(Math.Max(0, comision), credito);
        var p = new ComisionPreview(vendedor.Id, vendedor.Nombre, vendedor.ComisionPorKg!.Value, filas,
            filas.Where(v => v.Incluida).Sum(v => v.Total), filas.Where(v => v.Incluida).Sum(v => v.Habilitada), liquidado, pagado,
            anticipos.Sum(a => a.Pendiente), Math.Max(0, credito - anticipos.Sum(a => a.Pendiente)), comision, compensado, neto,
            Math.Max(0, totalGeneradoActual - pagado), anticipos, "");
        return p with { Huella = Hash(p) };
    }

    private static void ValidarPago(DateOnly fecha, decimal monto, string? forma, string? referencia, string? motivo)
    {
        if (fecha == default || fecha > Hoy) throw new ComisionException("La fecha de pago no puede ser futura.");
        if (monto != Money(monto)) throw new ComisionException("El importe admite hasta dos decimales.");
        if (monto != 0 && forma is not ("efectivo" or "transferencia" or "cheque")) throw new ComisionException("Seleccioná la forma de pago.");
        if (referencia?.Length > 200 || motivo?.Length > 500) throw new ComisionException("Referencia o motivo demasiado largo.");
    }

    // Además del bloqueo por vendedor, estas tablas se estabilizan durante el recálculo:
    // una cobranza o edición comercial concurrente no puede cambiar el importe confirmado.
    private async Task Bloquear(Guid vendedorId)
    {
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({vendedorId.ToString()}, 0))");
        await db.Database.ExecuteSqlRawAsync("LOCK TABLE \"Ventas\", \"ItemsVenta\", \"Cobranzas\", \"Vendedores\" IN SHARE ROW EXCLUSIVE MODE");
    }

    private async Task<ComisionDocumento?> Repetida(Guid operacion, string huella)
    {
        if (operacion == Guid.Empty) throw new ComisionException("Falta el identificador de operación.");
        var d = await db.ComisionDocumentos.AsNoTracking().SingleOrDefaultAsync(d => d.OperacionId == operacion);
        if (d != null && d.Huella != huella) throw new ComisionException("La operación ya fue utilizada con otros datos.", 409);
        return d;
    }

    public async Task<ComisionDocumento> Confirmar(ComisionConfirmar req, Guid usuario)
    {
        // Mantener compatibles los reintentos de solicitudes anteriores a la opción.
        var hash = req.CompensarAdelantos
            ? Hash(new { req.Filtro, req.OperacionId, req.Huella, req.Fecha, req.FormaPago, req.Referencia, req.Motivo }) : Hash(req);
        await using var tx = await db.Database.BeginTransactionAsync();
        await Bloquear(req.Filtro.VendedorId);
        var repetida = await Repetida(req.OperacionId, hash);
        if (repetida != null) return repetida;
        var p = await Preview(req.Filtro);
        if (p.Huella != req.Huella) throw new ComisionException("Los importes cambiaron. Actualizá y revisá la preliquidación.", 409);
        var filas = p.Ventas.Where(v => v.Incluida && v.Pendiente != 0).ToList();
        if (filas.Count == 0) throw new ComisionException("No hay comisiones pendientes para liquidar.");
        var compensado = req.CompensarAdelantos ? p.Compensado : Math.Min(Math.Max(0, p.Comision), p.AjusteAnterior);
        var neto = Math.Max(0, Money(p.Comision - compensado));
        ValidarPago(req.Fecha, neto, req.FormaPago, req.Referencia, req.Motivo);
        if (req.Fecha < req.Filtro.Hasta) throw new ComisionException("La fecha de pago debe ser igual o posterior al corte.");
        var doc = new ComisionDocumento { VendedorId = p.VendedorId, UsuarioId = usuario, OperacionId = req.OperacionId, Huella = hash,
            Fecha = req.Fecha, Comision = p.Comision, Pago = neto, Compensado = compensado,
            FormaPago = neto > 0 ? req.FormaPago : null, Referencia = req.Referencia, Motivo = req.Motivo };
        doc.Detalles = filas.Select(v => new ComisionDetalle { VentaId = v.VentaId, Importe = v.Pendiente }).ToList();
        decimal restante = req.CompensarAdelantos ? Math.Min(compensado, p.AnticiposPendientes) : 0;
        var aplicados = new List<ComisionSaldoAnticipo>();
        foreach (var a in p.Anticipos)
        {
            var monto = Math.Min(restante, a.Pendiente);
            if (monto <= 0) break;
            doc.Aplicaciones.Add(new() { AnticipoId = a.Id, Importe = monto });
            aplicados.Add(a with { Monto = monto, Pendiente = a.Pendiente - monto });
            restante -= monto;
        }
        doc.DatosJson = Serialize(new ComisionSnapshot(p.Vendedor, p.Tarifa, filas, p.Pagado - p.Liquidada, aplicados, req.CompensarAdelantos));
        db.Add(doc); await db.SaveChangesAsync(); await tx.CommitAsync(); return doc;
    }

    public async Task<ComisionDocumento> Anticipar(ComisionAnticipo req, Guid usuario)
    {
        ValidarPago(req.Fecha, req.Monto, req.FormaPago, req.Referencia, req.Motivo);
        if (req.Monto <= 0 || string.IsNullOrWhiteSpace(req.Motivo)) throw new ComisionException("Ingresá un importe positivo y el motivo del anticipo.");
        var hash = Hash(req);
        await using var tx = await db.Database.BeginTransactionAsync();
        await Bloquear(req.VendedorId);
        var repetida = await Repetida(req.OperacionId, hash);
        if (repetida != null) return repetida;
        var p = await Preview(new(req.VendedorId, Hoy));
        if (req.Monto > p.LimiteAnticipo) throw new ComisionException("El anticipo supera la comisión generada disponible.", 409);
        var doc = new ComisionDocumento { Tipo = "anticipo", VendedorId = req.VendedorId, UsuarioId = usuario,
            OperacionId = req.OperacionId, Huella = hash, Fecha = req.Fecha, Pago = req.Monto, FormaPago = req.FormaPago,
            Referencia = req.Referencia, Motivo = req.Motivo,
            DatosJson = Serialize(new ComisionSnapshot(p.Vendedor, p.Tarifa, [], p.Pagado - p.Liquidada, [])) };
        db.Add(doc); await db.SaveChangesAsync(); await tx.CommitAsync(); return doc;
    }

    public async Task<ComisionDocumento> Corregir(Guid id, ComisionCorreccion req, Guid usuario)
    {
        if (string.IsNullOrWhiteSpace(req.Motivo)) throw new ComisionException("Indicá el motivo de la corrección.");
        var origen = await db.ComisionDocumentos.AsNoTracking().SingleOrDefaultAsync(d => d.Id == id)
            ?? throw new ComisionException("Documento no encontrado.", 404);
        var hash = Hash(new { id, req });
        await using var tx = await db.Database.BeginTransactionAsync();
        await Bloquear(origen.VendedorId);
        var repetida = await Repetida(req.OperacionId, hash);
        if (repetida != null) return repetida;
        if (origen.Tipo != "liquidacion" && origen.Tipo != "anticipo") throw new ComisionException("Este movimiento no admite contrapartida.");
        if (await db.ComisionDocumentos.AnyAsync(d => d.OrigenId == id)) throw new ComisionException("El documento ya tiene contrapartida.", 409);
        if (await db.ComisionDocumentos.AnyAsync(d => d.VendedorId == origen.VendedorId && d.Numero > origen.Numero))
            throw new ComisionException("Solo se puede corregir el último movimiento del vendedor para preservar las compensaciones posteriores.");
        var p = await Preview(new(origen.VendedorId, Hoy));
        var saldo = p.Anticipos.FirstOrDefault(a => a.Id == id)?.Pendiente ?? 0;
        if (origen.Tipo == "anticipo" && saldo == 0) throw new ComisionException("El anticipo ya fue compensado.");
        ValidarPago(req.Fecha, origen.Tipo == "anticipo" ? saldo : 0, req.FormaPago, req.Referencia, req.Motivo);
        if (req.Fecha < origen.Fecha) throw new ComisionException("La corrección no puede ser anterior al documento.");
        var snapshot = JsonSerializer.Deserialize<ComisionSnapshot>(origen.DatosJson, Json)!;
        var doc = new ComisionDocumento { Tipo = origen.Tipo == "anticipo" ? "devolucion" : "contrapartida",
            VendedorId = origen.VendedorId, UsuarioId = usuario, OperacionId = req.OperacionId, Huella = hash, OrigenId = id,
            Fecha = req.Fecha, Motivo = req.Motivo, Referencia = req.Referencia,
            Pago = origen.Tipo == "anticipo" ? -saldo : 0, FormaPago = origen.Tipo == "anticipo" ? req.FormaPago : null,
            Comision = origen.Tipo == "liquidacion" ? -origen.Comision : 0 };
        if (origen.Tipo == "liquidacion")
        {
            doc.Detalles = (await db.ComisionDetalles.Where(d => d.DocumentoId == id).ToListAsync())
                .Select(d => new ComisionDetalle { VentaId = d.VentaId, Importe = -d.Importe }).ToList();
            doc.Aplicaciones = (await db.ComisionAplicaciones.Where(a => a.DocumentoId == id).ToListAsync())
                .Select(a => new ComisionAplicacion { AnticipoId = a.AnticipoId, Importe = -a.Importe }).ToList();
            doc.DatosJson = Serialize(snapshot with { Ventas = snapshot.Ventas.Select(v => v with { Pendiente = -v.Pendiente }).ToList(),
                Aplicaciones = snapshot.Aplicaciones.Select(a => a with { Monto = -a.Monto }).ToList() });
        }
        else
        {
            doc.Aplicaciones.Add(new() { AnticipoId = id, Importe = saldo });
            doc.DatosJson = Serialize(new ComisionSnapshot(snapshot.Vendedor, snapshot.Tarifa, [], p.Pagado - p.Liquidada, []));
        }
        db.Add(doc); await db.SaveChangesAsync(); await tx.CommitAsync(); return doc;
    }
}
