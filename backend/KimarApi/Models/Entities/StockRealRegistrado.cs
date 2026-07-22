using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class StockRealRegistrado
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProductoId { get; set; }

    public Guid? CalidadId { get; set; }

    public decimal Cantidad { get; set; }

    public DateOnly Fecha { get; set; }

    public Guid UsuarioId { get; set; }

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    // Navigation
    [ForeignKey(nameof(ProductoId))]
    public Producto Producto { get; set; } = null!;

    [ForeignKey(nameof(UsuarioId))]
    public Usuario Usuario { get; set; } = null!;

    [ForeignKey(nameof(CalidadId))]
    public Calidad? Calidad { get; set; }
}
