using KimarApi.Data;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services.Facturacion;

// Lock de sesión: persiste entre commits pero no mantiene una transacción abierta durante HTTP.
// Funciona también con varias instancias de la API/worker apuntando a la misma base.
public sealed class FiscalLock(KimarDbContext db, long key) : IAsyncDisposable
{
    private bool held;
    public async Task<bool> TryAcquireAsync(CancellationToken ct)
    {
        await db.Database.OpenConnectionAsync(ct);
        await using var cmd = db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = "SELECT pg_try_advisory_lock(@key)";
        var p = cmd.CreateParameter(); p.ParameterName = "key"; p.Value = key; cmd.Parameters.Add(p);
        held = (bool)(await cmd.ExecuteScalarAsync(ct))!;
        return held;
    }
    public async ValueTask DisposeAsync()
    {
        try
        {
            if (held)
            {
                await using var cmd = db.Database.GetDbConnection().CreateCommand();
                cmd.CommandText = "SELECT pg_advisory_unlock(@key)";
                var p = cmd.CreateParameter(); p.ParameterName = "key"; p.Value = key; cmd.Parameters.Add(p);
                await cmd.ExecuteScalarAsync();
            }
        }
        finally { await db.Database.CloseConnectionAsync(); }
    }
}
