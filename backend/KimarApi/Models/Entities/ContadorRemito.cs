using System.ComponentModel.DataAnnotations;

namespace KimarApi.Models.Entities;

// Fila única (Id = 1) que lleva el correlativo del remito digital (serie "00002-########").
public class ContadorRemito
{
    [Key]
    public int Id { get; set; }

    public long Ultimo { get; set; }
}
