using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class InstanciaGasto
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid GastoFijoId { get; set; }

    public int Mes { get; set; }

    public int Anio { get; set; }

    public decimal Monto { get; set; }

    public DateOnly? FechaVencimiento { get; set; }

    public bool Pagado { get; set; } = false;

    public DateOnly? FechaPago { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(GastoFijoId))]
    public GastoFijo GastoFijo { get; set; } = null!;
}
