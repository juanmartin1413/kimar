using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class MovimientoStock
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProductoId { get; set; }

    [Required, MaxLength(20)]
    public string Tipo { get; set; } = "entrada"; // entrada | salida

    public decimal Cantidad { get; set; }

    [Required, MaxLength(20)]
    public string Motivo { get; set; } = "compra"; // compra | venta | ajuste | merma | devolucion

    public Guid UsuarioId { get; set; }

    public Guid? VentaId { get; set; }

    public Guid? ProveedorId { get; set; }

    public DateOnly Fecha { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(ProductoId))]
    public Producto Producto { get; set; } = null!;

    [ForeignKey(nameof(UsuarioId))]
    public Usuario Usuario { get; set; } = null!;

    [ForeignKey(nameof(VentaId))]
    public Venta? Venta { get; set; }

    [ForeignKey(nameof(ProveedorId))]
    public Proveedor? Proveedor { get; set; }
}
