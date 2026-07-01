using System.ComponentModel.DataAnnotations;

namespace KimarApi.Models.Entities;

public class GastoFijo
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    public decimal Monto { get; set; }

    [Required, MaxLength(20)]
    public string Tipo { get; set; } = "mensual"; // mensual | ocasional

    public int? DiaPago { get; set; }

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<InstanciaGasto> Instancias { get; set; } = [];
}
