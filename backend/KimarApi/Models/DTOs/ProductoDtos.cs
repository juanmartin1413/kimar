namespace KimarApi.Models.DTOs;

public record ProductoDto(
    Guid Id,
    string Nombre,
    string Categoria,
    decimal PrecioKg,
    string Unidad,
    bool Activo,
    int Orden);

public record CreateProductoRequest(
    string Nombre,
    decimal PrecioKg,
    string Categoria = "otros",
    string Unidad = "kg");

public record UpdateProductoRequest(
    string? Nombre,
    string? Categoria,
    decimal? PrecioKg,
    string? Unidad,
    bool? Activo,
    int? Orden);

public record ReordenProductoItem(Guid Id, int Orden);
