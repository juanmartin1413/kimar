using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/gastos")]
[Authorize(Roles = "admin,gestor")]
public class GastosController(KimarDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.GastosFijos
            .Where(g => g.Activo)
            .Select(g => new GastoFijoDto(g.Id, g.Nombre, g.Descripcion, g.Monto, g.Tipo, g.DiaPago, g.Activo, g.FechaCreacion))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGastoFijoRequest req)
    {
        var gasto = new GastoFijo
        {
            Nombre = req.Nombre,
            Descripcion = req.Descripcion,
            Monto = req.Monto,
            Tipo = req.Tipo,
            DiaPago = req.DiaPago
        };
        db.GastosFijos.Add(gasto);

        if (req.Tipo == "mensual")
        {
            var now = DateTime.UtcNow;
            db.InstanciasGasto.Add(new InstanciaGasto
            {
                GastoFijoId = gasto.Id,
                Mes = now.Month,
                Anio = now.Year,
                Monto = req.Monto,
                FechaVencimiento = req.DiaPago.HasValue
                    ? new DateOnly(now.Year, now.Month, req.DiaPago.Value)
                    : null
            });
        }

        await db.SaveChangesAsync();
        return Ok(new GastoFijoDto(gasto.Id, gasto.Nombre, gasto.Descripcion, gasto.Monto, gasto.Tipo, gasto.DiaPago, gasto.Activo, gasto.FechaCreacion));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGastoFijoRequest req)
    {
        var g = await db.GastosFijos.FindAsync(id);
        if (g is null) return NotFound();
        if (req.Nombre is not null) g.Nombre = req.Nombre;
        if (req.Descripcion is not null) g.Descripcion = req.Descripcion;
        if (req.Monto.HasValue) g.Monto = req.Monto.Value;
        if (req.DiaPago.HasValue) g.DiaPago = req.DiaPago;
        if (req.Activo.HasValue) g.Activo = req.Activo.Value;
        await db.SaveChangesAsync();
        return Ok(new GastoFijoDto(g.Id, g.Nombre, g.Descripcion, g.Monto, g.Tipo, g.DiaPago, g.Activo, g.FechaCreacion));
    }

    [HttpGet("instancias")]
    public async Task<IActionResult> GetInstancias([FromQuery] int? mes, [FromQuery] int? anio)
    {
        var query = db.InstanciasGasto.Include(i => i.GastoFijo).AsQueryable();
        if (mes.HasValue) query = query.Where(i => i.Mes == mes.Value);
        if (anio.HasValue) query = query.Where(i => i.Anio == anio.Value);
        var list = await query.OrderBy(i => i.Anio).ThenBy(i => i.Mes).ToListAsync();
        return Ok(list.Select(i => new InstanciaGastoDto(
            i.Id, i.GastoFijoId, i.GastoFijo?.Nombre ?? "", i.Mes, i.Anio, i.Monto,
            i.FechaVencimiento, i.Pagado, i.FechaPago, i.FechaCreacion)));
    }

    [HttpPost("instancias/{id}/pagar")]
    public async Task<IActionResult> PagarInstancia(Guid id)
    {
        var inst = await db.InstanciasGasto.FindAsync(id);
        if (inst is null) return NotFound();
        inst.Pagado = true;
        inst.FechaPago = DateOnly.FromDateTime(DateTime.UtcNow);
        await db.SaveChangesAsync();
        return Ok(new { id = inst.Id, pagado = true });
    }

    [HttpPost("generar-mensuales")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GenerarMensuales([FromQuery] int? mes, [FromQuery] int? anio)
    {
        var now = DateTime.UtcNow;
        var m = mes ?? now.Month;
        var a = anio ?? now.Year;

        var gastosMensuales = await db.GastosFijos
            .Where(g => g.Activo && g.Tipo == "mensual")
            .ToListAsync();

        var existentes = await db.InstanciasGasto
            .Where(i => i.Mes == m && i.Anio == a)
            .Select(i => i.GastoFijoId)
            .ToListAsync();

        var nuevas = gastosMensuales
            .Where(g => !existentes.Contains(g.Id))
            .Select(g => new InstanciaGasto
            {
                GastoFijoId = g.Id,
                Mes = m,
                Anio = a,
                Monto = g.Monto,
                FechaVencimiento = g.DiaPago.HasValue ? new DateOnly(a, m, g.DiaPago.Value) : null
            })
            .ToList();

        if (nuevas.Count > 0)
        {
            db.InstanciasGasto.AddRange(nuevas);
            await db.SaveChangesAsync();
        }

        return Ok(new { generadas = nuevas.Count, mes = m, anio = a });
    }
}
