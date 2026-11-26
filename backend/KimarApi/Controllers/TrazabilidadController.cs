using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Services.Facturacion;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

public class EventoTrazabilidad
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = "";
    public DateOnly Fecha { get; set; }
    public DateTime Registro { get; set; }
    public string Estado { get; set; } = "";
    public string? Referencia { get; set; }
    public decimal? Importe { get; set; }
}

[ApiController, Route("api/trazabilidad"), Authorize(Roles = "admin,gestor")]
public class TrazabilidadController(KimarDbContext db) : ControllerBase
{
    // Las fechas UTC se convierten explícitamente a fecha comercial argentina.
    private IQueryable<EventoTrazabilidad> Eventos(Guid clienteId)
    {
        var pedidos = db.Pedidos.AsNoTracking().Where(x => x.ClienteId == clienteId).Select(x => new EventoTrazabilidad {
            Id = x.Id, Tipo = "pedido", Fecha = x.Fecha, Registro = x.FechaCreacion, Estado = x.Estado, Referencia = null, Importe = (decimal?)x.Items.Sum(i => i.Subtotal) });
        var ventas = db.Ventas.AsNoTracking().Where(x => x.ClienteId == clienteId);
        var altas = ventas.Select(x => new EventoTrazabilidad { Id = x.Id, Tipo = "venta", Fecha = DateOnly.FromDateTime(x.FechaCreacion.AddHours(-3)),
            Registro = x.FechaCreacion, Estado = x.Estado, Referencia = x.NroRemito, Importe = (decimal?)x.Total });
        var listos = ventas.Where(x => x.FechaListo != null).Select(x => new EventoTrazabilidad { Id = x.Id, Tipo = "preparacion",
            Fecha = DateOnly.FromDateTime(x.FechaListo!.Value.AddHours(-3)), Registro = x.FechaListo.Value, Estado = "listo", Referencia = x.NroRemito, Importe = null });
        var entregas = ventas.Where(x => x.FechaEntregado != null).Select(x => new EventoTrazabilidad { Id = x.Id, Tipo = "entrega",
            Fecha = DateOnly.FromDateTime(x.FechaEntregado!.Value.AddHours(-3)), Registro = x.FechaEntregado.Value, Estado = "entregado", Referencia = x.NroRemito, Importe = null });
        var fiscales = db.ComprobantesFiscales.AsNoTracking().Where(x => x.ClienteId == clienteId && x.VentaId != null && x.Estado != "borrador")
            .Select(x => new EventoTrazabilidad { Id = x.Id, Tipo = "comprobante", Fecha = x.Fecha, Registro = x.FechaCreacion,
                Estado = x.Estado, Referencia = null, Importe = (decimal?)x.Total });
        var pagos = db.PagosCliente.AsNoTracking().Where(x => x.ClienteId == clienteId).Select(x => new EventoTrazabilidad {
            Id = x.Id, Tipo = "pago", Fecha = x.Fecha, Registro = x.FechaCreacion, Estado = "registrado", Referencia = x.FormaPago, Importe = (decimal?)x.Monto });
        return pedidos.Concat(altas).Concat(listos).Concat(entregas).Concat(fiscales).Concat(pagos);
    }

    [HttpGet]
    public async Task<IActionResult> Listar(Guid clienteId, DateOnly? fechaDesde = null, DateOnly? fechaHasta = null, int pagina = 1)
    {
        var cliente = await db.Clientes.AsNoTracking().Where(x => x.Id == clienteId).Select(x => new { x.Id, x.Nombre, x.Cuit, x.Activo }).FirstOrDefaultAsync();
        if (cliente is null) return NotFound();
        var hasta = fechaHasta ?? FiscalRules.Hoy;
        var desde = fechaDesde ?? hasta.AddDays(-29);
        if (desde > hasta || pagina < 1) return BadRequest(new { error = "Revisá el período y la página solicitada." });
        var query = Eventos(clienteId).Where(x => x.Fecha >= desde && x.Fecha <= hasta);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(x => x.Fecha).ThenByDescending(x => x.Registro).ThenBy(x => x.Tipo).ThenBy(x => x.Id)
            .Skip((pagina - 1) * 50).Take(50).ToListAsync();
        await CompletarReferencias(items);
        return Ok(new { cliente, fechaDesde = desde, fechaHasta = hasta, pagina, total, items });
    }

    private async Task CompletarReferencias(List<EventoTrazabilidad> items)
    {
        var ids = items.Where(x => x.Tipo == "comprobante").Select(x => x.Id).ToList();
        var documentos = await db.ComprobantesFiscales.AsNoTracking().Where(x => ids.Contains(x.Id)).ToListAsync();
        foreach (var item in items.Where(x => x.Tipo == "comprobante"))
        {
            var c = documentos.Single(x => x.Id == item.Id);
            item.Referencia = $"{(c.Tipo == 3 ? "NC" : c.ReemplazaId != null ? "Factura de reemplazo" : "Factura")} A · {(c.Numero.HasValue ? $"{c.PuntoVenta:D5}-{c.Numero:D8}" : "Sin número autorizado")}";
        }
    }

