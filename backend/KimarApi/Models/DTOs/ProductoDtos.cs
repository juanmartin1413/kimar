namespace KimarApi.Models.DTOs;

public record ProductoDto(
    Guid Id,
    string Nombre,
    string Categoria,
    decimal PrecioKg,
    string Unidad,
    bool Activo);

public record CreateProductoRequest(
    string Nombre,
    string Categoria,
    decimal PrecioKg,
    string Unidad = "kg");

public record UpdateProductoRequest(
    string? Nombre,
    string? Categoria,
    decimal? PrecioKg,
    string? Unidad,
    bool? Activo);
