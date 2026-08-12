using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Services;

public record ResultadoCompra(bool Ok, string? Error, Compra? Compra);

public class CompraService(KimarDbContext db, StockService stockSvc, FormaPagoProveedorService formaPagoSvc)
{
    public async Task<ResultadoCompra> RegistrarCompraAsync(CreateCompraRequest req, Guid usuarioId)
    {
        if (req.Items.Count == 0)
            return new ResultadoCompra(false, "La compra debe tener al menos un ítem.", null);

        var formaPago = await formaPagoSvc.GetVigenteAsync(req.ProveedorId);
        if (formaPago is null)
            return new ResultadoCompra(false,
                "El proveedor no tiene una forma de pago negociada configurada. Configurala antes de registrar la compra.", null);

        await using var tx = await db.Database.BeginTransactionAsync();

        var compra = new Compra
        {
            ProveedorId = req.ProveedorId,
            UsuarioId = usuarioId,
            FormaPagoProveedorId = formaPago.Id,
            FechaRecepcion = req.FechaRecepcion,
            NroRemito = req.NroRemito,
            NroFactura = req.NroFactura,
            Observaciones = req.Observaciones,
            Items = req.Items.Select(i => new ItemCompra
            {
                ProductoId = i.ProductoId,
                CalidadId = i.CalidadId,
                Cantidad = i.Cantidad,
                PrecioUnitario = i.PrecioUnitario,
                Subtotal = i.Cantidad * i.PrecioUnitario
            }).ToList()
        };
        compra.Total = compra.Items.Sum(i => i.Subtotal);

        db.Compras.Add(compra);
        await db.SaveChangesAsync();

        foreach (var item in compra.Items)
        {
            await stockSvc.AplicarMovimientoAsync(new MovimientoStock
            {
                ProductoId = item.ProductoId,
                CalidadId = item.CalidadId,
                Tipo = "entrada",
                Cantidad = item.Cantidad,
                Motivo = "compra",
                UsuarioId = usuarioId,
                ProveedorId = req.ProveedorId,
                CompraId = compra.Id,
                Fecha = req.FechaRecepcion,
                Observaciones = $"Compra {req.NroRemito}"
            });
        }

        GenerarCompromisoPago(compra, formaPago);
        await db.SaveChangesAsync();

        await tx.CommitAsync();
        return new ResultadoCompra(true, null, compra);
    }

    // Reparte el Total de la compra en cuotas según los tramos (%) de la forma de pago vigente.
    // El redondeo de cada tramo se ajusta en la última cuota para que la suma cierre exacto con el Total.
    private static void GenerarCompromisoPago(Compra compra, FormaPagoProveedor formaPago)
    {
        var compromiso = new CompromisoProv
        {
            ProveedorId = compra.ProveedorId,
            CompraId = compra.Id,
            Concepto = $"Compra {compra.NroRemito}"
        };

        var tramos = formaPago.Tramos.OrderBy(t => t.Orden).ToList();
        decimal acumulado = 0;
        for (var i = 0; i < tramos.Count; i++)
        {
            var tramo = tramos[i];
            var esUltimo = i == tramos.Count - 1;
            var monto = esUltimo
                ? compra.Total - acumulado
                : Math.Round(compra.Total * tramo.Porcentaje / 100, 2);
            acumulado += monto;

            compromiso.Cuotas.Add(new CuotaProv
            {
                Fecha = compra.FechaRecepcion.AddDays(tramo.DiasPlazo),
                Monto = monto,
                FormaPago = tramo.MetodoPago,
                Estado = "pendiente"
            });
        }

        compra.Compromiso = compromiso;
    }
}
