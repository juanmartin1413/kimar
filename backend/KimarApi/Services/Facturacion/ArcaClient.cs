using System.Collections.Concurrent;
using System.Globalization;
using System.Security.Cryptography;
using System.Security.Cryptography.Pkcs;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;

namespace KimarApi.Services.Facturacion;

public record ArcaAuthorization(string Cae, DateOnly Vencimiento, string? Observaciones);
public interface IArcaClient
{
    Task<long> UltimoAsync(ComprobanteFiscal c, CancellationToken ct);
    Task<ArcaAuthorization?> ConsultarAsync(ComprobanteFiscal c, CancellationToken ct);
    Task<ArcaAuthorization> EmitirAsync(ComprobanteFiscal c, ComprobanteFiscal? origen, CancellationToken ct);
}

public class ArcaClient(HttpClient http, FiscalConfig config) : IArcaClient
{
    private static readonly XNamespace Ns = "http://ar.gov.afip.dif.FEV1/";
    private static readonly XNamespace Soap = "http://schemas.xmlsoap.org/soap/envelope/";
    private record Ticket(string Token, string Sign, DateTime Expiration);
    private static readonly ConcurrentDictionary<string, Ticket> Tickets = new();
    private static readonly SemaphoreSlim AuthLock = new(1, 1);
    private static XElement E(string name, object? value) => new(Ns + name, value);
    private static string? Value(XContainer e, string name) => e.Descendants().FirstOrDefault(x => x.Name.LocalName == name)?.Value;
    private static string Messages(XContainer e) => string.Join("; ", e.Descendants()
        .Where(x => x.Name.LocalName is "Err" or "Obs")
        .Select(x => $"{Value(x, "Code")}: {Value(x, "Msg")}"));
    private static XDocument Parse(string xml)
    {
        using var reader = XmlReader.Create(new StringReader(xml), new XmlReaderSettings
            { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null, MaxCharactersInDocument = 2_000_000 });
        return XDocument.Load(reader);
    }
    private async Task<XDocument> SendAsync(string url, string action, XElement body, CancellationToken ct)
    {
        var envelope = new XDocument(new XElement(Soap + "Envelope", new XAttribute(XNamespace.Xmlns + "soap", Soap),
            new XElement(Soap + "Body", body)));
        using var req = new HttpRequestMessage(HttpMethod.Post, url);
        req.Headers.Add("SOAPAction", $"\"{action}\"");
        req.Content = new StringContent(envelope.ToString(), Encoding.UTF8, "text/xml");
        using var res = await http.SendAsync(req, ct);
        if ((int)res.StatusCode >= 500 || (int)res.StatusCode is 408 or 429)
            throw new ArcaTransientException($"ARCA no disponible (HTTP {(int)res.StatusCode}).");
        if (!res.IsSuccessStatusCode) throw new FiscalException($"ARCA rechazó el acceso (HTTP {(int)res.StatusCode}).");
        var doc = Parse(await res.Content.ReadAsStringAsync(ct));
        if (Value(doc, "faultstring") is { } fault)
        {
            // No guardar envelopes: contienen Token y Sign.
            if (fault.Contains("cert", StringComparison.OrdinalIgnoreCase) || fault.Contains("authorized", StringComparison.OrdinalIgnoreCase))
                throw new FiscalException("ARCA rechazó las credenciales. Revisá certificado y autorización del servicio wsfe.");
            throw new ArcaTransientException("ARCA devolvió un fallo SOAP. Se verificará la emisión antes de reintentar.");
        }
        return doc;
    }
    private async Task<XElement> AuthAsync(ComprobanteFiscal c, CancellationToken ct)
    {
        var (certPem, keyPem) = config.Credentials(c.EmisorId, c.Ambiente, c.CuitEmisor, c.PuntoVenta);
        var fingerprint = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(certPem + "\n" + keyPem)));
        var cacheKey = $"{c.Ambiente}:{c.CuitEmisor}:{fingerprint}";
        await AuthLock.WaitAsync(ct);
        try
        {
            if (!Tickets.TryGetValue(cacheKey, out var ticket) || ticket.Expiration <= DateTime.UtcNow.AddMinutes(5))
            {
                using var cert = LoadCertificate(certPem, keyPem);
                if (cert.NotAfter.ToUniversalTime() <= DateTime.UtcNow || cert.NotBefore.ToUniversalTime() > DateTime.UtcNow)
                    throw new FiscalException("El certificado de ARCA está vencido o todavía no está vigente.");
                var tra = new XElement("loginTicketRequest", new XAttribute("version", "1.0"),
                    new XElement("header", new XElement("uniqueId", DateTimeOffset.UtcNow.ToUnixTimeSeconds()),
                        new XElement("generationTime", DateTime.UtcNow.AddMinutes(-10).ToString("O")),
                        new XElement("expirationTime", DateTime.UtcNow.AddHours(10).ToString("O"))), new XElement("service", "wsfe"));
                var cms = new SignedCms(new ContentInfo(Encoding.UTF8.GetBytes(tra.ToString())), false);
                cms.ComputeSignature(new CmsSigner(SubjectIdentifierType.IssuerAndSerialNumber, cert) { IncludeOption = X509IncludeOption.EndCertOnly });
                var url = c.Ambiente == "production" ? "https://wsaa.afip.gov.ar/ws/services/LoginCms" : "https://wsaahomo.afip.gov.ar/ws/services/LoginCms";
                XNamespace loginNs = "http://wsaa.view.sua.dvadac.desein.afip.gov";
                var result = await SendAsync(url, "", new XElement(loginNs + "loginCms", new XElement("in0", Convert.ToBase64String(cms.Encode()))), ct);
                var xml = Value(result, "loginCmsReturn") ?? throw new ArcaTransientException("WSAA no devolvió un ticket.");
                var parsed = Parse(xml);
                ticket = new Ticket(Value(parsed, "token") ?? throw new ArcaTransientException("Ticket incompleto."),
                    Value(parsed, "sign") ?? throw new ArcaTransientException("Ticket incompleto."),
                    DateTime.Parse(Value(parsed, "expirationTime")!, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal));
                Tickets[cacheKey] = ticket;
            }
            return E("Auth", new[] { E("Token", ticket.Token), E("Sign", ticket.Sign), E("Cuit", c.CuitEmisor) });
        }
        finally { AuthLock.Release(); }
    }
    private static X509Certificate2 LoadCertificate(string certPem, string keyPem)
    {
        try { return X509Certificate2.CreateFromPem(certPem, keyPem); }
        catch (Exception ex) when (ex is CryptographicException or ArgumentException)
        {
            throw new FiscalException("Certificado o clave privada PEM inválidos o incompatibles. Revisá las credenciales de ARCA.");
        }
    }
    private async Task<XDocument> CallAsync(ComprobanteFiscal c, string method, IEnumerable<XElement> args, CancellationToken ct)
    {
        var url = c.Ambiente == "production" ? "https://servicios1.afip.gov.ar/wsfev1/service.asmx" : "https://wswhomo.afip.gov.ar/wsfev1/service.asmx";
        return await SendAsync(url, Ns.NamespaceName + method, E(method, new object[] { await AuthAsync(c, ct), args }), ct);
    }
    public async Task<long> UltimoAsync(ComprobanteFiscal c, CancellationToken ct)
    {
        var res = await CallAsync(c, "FECompUltimoAutorizado", [E("PtoVta", c.PuntoVenta), E("CbteTipo", c.Tipo)], ct);
        if (long.TryParse(Value(res, "CbteNro"), out var last) && !res.Descendants().Any(x => x.Name.LocalName == "Err")) return last;
        throw new ArcaTransientException("No se pudo consultar la numeración: " + Messages(res));
    }
    public async Task<ArcaAuthorization?> ConsultarAsync(ComprobanteFiscal c, CancellationToken ct)
    {
        var res = await CallAsync(c, "FECompConsultar", [E("FeCompConsReq", new[] { E("CbteTipo", c.Tipo), E("CbteNro", c.Numero), E("PtoVta", c.PuntoVenta) })], ct);
        var result = res.Descendants().FirstOrDefault(x => x.Name.LocalName == "ResultGet");
        if (result is null)
        {
            var errors = res.Descendants().Where(x => x.Name.LocalName == "Err").ToList();
            if (errors.Count > 0 && errors.All(x => Value(x, "Code") == "602")) return null;
            throw new ArcaTransientException("No se pudo verificar la emisión: " + Messages(res));
        }
        var datos = FiscalRules.Deserialize<DatosFiscales>(c.DatosJson);
        if (Value(result, "Resultado") != "A" || Value(result, "DocNro") != datos.Receptor.Cuit ||
            Value(result, "DocTipo") != "80" || Value(result, "CbteFch") != c.Fecha.ToString("yyyyMMdd") ||
            Value(result, "MonId") != "PES" || Value(result, "EmisionTipo") != "CAE" ||
            !decimal.TryParse(Value(result, "ImpTotal"), NumberStyles.Number, CultureInfo.InvariantCulture, out var total) || total != c.Total ||
            !decimal.TryParse(Value(result, "ImpNeto"), NumberStyles.Number, CultureInfo.InvariantCulture, out var neto) || neto != c.Neto ||
            !decimal.TryParse(Value(result, "ImpIVA"), NumberStyles.Number, CultureInfo.InvariantCulture, out var iva) || iva != c.Iva)
            throw new FiscalException("El número consultado existe en ARCA pero sus datos no coinciden. Requiere conciliación; no se emitirá otro comprobante.");
        return Authorization(result, "CodAutorizacion", "FchVto");
    }
    public static XElement BuildDetail(ComprobanteFiscal c, ComprobanteFiscal? origen)
    {
        var d = FiscalRules.Deserialize<DatosFiscales>(c.DatosJson);
        return E("FECAEDetRequest", new object?[] {
            E("Concepto", 1), E("DocTipo", 80), E("DocNro", d.Receptor.Cuit), E("CbteDesde", c.Numero), E("CbteHasta", c.Numero),
            E("CbteFch", c.Fecha.ToString("yyyyMMdd")), E("ImpTotal", FiscalRules.Number(c.Total)), E("ImpTotConc", "0.00"),
            E("ImpNeto", FiscalRules.Number(c.Neto)), E("ImpOpEx", "0.00"), E("ImpTrib", "0.00"), E("ImpIVA", FiscalRules.Number(c.Iva)),
            E("MonId", "PES"), E("MonCotiz", "1"), E("CondicionIVAReceptorId", d.Receptor.CondicionIva),
            origen is null ? null : E("CbtesAsoc", E("CbteAsoc", new[] { E("Tipo", origen.Tipo), E("PtoVta", origen.PuntoVenta),
                E("Nro", origen.Numero), E("Cuit", origen.CuitEmisor), E("CbteFch", origen.Fecha.ToString("yyyyMMdd")) })),
            E("Iva", E("AlicIva", new[] { E("Id", 5), E("BaseImp", FiscalRules.Number(c.Neto)), E("Importe", FiscalRules.Number(c.Iva)) }))
        });
    }
    public async Task<ArcaAuthorization> EmitirAsync(ComprobanteFiscal c, ComprobanteFiscal? origen, CancellationToken ct)
    {
        var res = await CallAsync(c, "FECAESolicitar", [E("FeCAEReq", new[] {
            E("FeCabReq", new[] { E("CantReg", 1), E("PtoVta", c.PuntoVenta), E("CbteTipo", c.Tipo) }),
            E("FeDetReq", BuildDetail(c, origen)) })], ct);
        var detail = res.Descendants().FirstOrDefault(x => x.Name.LocalName == "FECAEDetResponse");
        if (detail is not null && Value(detail, "Resultado") == "A") return Authorization(detail, "CAE", "CAEFchVto");
        var codes = res.Descendants().Where(x => x.Name.LocalName == "Code").Select(x => x.Value).ToList();
        // Numeración / reproceso: no liberar un número potencialmente autorizado.
        if (codes.Any(x => x is "10016" or "10008" or "500" or "501" or "502") || detail is null && codes.Count == 0)
            throw new ArcaTransientException("Resultado de ARCA pendiente de conciliación: " + Messages(res));
        throw new ArcaRejectedException("ARCA rechazó el comprobante: " + Messages(res));
    }
    private static ArcaAuthorization Authorization(XContainer result, string caeName, string dateName)
    {
        var cae = Value(result, caeName);
        if (cae?.Length != 14 || !cae.All(char.IsDigit) || !DateOnly.TryParseExact(Value(result, dateName), "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha))
            throw new ArcaTransientException("ARCA devolvió una autorización incompleta. Se consultará el comprobante.");
        return new(cae, fecha, Messages(result));
    }
}
