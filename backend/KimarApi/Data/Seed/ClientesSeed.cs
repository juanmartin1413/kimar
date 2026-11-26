using System.Text.Json;
using KimarApi.Models.Entities;

namespace KimarApi.Data.Seed;

public static class ClientesSeed
{
    private static readonly DateTime FechaBase = new(2026, 11, 26, 0, 0, 0, DateTimeKind.Utc);

    public static IEnumerable<Cliente> GetAll(Guid vMarcosId, Guid vLucianoId, Guid vManoloId)
    {
        using var stream = typeof(ClientesSeed).Assembly.GetManifestResourceStream(
            "KimarApi.Data.Seed.clientes-2026-11-26.json")
            ?? throw new InvalidOperationException("Falta la planilla de clientes del seed.");
        var filas = JsonSerializer.Deserialize<FilaCliente[]>(stream)
            ?? throw new InvalidOperationException("La planilla de clientes esta vacia.");
        if (filas.Length != 63 || filas.Select(f => f.Nombre).Distinct(StringComparer.OrdinalIgnoreCase).Count() != 63)
            throw new InvalidOperationException("La planilla debe contener 63 clientes unicos.");

        return filas.Select(f => new Cliente
        {
            Nombre = f.Nombre,
            VendedorId = f.Vendedor switch
            {
                "Marcos" => vMarcosId,
                "Luciano" => vLucianoId,
                "Manolo" => vManoloId,
                _ => throw new InvalidOperationException($"Vendedor desconocido: {f.Vendedor}")
            },
            Calle = f.Calle, Altura = f.Altura, CodigoPostal = f.CodigoPostal,
            Localidad = f.Localidad, Provincia = f.Provincia,
            Telefono1 = f.Telefono1, Telefono2 = f.Telefono2,
            CondicionIva = string.IsNullOrWhiteSpace(f.Cuit) ? null : 1, // Responsable inscripto
            Email = f.Email, Cuit = f.Cuit, FechaCreacion = FechaBase
        }).ToArray();
    }

    private sealed record FilaCliente(string Nombre, string Vendedor, string? Calle,
        string? Altura, string? CodigoPostal, string? Localidad, string? Provincia,
        string? Telefono1, string? Telefono2, string? Email, string? Cuit);
}
