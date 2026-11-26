using KimarApi.Data.Seed;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace KimarApi.Tests;

[TestClass]
public class ClientesSeedTests
{
    [TestMethod]
    public void PlanillaReemplazaCarteraAnteriorYAsignaVendedores()
    {
        var marcos = Guid.NewGuid(); var luciano = Guid.NewGuid(); var manolo = Guid.NewGuid();
        var clientes = ClientesSeed.GetAll(marcos, luciano, manolo).ToArray();
        Assert.AreEqual(63, clientes.Length);
        Assert.AreEqual(63, clientes.Select(c => c.Nombre).Distinct().Count());
        Assert.AreEqual(27, clientes.Count(c => c.VendedorId == luciano));
        Assert.AreEqual(24, clientes.Count(c => c.VendedorId == marcos));
        Assert.AreEqual(12, clientes.Count(c => c.VendedorId == manolo));
        Assert.IsFalse(clientes.Any(c => new[] { "Chirola", "Iñaki", "Ultramarino" }.Contains(c.Nombre)));
        Assert.IsTrue(clientes.Any(c => c.Nombre == "Teresa - Mercado Central"));
        Assert.IsTrue(clientes.All(c => c.Activo && c.DiasPlazoPago == 15));
        Assert.AreEqual(1, clientes.Single(c => c.Nombre == "Fabric - Olazábal").CondicionIva);
        Assert.IsTrue(clientes.Where(c => !string.IsNullOrWhiteSpace(c.Cuit)).All(c => c.CondicionIva == 1));
        Assert.IsTrue(clientes.Where(c => string.IsNullOrWhiteSpace(c.Cuit)).All(c => c.CondicionIva is null));
    }

    [TestMethod]
    public void ConservaAlturasCompuestasReferenciasYAcentosSinInventarDatos()
    {
        var clientes = ClientesSeed.GetAll(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()).ToDictionary(c => c.Nombre);
        var fabric = clientes["Fabric - Peñaloza"];
        Assert.AreEqual("Rosario Vera Peñaloza", fabric.Calle);
        Assert.AreEqual("475/485", fabric.Altura);
        Assert.AreEqual("C1107", fabric.CodigoPostal);
        var fish = clientes["The Fish Company"];
        Assert.IsNull(fish.Altura);
        Assert.AreEqual("B1629", fish.CodigoPostal);
        StringAssert.Contains(fish.Calle!, "47.5");
        StringAssert.Contains(fish.Calle!, "Local 3");
        Assert.IsNull(clientes["La Toscana"].Altura);
        Assert.IsNull(clientes["Martín Bouquet"].Calle);
        Assert.IsNull(clientes["Eduardo Gazzo"].Cuit);
        Assert.AreEqual("chnolivos@gmail.com", clientes["Hormiga Negra - Olivos"].Email);
    }
}
