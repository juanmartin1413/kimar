namespace KimarApi.Models;

// Roles del sistema. Son constantes (no enum) porque [Authorize(Roles = ...)] exige strings constantes
// y porque Usuario.Rol se persiste como texto libre.
public static class Roles
{
    public const string Admin = "admin";
    public const string Gestor = "gestor";
    public const string Vendedor = "vendedor";
    public const string Deposito = "deposito";

    public static readonly string[] Todos = [Admin, Gestor, Vendedor, Deposito];

    // Combinaciones para atributos [Authorize(Roles = ...)]
    public const string Gestion = "admin,gestor";
    public const string GestionYDeposito = "admin,gestor,deposito";
    public const string Comercial = "admin,gestor,vendedor";

    public static bool EsValido(string? rol) => rol is not null && Todos.Contains(rol);
}
