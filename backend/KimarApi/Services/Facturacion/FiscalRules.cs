using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KimarApi.Models.DTOs;

namespace KimarApi.Services.Facturacion;

public class FiscalException(string message) : Exception(message);
public class ArcaTransientException(string message) : Exception(message);
public class ArcaRejectedException(string message) : Exception(message);

public static class FiscalRules
{
    public static decimal Money(decimal value) => decimal.Round(value, 2, MidpointRounding.AwayFromZero);
    public static DateOnly Hoy => DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-3));
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    public static string Serialize<T>(T value) => JsonSerializer.Serialize(value, Json);
    public static T Deserialize<T>(string value) => JsonSerializer.Deserialize<T>(value, Json)!;
    public static string NormalizeCuit(string value) => value.Replace("-", "").Replace(" ", "").Trim();
    public static bool ValidCuit(string value)
    {
        var s = NormalizeCuit(value);
        if (s.Length != 11 || s.Any(c => c < '0' || c > '9') || s.Distinct().Count() == 1) return false;
        int[] weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        var check = 11 - weights.Select((w, i) => w * (s[i] - '0')).Sum() % 11;
        check = check == 11 ? 0 : check == 10 ? 9 : check;
        return check == s[10] - '0';
    }
    public static void ValidateReceptor(ReceptorFiscal r)
    {
        if (string.IsNullOrWhiteSpace(r.RazonSocial) || r.RazonSocial.Length > 200 ||
            string.IsNullOrWhiteSpace(r.Domicilio) || r.Domicilio.Length > 300 || !ValidCuit(r.Cuit))
            throw new FiscalException("Completá razón social, domicilio fiscal y un CUIT válido.");
        // Alcance A: RI y monotributistas (catálogo WSFE). No convertir silenciosamente a B.
        if (r.CondicionIva is not (1 or 6 or 13 or 16))
            throw new FiscalException("La condición IVA del receptor no corresponde al alcance de facturas A.");
    }
    public static void ValidateItems(IList<ItemVentaRequest> items)
    {
        if (items.Count is < 1 or > 200 || items.Any(i => i.Cantidad <= 0 || i.PrecioUnitario <= 0 ||
                i.Cantidad != Money(i.Cantidad) || i.PrecioUnitario != Money(i.PrecioUnitario) ||
                i.Cantidad > 1000000 || i.PrecioUnitario > 100000000 || string.IsNullOrWhiteSpace(i.Descripcion)))
            throw new FiscalException("Ingresá de 1 a 200 ítems con cantidad y precio positivos (hasta dos decimales).");
    }
    public static string Fingerprint(Guid clienteId, IList<ItemVentaRequest> items) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Serialize(new { clienteId, items }))));
    public static long LockKey(string value) => BitConverter.ToInt64(SHA256.HashData(Encoding.UTF8.GetBytes(value)), 0);
    public static string Number(decimal n) => n.ToString("0.00", CultureInfo.InvariantCulture);
    public static void ValidateDate(DateOnly fecha)
    {
        // Venta de bienes: no renovar automáticamente una fecha confirmada que perdió vigencia.
        if (Math.Abs(fecha.DayNumber - Hoy.DayNumber) > 5 || fecha.Month != Hoy.Month || fecha.Year != Hoy.Year)
            throw new FiscalException("La fecha del comprobante requiere revisión. Corregí y confirmá la fecha antes de reintentar.");
    }
}
