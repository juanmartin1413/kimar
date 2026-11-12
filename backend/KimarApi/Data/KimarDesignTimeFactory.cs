using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace KimarApi.Data;

// Generar migraciones no arranca la aplicación ni conecta/siembra una base existente.
public class KimarDesignTimeFactory : IDesignTimeDbContextFactory<KimarDbContext>
{
    public KimarDbContext CreateDbContext(string[] args) => new(new DbContextOptionsBuilder<KimarDbContext>()
        .UseNpgsql("Host=localhost;Database=kimar_design_only;Username=postgres;Password=unused").Options);
}
