using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services.Facturacion;

namespace KimarApi.Services;

public record AplicacionPagoRequest(Guid CobranzaId, decimal Monto);
public record PreviewPagoRequest(Guid ClienteId, decimal Monto, Guid? PrioridadId = null);
public record ConfirmarPagoRequest(Guid OperacionId, Guid ClienteId, DateOnly Fecha, decimal Monto,
    string FormaPago, string? Observaciones, string Version, List<AplicacionPagoRequest> Imputaciones);
public record DeudaPagoDto(Guid CobranzaId, Guid? VentaId, string? NroRemito, DateOnly Vencimiento,
    decimal Saldo, decimal Aplicar, string? NroFactura = null);

public static class CobranzaRules
{
    public static decimal Saldo(Cobranza c) => c.Estado == "cancelado" ? 0 : c.Monto - c.Imputaciones.Sum(i => i.Monto);

    public static List<DeudaPagoDto> Proponer(IEnumerable<Cobranza> compromisos, decimal monto, Guid? prioridad)
    {
        if (monto <= 0 || monto != FiscalRules.Money(monto)) throw new FiscalException("Ingresá un importe positivo con hasta dos decimales.");
        var deudas = compromisos.Where(c => Saldo(c) > 0).OrderBy(c => c.Id == prioridad ? 0 : 1)
            .ThenBy(c => c.Fecha).ThenBy(c => c.FechaCreacion).ThenBy(c => c.Id).ToList();
        if (prioridad.HasValue && !deudas.Any(c => c.Id == prioridad)) throw new FiscalException("La cobranza seleccionada ya no tiene saldo disponible.");
        if (monto > deudas.Sum(Saldo)) throw new FiscalException("El monto supera la deuda disponible del cliente.");
        return deudas.Select(c => {
            var saldo = Saldo(c);
            var aplicar = Math.Min(monto, saldo);
            monto -= aplicar;
            return new DeudaPagoDto(c.Id, c.VentaId, c.Venta?.NroRemito, c.Fecha, saldo, aplicar, c.Venta?.NroFactura);
        }).ToList();
    }

    public static void ValidarAplicaciones(List<Cobranza> deudas, decimal monto, List<AplicacionPagoRequest> aplicaciones)
    {
        if (aplicaciones.Count == 0 || aplicaciones.Select(i => i.CobranzaId).Distinct().Count() != aplicaciones.Count ||
            aplicaciones.Sum(i => i.Monto) != monto || aplicaciones.Any(i => i.Monto <= 0 || i.Monto != FiscalRules.Money(i.Monto) ||
            !deudas.Any(c => c.Id == i.CobranzaId && i.Monto <= Saldo(c))))
            throw new FiscalException("La distribución debe coincidir con el pago y respetar los saldos del cliente.");
    }

    // Proyección de movimientos para cuenta corriente y reportes: pendiente = saldo, cobrado = imputación.
    public static IEnumerable<CobranzaDto> Movimientos(Cobranza c)
    {
        if (Saldo(c) > 0)
            yield return new(c.Id, c.VentaId, c.ClienteId, c.Cliente?.Nombre ?? "", c.Fecha, Saldo(c), "", "pendiente", c.Observaciones, c.FechaCreacion, null);
        foreach (var i in c.Imputaciones)
            yield return new(i.Id, c.VentaId, c.ClienteId, c.Cliente?.Nombre ?? "", i.Pago.Fecha, i.Monto,
                i.Pago.FormaPago, "cobrado", i.Pago.Observaciones, i.Pago.FechaCreacion, i.Pago.Fecha, i.PagoId);
    }

    public static bool HorarioValido(DateOnly fecha, TimeOnly? desde, TimeOnly? hasta) =>
        fecha != default && (!hasta.HasValue || (desde.HasValue && hasta > desde));
}