    [HttpGet("{clienteId:guid}/{tipo}/{id:guid}")]
    public async Task<IActionResult> Detalle(Guid clienteId, string tipo, Guid id)
    {
        var evento = await Eventos(clienteId).FirstOrDefaultAsync(x => x.Tipo == tipo && x.Id == id);
        if (evento is null) return NotFound();
        object? detalle = null;
        Guid? ventaId = null, pedidoId = null;
        var ventaIds = new List<Guid>();
        if (tipo == "pedido")
        {
            var p = await db.Pedidos.AsNoTracking().Include(x => x.Items).Include(x => x.Venta).SingleAsync(x => x.Id == id);
            pedidoId = p.Id; ventaId = p.Venta?.Id;
            detalle = new { p.Observaciones, p.FechaEntrega, items = p.Items.Select(i => new { descripcion = i.ProductoNombre, i.Cantidad, precio = i.PrecioUnitario, i.Subtotal }) };
        }
        else if (tipo is "venta" or "preparacion" or "entrega")
        {
            var v = await db.Ventas.AsNoTracking().Include(x => x.Items).Include(x => x.Repartidor).SingleAsync(x => x.Id == id);
            ventaId = v.Id; pedidoId = v.PedidoId;
            detalle = new { v.Observaciones, v.FechaEntrega, v.HoraEntregaDesde, v.HoraEntregaHasta, v.EstadoEntrega, v.MedioEnvio,
                repartidor = v.Repartidor?.Nombre, v.NroFactura, v.NroRemito,
                items = v.Items.Select(i => new { descripcion = i.Descripcion, i.Cantidad, i.Unidad, precio = i.PrecioUnitario, i.Subtotal }) };
        }
        else if (tipo == "comprobante")
        {
            var c = await db.ComprobantesFiscales.AsNoTracking().SingleAsync(x => x.Id == id);
            ventaId = c.VentaId;
            detalle = FacturacionService.Map(c);
        }
        else if (tipo == "pago")
        {
            var p = await db.PagosCliente.AsNoTracking().Include(x => x.Imputaciones).ThenInclude(x => x.Cobranza).ThenInclude(x => x.Venta).SingleAsync(x => x.Id == id);
            ventaIds = p.Imputaciones.Where(x => x.Cobranza.VentaId != null).Select(x => x.Cobranza.VentaId!.Value).Distinct().ToList();
            detalle = new { p.Observaciones, p.FormaPago, imputaciones = p.Imputaciones.Select(i => new { i.Cobranza.VentaId, i.Monto, nroRemito = i.Cobranza.Venta?.NroRemito }) };
        }
        if (ventaId.HasValue) ventaIds.Add(ventaId.Value);
        // Cada relación se consulta por cliente para no mezclar operaciones ajenas.
        var pedidos = await db.Ventas.AsNoTracking().Where(x => x.ClienteId == clienteId && ventaIds.Contains(x.Id) && x.PedidoId != null).Select(x => x.PedidoId!.Value).ToListAsync();
        if (pedidoId.HasValue) pedidos.Add(pedidoId.Value);
        var fiscalIds = await db.ComprobantesFiscales.AsNoTracking().Where(x => x.ClienteId == clienteId && x.VentaId != null && ventaIds.Contains(x.VentaId.Value)).Select(x => x.Id).ToListAsync();
        var pagoIds = await db.PagosCliente.AsNoTracking().Where(x => x.ClienteId == clienteId && x.Imputaciones.Any(i => i.Cobranza.VentaId != null && ventaIds.Contains(i.Cobranza.VentaId.Value))).Select(x => x.Id).ToListAsync();
        var relacionados = await Eventos(clienteId).Where(x => (x.Tipo == "pedido" && pedidos.Contains(x.Id)) ||
            ((x.Tipo == "venta" || x.Tipo == "preparacion" || x.Tipo == "entrega") && ventaIds.Contains(x.Id)) ||
            (x.Tipo == "comprobante" && fiscalIds.Contains(x.Id)) || (x.Tipo == "pago" && pagoIds.Contains(x.Id)))
            .Where(x => x.Tipo != tipo || x.Id != id).OrderByDescending(x => x.Fecha).ThenBy(x => x.Tipo).ThenBy(x => x.Id).ToListAsync();
        await CompletarReferencias(relacionados);
        var entidadTipo = tipo == "pago" ? "PagoCliente" : "Venta";
        var entidadId = tipo == "pago" ? id : ventaId;
        var adjuntos = await db.Adjuntos.AsNoTracking().Where(x => x.EntidadTipo == entidadTipo && x.EntidadId == entidadId)
            .Select(x => new { x.Id, x.Nombre, x.ContentType }).ToListAsync();
        return Ok(new { evento, detalle, relacionados, adjuntos });
    }
}
