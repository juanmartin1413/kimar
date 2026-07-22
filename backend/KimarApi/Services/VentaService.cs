using KimarApi.Data;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace KimarApi.Services;

public class VentaService(KimarDbContext db)
{
    public async Task RecalcularEstadoAsync(Guid ventaId)
    {
        var venta = await db.Ventas
            .Include(v => v.Cobranzas)
            .FirstOrDefaultAsync(v => v.Id == ventaId);

        if (venta is null) return;

        var cobrado = venta.Cobranzas
            .Where(c => c.Estado == "cobrado")
            .Sum(c => c.Monto);

        venta.Estado = cobrado >= venta.Total ? "pagado"
            : cobrado > 0 ? "cobrado_parcial"
            : "debe";

        await db.SaveChangesAsync();
    }

    public string CalcularEstado(decimal total, IEnumerable<Cobranza> cobranzas)
    {
        var cobrado = cobranzas.Where(c => c.Estado == "cobrado").Sum(c => c.Monto);
        return cobrado >= total ? "pagado"
            : cobrado > 0 ? "cobrado_parcial"
            : "debe";
    }

    // Serie "00002" identifica al remito digital (00001 fue la serie del talonario físico).
    // El UPDATE ... RETURNING de Postgres toma un lock de fila e incrementa de forma atómica,
    // evitando números duplicados si dos ventas se crean al mismo tiempo.
    // Se ejecuta con ADO.NET directo (no LINQ de EF) porque EF intenta envolver el SQL en un
    // SELECT para darle forma al resultado, y un UPDATE ... RETURNING no es "componible" así.
    public async Task<string> SiguienteNumeroRemitoAsync()
    {
        var conn = (NpgsqlConnection)db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"UPDATE ""ContadoresRemito"" SET ""Ultimo"" = ""Ultimo"" + 1 WHERE ""Id"" = 1 RETURNING ""Ultimo""";
        if (db.Database.CurrentTransaction is not null)
            cmd.Transaction = (NpgsqlTransaction)db.Database.CurrentTransaction.GetDbTransaction();

        var ultimo = (long)(await cmd.ExecuteScalarAsync())!;
        return $"00002-{ultimo:D8}";
    }
}
