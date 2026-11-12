using KimarApi.Models.DTOs;

namespace KimarApi.Services.Facturacion;

public class FiscalConfig(IConfiguration config)
{
    public string Ambiente => config["ARCA_ENVIRONMENT"] ?? "homologation";
    public string EmisorActivo => config["FACTURACION_EMISOR_ACTIVO"] ?? "dueno";
    public int RetryMinutes => Math.Clamp(config.GetValue("Facturacion:ReintentoMinutos", 15), 1, 1440);
    public string StorageRoot => Path.Combine(config["Storage:UploadsPath"] ?? "wwwroot/uploads", "fiscal");
    public static void ValidateEnvironment(string ambiente)
    {
        if (ambiente is not ("homologation" or "production"))
            throw new FiscalException("ARCA_ENVIRONMENT debe ser homologation o production.");
    }
    public EmisorFiscal Emisor(string id, string ambiente)
    {
        ValidateEnvironment(ambiente);
        if (!System.Text.RegularExpressions.Regex.IsMatch(id, "^[a-zA-Z0-9_-]{1,80}$"))
            throw new FiscalException("Identificador de emisor inválido.");
        var p = config.GetSection($"Facturacion:Emisores:{id}");
        var e = new EmisorFiscal(id, FiscalRules.NormalizeCuit(p["Cuit"] ?? ""), p["RazonSocial"] ?? "",
            p["Domicilio"] ?? "", p["IngresosBrutos"] ?? "", p["InicioActividades"] ?? "",
            p.GetValue<int>($"{ambiente}:PuntoVenta"));
        if (!FiscalRules.ValidCuit(e.Cuit) || string.IsNullOrWhiteSpace(e.RazonSocial) ||
            string.IsNullOrWhiteSpace(e.Domicilio) || string.IsNullOrWhiteSpace(e.IngresosBrutos) ||
            !DateOnly.TryParse(e.InicioActividades, out _) || e.PuntoVenta is < 1 or > 99999)
            throw new FiscalException($"Completá el perfil fiscal del emisor '{id}' para {ambiente} en el backend.");
        return e;
    }
    public (string CertPem, string KeyPem) Credentials(string id, string ambiente, string cuit, int puntoVenta)
    {
        var e = Emisor(id, ambiente);
        if (e.Cuit != cuit || e.PuntoVenta != puntoVenta)
            throw new FiscalException("El perfil cambió de CUIT o punto de venta. Restaurá el perfil original para esta solicitud.");
        var p = config.GetSection($"Facturacion:Emisores:{id}:{ambiente}");
        var certPem = p["CertificadoPem"];
        var keyPem = p["ClavePrivadaPem"];
        if (!string.IsNullOrWhiteSpace(certPem) || !string.IsNullOrWhiteSpace(keyPem))
        {
            if (string.IsNullOrWhiteSpace(certPem) || string.IsNullOrWhiteSpace(keyPem))
                throw new FiscalException($"Configurá CertificadoPem y ClavePrivadaPem juntos para '{id}' en {ambiente}.");
            return (certPem, keyPem);
        }
        var cert = p["CertificadoPath"] ?? "";
        var key = p["ClavePrivadaPath"] ?? "";
        if (!File.Exists(cert) || !File.Exists(key))
            throw new FiscalException($"Falta configurar certificado/clave privada del emisor '{id}' en {ambiente}.");
        try { return (File.ReadAllText(cert), File.ReadAllText(key)); }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            throw new FiscalException($"No se pueden leer las credenciales del emisor '{id}' en {ambiente}.");
        }
    }
}
