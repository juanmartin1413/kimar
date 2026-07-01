using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class CompromisoProv
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProveedorId { get; set; }

    [Required, MaxLength(300)]
    public string Concepto { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(ProveedorId))]
    public Proveedor Proveedor { get; set; } = null!;

    public ICollection<CuotaProv> Cuotas { get; set; } = [];
}
