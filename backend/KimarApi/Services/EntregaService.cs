using KimarApi.Data;
using KimarApi.Models;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services;

public record ResultadoEntrega(bool Ok, string? Error = null, bool NotFound = false, bool Forbidden = false)
{
    public static ResultadoEntrega Exito() => new(true);
    public static ResultadoEntrega Fallo(string error) => new(false, error);
    public static readonly ResultadoEntrega NoEncontrado = new(false, null, NotFound: true);
    public static readonly ResultadoEntrega Prohibido = new(false, null, Forbidden: true);
}

// Ciclo de entrega de una venta: pendiente → listo (depósito) → entregado (repartidor sube el remito firmado).
// Toda la regla de negocio vive acá; el controller solo traduce resultados a HTTP.
public class EntregaService(KimarDbContext db, AdjuntoService adjuntoSvc)
{
    private const string EntidadVenta = "Venta";
    private const long MaxBytesDocumento = 8 * 1024 * 1024;

    private const string ErrorYaEntregada = "La venta ya fue entregada.";

    // Marca la venta como lista para entrega. Es idempotente sobre una venta ya lista:
    // volver a llamarlo solo cambia el repartidor, así depósito/gestión reasignan sin otro endpoint.
    public async Task<ResultadoEntrega> MarcarListoAsync(Guid ventaId, Guid? repartidorId)
    {
        var venta = await db.Ventas.FindAsync(ventaId);
        if (venta is null) return ResultadoEntrega.NoEncontrado;
        if (venta.EstadoEntrega == EstadosEntrega.Entregado) return ResultadoEntrega.Fallo(ErrorYaEntregada);

        if (repartidorId.HasValue)
        {
            var existe = await db.Usuarios.AnyAsync(u => u.Id == repartidorId.Value && u.Activo && u.Rol == Roles.Repartidor);
            if (!existe) return ResultadoEntrega.Fallo("El repartidor indicado no existe o no está activo.");
        }

        venta.EstadoEntrega = EstadosEntrega.Listo;
        venta.RepartidorId = repartidorId;
        venta.FechaListo ??= DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ResultadoEntrega.Exito();
    }

    public async Task<ResultadoEntrega> VolverAPreparacionAsync(Guid ventaId)
    {
        var venta = await db.Ventas.FindAsync(ventaId);
        if (venta is null) return ResultadoEntrega.NoEncontrado;
        if (venta.EstadoEntrega == EstadosEntrega.Entregado) return ResultadoEntrega.Fallo(ErrorYaEntregada);

        venta.EstadoEntrega = EstadosEntrega.Pendiente;
        venta.RepartidorId = null;
        venta.FechaListo = null;
        await db.SaveChangesAsync();
        return ResultadoEntrega.Exito();
    }

    // Autoasignación: un repartidor toma un pedido listo que nadie tiene asignado.
    public async Task<ResultadoEntrega> TomarAsync(Guid ventaId, Guid repartidorUserId)
    {
        var venta = await db.Ventas.FindAsync(ventaId);
        if (venta is null) return ResultadoEntrega.NoEncontrado;
        if (venta.EstadoEntrega != EstadosEntrega.Listo) return ResultadoEntrega.Fallo("El pedido no está listo para entrega.");
        if (venta.RepartidorId is not null && venta.RepartidorId != repartidorUserId)
            return ResultadoEntrega.Fallo("El pedido ya está asignado a otro repartidor.");

        venta.RepartidorId = repartidorUserId;
        await db.SaveChangesAsync();
        return ResultadoEntrega.Exito();
    }

    public async Task<ResultadoEntrega> SoltarAsync(Guid ventaId, Guid userId, bool esGestion)
    {
        var venta = await db.Ventas.FindAsync(ventaId);
        if (venta is null) return ResultadoEntrega.NoEncontrado;
        if (venta.EstadoEntrega == EstadosEntrega.Entregado) return ResultadoEntrega.Fallo(ErrorYaEntregada);
        if (!esGestion && venta.RepartidorId != userId) return ResultadoEntrega.Prohibido;

        venta.RepartidorId = null;
        await db.SaveChangesAsync();
        return ResultadoEntrega.Exito();
    }

