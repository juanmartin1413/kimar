using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class CuotaProv
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CompromisoId { get; set; }

    public DateOnly Fecha { get; set; }

    public decimal Monto { get; set; }

    [Required, MaxLength(20)]
    public string FormaPago { get; set; } = "efectivo";

    [Required, MaxLength(20)]
    public string Estado { get; set; } = "pendiente"; // pendiente | pagado

    public DateOnly? FechaPago { get; set; }

    // Monto y forma de pago efectivamente usados al pagar, para comparar contra lo pactado (Monto/FormaPago)
    public decimal? MontoPagado { get; set; }

    [MaxLength(20)]
    public string? FormaPagoReal { get; set; }

    // Navigation
    [ForeignKey(nameof(CompromisoId))]
    public CompromisoProv Compromiso { get; set; } = null!;
}
