using KimarApi.Models.Entities;

namespace KimarApi.Data.Seed;

public static class ClientesSeed
{
    private static readonly DateTime FechaBase = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static Cliente C(string nombre, Guid vendedorId, string? tel1 = null, string? localidad = null) =>
        new() { Nombre = nombre, VendedorId = vendedorId, Telefono1 = tel1, Localidad = localidad, FechaCreacion = FechaBase };

    public static IEnumerable<Cliente> GetAll(Guid vMarcosId, Guid vLucianoId, Guid vManoloId)
    {
        // ── Luciano (26 clientes) ─────────────────────────────────────────────
        var luciano = new[]
        {
            C("Fabric - Olazábal",             vLucianoId),
            C("Fabric - Beiro",                vLucianoId),
            C("Fabric - Cachimayo",            vLucianoId),
            C("Fabric - Vallese",              vLucianoId),
            C("Fabric - Doblas",               vLucianoId),
            C("Fabric - Artigas",              vLucianoId),
            C("Fabric - Honorio",              vLucianoId),
            C("Fabric - Asunción",             vLucianoId),
            C("Fabric - Directorio",           vLucianoId),
            C("Parrilla Sanabria",             vLucianoId),
            C("El Pibe Dorrego",               vLucianoId),
            C("Fabric - Leloir",               vLucianoId),
            C("Fabric - Castelar",             vLucianoId),
            C("Fabric - Peñaloza",             vLucianoId),
            C("Sushi Club - Maswitch",         vLucianoId),
            C("Sushi Club - Nordelta",         vLucianoId),
            C("Sushi Club - Lanús",            vLucianoId),
            C("Sushi Club - Lomas",            vLucianoId),
            C("Eduardo Gazzo",                 vLucianoId),
            C("Iñaki",                         vLucianoId),
            C("Pescadería Liniers",            vLucianoId),
            C("Pescadería Sorrento",           vLucianoId),
            C("Pescadería La Esperanza",       vLucianoId),
            C("Olivos Gourmet",                vLucianoId),
            C("Martín Bouquet",                vLucianoId),
            C("The Fish Company",              vLucianoId),
        };

        // ── Marcos (24 clientes) ─────────────────────────────────────────────
        var marcos = new[]
        {
            C("Daimus",                        vMarcosId),
            C("La Segunda",                    vMarcosId),
            C("La Toscana",                    vMarcosId),
            C("El Imparcial",                  vMarcosId),
            C("El Globo",                      vMarcosId),
            C("Florencia China",               vMarcosId),
            C("Ultramarino",                   vMarcosId),
            C("Barbacoa",                      vMarcosId),
            C("Moncada",                       vMarcosId),
            C("Claudio - Monte Grande",        vMarcosId),
            C("Sushi Boom",                    vMarcosId),
            C("Augusta",                       vMarcosId),
            C("Lucas Moya",                    vMarcosId),
            C("Ángel Tornadore",               vMarcosId),
            C("Chirola",                       vMarcosId),
            C("Gabriel Teresa",                vMarcosId),
            C("Ercopez",                       vMarcosId),
            C("Luis Figuemar",                 vMarcosId),
            C("Sta. Barbara - Devoto - Natalia",     vMarcosId),
            C("Sta. Barbara - Olivos - Salvador",    vMarcosId),
            C("Sta. Barbara - Colegiales - Diego",   vMarcosId),
            C("Sta. Barbara - Munro - Quique",       vMarcosId),
            C("Chuchu",                        vMarcosId),
            C("Chino Wu",                      vMarcosId),
        };

        // ── Manolo (10 clientes) ──────────────────────────────────────────────
        var manolo = new[]
        {
            C("Bodegón Maswitch",              vManoloId),
            C("La Pescería",                   vManoloId),
            C("Hormiga Negra - Olivos",        vManoloId),
            C("Hormiga Negra - Villa Urquiza", vManoloId),
            C("Hormiga Negra - San Fernando",  vManoloId),
            C("Hormiga Negra - Almagro",       vManoloId),
            C("Hormiga Negra - Caseros",       vManoloId),
            C("El Viejo Cañón",                vManoloId),
            C("Ana Bolena",                    vManoloId),
            C("Lo de Carlitos - San Telmo",    vManoloId),
        };

        return [.. luciano, .. marcos, .. manolo];
    }
}
