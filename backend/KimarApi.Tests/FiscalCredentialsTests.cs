using System.Net;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using KimarApi.Models.Entities;
using KimarApi.Services.Facturacion;
using Microsoft.Extensions.Configuration;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class FiscalCredentialsTests
{
    private const string Prefix = "Facturacion:Emisores:dueno:";
    private static Dictionary<string, string?> Settings() => new()
    {
        [Prefix + "Cuit"] = "20358549684", [Prefix + "RazonSocial"] = "Prueba",
        [Prefix + "Domicilio"] = "Prueba", [Prefix + "IngresosBrutos"] = "20358549684",
        [Prefix + "InicioActividades"] = "2020-07-01",
        [Prefix + "homologation:PuntoVenta"] = "1", [Prefix + "production:PuntoVenta"] = "1"
    };
    private static FiscalConfig Config(Dictionary<string, string?> values) =>
        new(new ConfigurationBuilder().AddInMemoryCollection(values).Build());

    [TestMethod]
    public void PartialPemFailsInsteadOfFallingBackToFiles()
    {
        var settings = Settings();
        settings[Prefix + "homologation:CertificadoPem"] = "test";
        Assert.ThrowsException<FiscalException>(() => Config(settings).Credentials("dueno", "homologation", "20358549684", 1));
    }

    [TestMethod]
    public void EnvironmentAndIssuerCannotBorrowCredentials()
    {
        var settings = Settings();
        settings[Prefix + "homologation:CertificadoPem"] = "cert";
        settings[Prefix + "homologation:ClavePrivadaPem"] = "key";
        var config = Config(settings);
        Assert.ThrowsException<FiscalException>(() => config.Credentials("dueno", "production", "20358549684", 1));
        Assert.ThrowsException<FiscalException>(() => config.Credentials("dueno", "homologation", "20123456786", 1));
    }

    [TestMethod]
    public void FileCredentialsStillLoadWithoutExposingPathsAsPem()
    {
        var cert = Path.GetTempFileName();
        var key = Path.GetTempFileName();
        try
        {
            File.WriteAllText(cert, "certificate-content"); File.WriteAllText(key, "key-content");
            var settings = Settings();
            settings[Prefix + "homologation:CertificadoPath"] = cert;
            settings[Prefix + "homologation:ClavePrivadaPath"] = key;
            Assert.AreEqual(("certificate-content", "key-content"), Config(settings).Credentials("dueno", "homologation", "20358549684", 1));
        }
        finally { File.Delete(cert); File.Delete(key); }
    }

    [TestMethod]
    public async Task PemPairSignsWsaaRequestAndMismatchedKeyNeverReachesNetwork()
    {
        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest("CN=LocalTest", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        using var cert = request.CreateSelfSigned(DateTimeOffset.UtcNow.AddMinutes(-1), DateTimeOffset.UtcNow.AddDays(1));
        var settings = Settings();
        settings[Prefix + "homologation:CertificadoPem"] = cert.ExportCertificatePem();
        settings[Prefix + "homologation:ClavePrivadaPem"] = rsa.ExportPkcs8PrivateKeyPem();
        var handler = new LoginProbe();
        using var http = new HttpClient(handler);
        var c = new ComprobanteFiscal { EmisorId = "dueno", Ambiente = "homologation", CuitEmisor = "20358549684", PuntoVenta = 1, Tipo = 1 };
        // A deliberate HTTP 503 stops this offline test after successful CMS signing.
        await Assert.ThrowsExceptionAsync<ArcaTransientException>(() => new ArcaClient(http, Config(settings)).UltimoAsync(c, default));
        Assert.AreEqual(1, handler.Calls);
        using var other = RSA.Create(2048);
        settings[Prefix + "homologation:ClavePrivadaPem"] = other.ExportRSAPrivateKeyPem();
        var error = await Assert.ThrowsExceptionAsync<FiscalException>(() => new ArcaClient(http, Config(settings)).UltimoAsync(c, default));
        Assert.AreEqual(1, handler.Calls);
        Assert.IsFalse(error.Message.Contains("BEGIN"));
    }

    private sealed class LoginProbe : HttpMessageHandler
    {
        public int Calls;
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Calls++;
            Assert.AreEqual("wsaahomo.afip.gov.ar", request.RequestUri!.Host);
            Assert.IsTrue((await request.Content!.ReadAsStringAsync(ct)).Contains("loginCms"));
            return new(HttpStatusCode.ServiceUnavailable);
        }
    }
}