    // Sube un documento tipificado a la venta. Un documento por tipo: volver a subir reemplaza al anterior.
    // Si el tipo prueba la entrega (remito firmado), la venta pasa a "entregado" en la misma transacción.
    public async Task<(ResultadoEntrega Resultado, Adjunto? Adjunto)> AdjuntarDocumentoAsync(
        Guid ventaId, CreateDocumentoEntregaRequest req, Guid userId, bool esGestion)
    {
        var venta = await db.Ventas.FindAsync(ventaId);
        if (venta is null) return (ResultadoEntrega.NoEncontrado, null);
        if (venta.EstadoEntrega == EstadosEntrega.Pendiente)
            return (ResultadoEntrega.Fallo("El pedido todavía no está listo para entrega."), null);
        if (!esGestion && venta.RepartidorId != userId) return (ResultadoEntrega.Prohibido, null);

        if (!TiposDocumentoVenta.EsValido(req.Tipo))
            return (ResultadoEntrega.Fallo("Tipo de documento inválido."), null);
        if (string.IsNullOrWhiteSpace(req.ContentType) || !req.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return (ResultadoEntrega.Fallo("Solo se admiten imágenes."), null);
        if (string.IsNullOrEmpty(req.ContenidoBase64))
            return (ResultadoEntrega.Fallo("El documento está vacío."), null);
        // Estimación sin decodificar: base64 ocupa 4 chars por cada 3 bytes.
        if (req.ContenidoBase64.Length * 3L / 4 > MaxBytesDocumento)
            return (ResultadoEntrega.Fallo("La imagen supera los 8 MB."), null);

        await using var tx = await db.Database.BeginTransactionAsync();

        var previo = await db.Adjuntos.FirstOrDefaultAsync(a =>
            a.EntidadTipo == EntidadVenta && a.EntidadId == ventaId && a.Tipo == req.Tipo);
        if (previo is not null) await adjuntoSvc.EliminarAsync(previo.Id);

        var nombre = string.IsNullOrWhiteSpace(req.Nombre) ? $"{req.Tipo}.jpg" : req.Nombre;
        var adjunto = await adjuntoSvc.GuardarAsync(EntidadVenta, ventaId, req.Tipo, nombre, req.ContentType, req.ContenidoBase64, userId);

        if (TiposDocumentoVenta.MarcaEntregado(req.Tipo) && venta.EstadoEntrega != EstadosEntrega.Entregado)
        {
            venta.EstadoEntrega = EstadosEntrega.Entregado;
            venta.FechaEntregado = DateTime.UtcNow;
        }
        // Un repartidor que sube el remito de un pedido sin asignar queda como responsable de la entrega.
        if (venta.RepartidorId is null && !esGestion) venta.RepartidorId = userId;

        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return (ResultadoEntrega.Exito(), adjunto);
    }

    // El repartidor solo ve documentos de ventas que tiene asignadas; gestión ve todos.
    public async Task<ResultadoEntrega> PuedeVerDocumentoAsync(Guid ventaId, Guid adjuntoId, Guid userId, bool esGestion)
    {
        var adjunto = await db.Adjuntos.FindAsync(adjuntoId);
        if (adjunto is null || adjunto.EntidadTipo != EntidadVenta || adjunto.EntidadId != ventaId)
            return ResultadoEntrega.NoEncontrado;
        if (esGestion) return ResultadoEntrega.Exito();

        var asignada = await db.Ventas.AnyAsync(v => v.Id == ventaId && v.RepartidorId == userId);
        return asignada ? ResultadoEntrega.Exito() : ResultadoEntrega.Prohibido;
    }
}
