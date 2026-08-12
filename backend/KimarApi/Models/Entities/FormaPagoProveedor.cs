using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class FormaPagoProveedor
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProveedorId { get; set; }

    public DateOnly FechaDesde { get; set; }

    // null = vigente; se completa cuando se crea una versión nueva que la reemplaza
    public DateOnly? FechaHasta { get; set; }

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(ProveedorId))]
    public Proveedor Proveedor { get; set; } = null!;

    public ICollection<TramoPago> Tramos { get; set; } = [];
    public ICollection<Compra> Compras { get; set; } = [];
}
