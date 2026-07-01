using KimarApi.Models.Entities;

namespace KimarApi.Data.Seed;

public static class ClientesSeed
{
    private static readonly DateTime FechaBase = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static Cliente C(string nombre, Guid vendedorId, string? tel1 = null, string? localidad = null) =>
        new() { Nombre = nombre, VendedorId = vendedorId, Telefono1 = tel1, Localidad = localidad, FechaCreacion = FechaBase };

    public static IEnumerable<Cliente> GetAll(Guid vMarcosId, Guid vLucianoId, Guid vLucasId)
    {
        // ── Marcos (16 clientes) ──────────────────────────────────────────────
        var marcos = new[]
        {
            C("Augusta",                       vMarcosId),
            C("Daimus",                        vMarcosId),
            C("La Segunda",                    vMarcosId),
            C("Haro Sushi",                    vMarcosId),
            C("El Viejo Cañón",                vMarcosId),
            C("Longobucco",                    vMarcosId),
            C("Hormiga Negra - Sucursal 1",    vMarcosId),
            C("Hormiga Negra - Sucursal 2",    vMarcosId),
            C("Hormiga Negra - Sucursal 3",    vMarcosId),
            C("Sushi Kyu",                     vMarcosId),
            C("Lili Resto",                    vMarcosId),
            C("Pescería",                      vMarcosId),
            C("Ercopez",                       vMarcosId),
            C("Chirola Teresa",                vMarcosId),
            C("Gabriel Teresa",                vMarcosId),
            C("Kity",                          vMarcosId),
        };

        // ── Luciano (25 clientes) ─────────────────────────────────────────────
        var luciano = new[]
        {
            C("Sushi Club - Sucursal 1",       vLucianoId),
            C("Sushi Club - Sucursal 2",       vLucianoId),
            C("Sushi Club - Sucursal 3",       vLucianoId),
            C("Satoshi - Sucursal 1",          vLucianoId),
            C("Satoshi - Sucursal 2",          vLucianoId),
            C("Fabric - Local 1",              vLucianoId),
            C("Fabric - Local 2",              vLucianoId),
            C("Fabric - Local 3",              vLucianoId),
            C("Fabric - Local 4",              vLucianoId),
            C("El Pibe Dorrego",               vLucianoId),
            C("Polo House",                    vLucianoId),
            C("Cochinchina",                   vLucianoId),
            C("Polo Catering",                 vLucianoId),
            C("Olivos Gourmet",                vLucianoId),
            C("Cachito de Mar",                vLucianoId),
            C("The Fish Company",              vLucianoId),
            C("Alvasan",                       vLucianoId),
            C("Eduardo Gazzo",                 vLucianoId),
            C("Pescadería Tiburón",            vLucianoId),
            C("Pescadería Esperanza",          vLucianoId),
            C("Pescadería Biancomar",          vLucianoId),
            C("Pescadería Luigi",              vLucianoId),
            C("Pescadería Sorrento",           vLucianoId),
            C("Pescadería Il Pesce",           vLucianoId),
            C("Distribuidora Luciano",         vLucianoId),
        };

        // ── Lucas (26 clientes) ───────────────────────────────────────────────
        var lucas = new[]
        {
            C("Toscana",                       vLucasId),
            C("Moby Dick",                     vLucasId),
            C("Yunta",                         vLucasId),
            C("Sta. Barbara - Sucursal 1",     vLucasId),
            C("Sta. Barbara - Sucursal 2",     vLucasId),
            C("Barbacoa",                      vLucasId),
            C("Moncada",                       vLucasId),
            C("El Imparcial",                  vLucasId),
            C("El Globo",                      vLucasId),
            C("Claudio Ramos Mejía",           vLucasId),
            C("Florencia China",               vLucasId),
            C("Jacinto",                       vLucasId),
            C("Aurelia Río",                   vLucasId),
            C("Super Chino Wu",                vLucasId),
            C("Distribuidora Lucas 1",         vLucasId),
            C("Distribuidora Lucas 2",         vLucasId),
            C("Bajos del Paraná",              vLucasId),
            C("Pescadería Tornadore",          vLucasId),
            C("Pescadería Modelo",             vLucasId),
            C("Pescadería Tito",               vLucasId),
            C("Pescadería Cayetano",           vLucasId),
            C("Pescadería Golfo",              vLucasId),
            C("Pescadería Carbone",            vLucasId),
            C("Pescadería Mi Puerto",          vLucasId),
            C("Pescadería Liniers",            vLucasId),
            C("Pescadería Chuchu",             vLucasId),
        };

        return [.. marcos, .. luciano, .. lucas];
    }
}
