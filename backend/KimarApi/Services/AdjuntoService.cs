using KimarApi.Data;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace KimarApi.Services;

// El contenido de los adjuntos vive en disco, sobre el volumen persistente montado en Railway
// (Storage:UploadsPath = "wwwroot/uploads", resuelve a /app/wwwroot/uploads en el contenedor).
// La fila Adjunto solo guarda metadata + la ruta relativa; nunca se sirve como estático público,
// todo acceso pasa por AdjuntosController para respetar el [Authorize] del resto de la API.
public class AdjuntoService(KimarDbContext db, IConfiguration config)
{
    private string RaizAlmacenamiento => config["Storage:UploadsPath"] ?? "wwwroot/uploads";

    public async Task<Adjunto> GuardarAsync(string entidadTipo, Guid entidadId, string tipo, string nombre,
        string contentType, string contenidoBase64, Guid usuarioId)
    {
        var bytes = Convert.FromBase64String(contenidoBase64);

        var adjunto = new Adjunto
        {
            EntidadTipo = entidadTipo,
            EntidadId = entidadId,
            Tipo = tipo,
            Nombre = nombre,
            ContentType = contentType,
            UsuarioId = usuarioId
        };
        var extension = Path.GetExtension(nombre);
        adjunto.RutaArchivo = Path.Combine(entidadTipo, entidadId.ToString(), $"{adjunto.Id}{extension}");

        var rutaCompleta = Path.Combine(RaizAlmacenamiento, adjunto.RutaArchivo);
        Directory.CreateDirectory(Path.GetDirectoryName(rutaCompleta)!);
        await File.WriteAllBytesAsync(rutaCompleta, bytes);

        db.Adjuntos.Add(adjunto);
        await db.SaveChangesAsync();
        return adjunto;
    }

    public async Task<(Adjunto Adjunto, byte[] Contenido)?> LeerAsync(Guid id)
    {
        var adjunto = await db.Adjuntos.FindAsync(id);
        if (adjunto is null) return null;

        var rutaCompleta = Path.Combine(RaizAlmacenamiento, adjunto.RutaArchivo);
        if (!File.Exists(rutaCompleta)) return null;

        var bytes = await File.ReadAllBytesAsync(rutaCompleta);
        return (adjunto, bytes);
    }

    public async Task<List<Adjunto>> ListarAsync(string entidadTipo, Guid entidadId)
    {
        return await db.Adjuntos
            .Where(a => a.EntidadTipo == entidadTipo && a.EntidadId == entidadId)
            .OrderByDescending(a => a.FechaCreacion)
            .ToListAsync();
    }

    public async Task<bool> EliminarAsync(Guid id)
    {
        var adjunto = await db.Adjuntos.FindAsync(id);
        if (adjunto is null) return false;

        var rutaCompleta = Path.Combine(RaizAlmacenamiento, adjunto.RutaArchivo);
        if (File.Exists(rutaCompleta)) File.Delete(rutaCompleta);

        db.Adjuntos.Remove(adjunto);
        await db.SaveChangesAsync();
        return true;
    }
}
