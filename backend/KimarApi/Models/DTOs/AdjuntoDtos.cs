namespace KimarApi.Models.DTOs;

// Metadata del adjunto, sin el contenido — para listados.
public record AdjuntoDto(
    Guid Id,
    string EntidadTipo,
    Guid EntidadId,
    string Tipo,
    string Nombre,
    string ContentType,
    Guid UsuarioId,
    DateTime FechaCreacion);

// El adjunto completo, con el contenido en base64 — para visualizar/descargar.
public record AdjuntoContenidoDto(
    Guid Id,
    string Nombre,
    string ContentType,
    string ContenidoBase64);

public record CreateAdjuntoRequest(
    string EntidadTipo,
    Guid EntidadId,
    string Tipo,
    string Nombre,
    string ContentType,
    string ContenidoBase64);
