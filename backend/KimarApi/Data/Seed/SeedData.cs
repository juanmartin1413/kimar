using KimarApi.Models.Entities;
using KimarApi.Services;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Data.Seed;

public static class SeedData
{
    public static async Task InitializeAsync(KimarDbContext db)
    {
        if (await db.Usuarios.AnyAsync()) return;

        // ── Usuarios ──────────────────────────────────────────────────────────
        var uMarcos  = new Usuario { Nombre = "Marcos Monclus", Email = "marcos.monclus@kimarcompany.com.ar", PasswordHash = AuthService.HashPassword("Lango2026*"), Rol = "admin" };
        var uAilin   = new Usuario { Nombre = "Ailin Trigo",    Email = "ailin.trigo@kimarcompany.com.ar",    PasswordHash = AuthService.HashPassword("Lango2026*"), Rol = "gestor" };
        var uJuan    = new Usuario { Nombre = "Juan Roldan",    Email = "juan.roldan@kimarcompany.com.ar",    PasswordHash = AuthService.HashPassword("Lango2026*"), Rol = "admin" };
        var uLuciano = new Usuario { Nombre = "Luciano",        Email = "luciano@kimarcompany.com.ar",        PasswordHash = AuthService.HashPassword("Lango2026*"), Rol = "vendedor" };
        var uTiago   = new Usuario { Nombre = "Tiago Lopez",    Email = "tiago.lopez@kimarcompany.com.ar",    PasswordHash = AuthService.HashPassword("Lango2026*"), Rol = "vendedor" };
        var uManuel  = new Usuario { Nombre = "Manuel Gonzalez", Email = "manuel.gonzalez@kimarcompany.com.ar", PasswordHash = AuthService.HashPassword("Lango2026*"), Rol = "vendedor" };

        db.Usuarios.AddRange(uMarcos, uAilin, uJuan, uLuciano, uTiago, uManuel);

        // ── Vendedores ────────────────────────────────────────────────────────
        var vMarcos  = new Vendedor { Nombre = "Marcos",  UsuarioId = uMarcos.Id };
        var vLuciano = new Vendedor { Nombre = "Luciano", UsuarioId = uLuciano.Id };
        var vTiago   = new Vendedor { Nombre = "Tiago",   UsuarioId = uTiago.Id };
        var vManuel  = new Vendedor { Nombre = "Manolo",  UsuarioId = uManuel.Id };

        db.Vendedores.AddRange(vMarcos, vLuciano, vTiago, vManuel);

        // ── Productos (unión lista PDF + prototipo) ───────────────────────────
        db.Productos.AddRange(
            // Calamares
            new Producto { Nombre = "Anillas de Calamar",                         Categoria = "calamares",   PrecioKg = 17500 },
            new Producto { Nombre = "Tubo de Calamar - IQF - Moraira",            Categoria = "calamares",   PrecioKg = 15500 },
            new Producto { Nombre = "Tubo de Calamar - Origen Iberconsa",          Categoria = "calamares",   PrecioKg = 18500 },
            new Producto { Nombre = "Calamar Entero",                              Categoria = "calamares",   PrecioKg = 10500 },
            new Producto { Nombre = "Tentáculo de Calamar",                        Categoria = "calamares",   PrecioKg = 11000 },
            new Producto { Nombre = "Aleta de Calamar",                            Categoria = "calamares",   PrecioKg =  7500 },
            // Langostinos
            new Producto { Nombre = "Langostino Pelado con vena - Lanzal",         Categoria = "langostinos", PrecioKg = 17000 },
            new Producto { Nombre = "Langostino Pelado sin vena - Lanzal",         Categoria = "langostinos", PrecioKg = 18500 },
            new Producto { Nombre = "Langostino Pelado sin vena/partido - Lanzal", Categoria = "langostinos", PrecioKg = 14500 },
            new Producto { Nombre = "Langostino Cola N°0 - Lanzal",                Categoria = "langostinos", PrecioKg = 15500 },
            new Producto { Nombre = "Langostino Cola N°1 - Lanzal",                Categoria = "langostinos", PrecioKg = 14500 },
            new Producto { Nombre = "Langostino Cola N°2 - Lanzal",                Categoria = "langostinos", PrecioKg = 13500 },
            new Producto { Nombre = "Langostino Cola - IQF - Lanzal",              Categoria = "langostinos", PrecioKg = 12500 },
            new Producto { Nombre = "Langostino Entero N°1 - Lanzal",              Categoria = "langostinos", PrecioKg = 14500 },
            new Producto { Nombre = "Langostino Entero N°2 - Lanzal",              Categoria = "langostinos", PrecioKg = 12500 },
            new Producto { Nombre = "Kanikama - Sta. Elena industrial",             Categoria = "otros",       PrecioKg = 16500 },
            // Bivalvos
            new Producto { Nombre = "Mejillón Pelado 100/200",                     Categoria = "bivalvos",    PrecioKg = 12500 },
            new Producto { Nombre = "Mejillón Media Valva",                        Categoria = "bivalvos",    PrecioKg = 14500 },
            new Producto { Nombre = "Callos de Vieira",                            Categoria = "bivalvos",    PrecioKg = 45000 },
            new Producto { Nombre = "Vieira Media Valva con Coral",                Categoria = "bivalvos",    PrecioKg = 58000 },
            new Producto { Nombre = "Ostiones ½ valva",                            Categoria = "bivalvos",    PrecioKg = 32000 },
            // Pescados
            new Producto { Nombre = "Cornalitos",                                  Categoria = "pescados",    PrecioKg = 11500 },
            new Producto { Nombre = "Filet de Merluza Negra",                      Categoria = "pescados",    PrecioKg = 78000 },
            new Producto { Nombre = "Filet de Merluza",                            Categoria = "pescados",    PrecioKg =  7000 },
            new Producto { Nombre = "Filet de Abadejo",                            Categoria = "pescados",    PrecioKg = 13500 },
            new Producto { Nombre = "Filet Pesca Blanca del día",                  Categoria = "pescados",    PrecioKg = 10500 },
            new Producto { Nombre = "Filet de Salmón",                             Categoria = "pescados",    PrecioKg = 25900 },
            new Producto { Nombre = "Filet de Trucha",                             Categoria = "pescados",    PrecioKg = 20900 },
            new Producto { Nombre = "Salmón Ahumado",                              Categoria = "pescados",    PrecioKg = 35000 },
            new Producto { Nombre = "Atún Rojo",                                   Categoria = "pescados",    PrecioKg = 33500 },
            // Pulpos
            new Producto { Nombre = "Pulpo Español T1",                            Categoria = "pulpos",      PrecioKg = 34000 },
            new Producto { Nombre = "Pulpo Español T2",                            Categoria = "pulpos",      PrecioKg = 36000 },
            // Otros
            new Producto { Nombre = "Centolla Mix",                                Categoria = "otros",       PrecioKg = 95000 }
        );

        // ── Proveedores ───────────────────────────────────────────────────────
        db.Proveedores.AddRange(
            new Proveedor { Nombre = "Noumar" },
            new Proveedor { Nombre = "Altamare" },
            new Proveedor { Nombre = "Moraira" },
            new Proveedor { Nombre = "Saona" },
            new Proveedor { Nombre = "Luis Figuemar" },
            new Proveedor { Nombre = "Pesce" },
            new Proveedor { Nombre = "Mare Pronto" },
            new Proveedor { Nombre = "Hernán Cutti" },
            new Proveedor { Nombre = "Baltazar" },
            new Proveedor { Nombre = "Kitty" },
            new Proveedor { Nombre = "Walter MDP" },
            new Proveedor { Nombre = "Lucas MDP" },
            new Proveedor { Nombre = "Méndez Jávea" },
            new Proveedor { Nombre = "Lucas Moya" },
            new Proveedor { Nombre = "Mardi" },
            new Proveedor { Nombre = "Jorge Lucero" },
            new Proveedor { Nombre = "Rodrigo Lango" },
            new Proveedor { Nombre = "Martín MDP" },
            new Proveedor { Nombre = "Juanjo Merlo" },
            new Proveedor { Nombre = "Iñaki MDP" },
            new Proveedor { Nombre = "Pato MDP" }
        );

        // ── Clientes ──────────────────────────────────────────────────────────
        db.Clientes.AddRange(ClientesSeed.GetAll(vMarcos.Id, vLuciano.Id, vManuel.Id));

        await db.SaveChangesAsync();
    }
}
