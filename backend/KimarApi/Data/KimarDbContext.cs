using Microsoft.EntityFrameworkCore;
using KimarApi.Models.Entities;

namespace KimarApi.Data;

public class KimarDbContext(DbContextOptions<KimarDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Vendedor> Vendedores => Set<Vendedor>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<ItemPedido> ItemsPedido => Set<ItemPedido>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<ItemVenta> ItemsVenta => Set<ItemVenta>();
    public DbSet<Cobranza> Cobranzas => Set<Cobranza>();
    public DbSet<CompromisoProv> CompromisosProveedor => Set<CompromisoProv>();
    public DbSet<CuotaProv> CuotasProveedor => Set<CuotaProv>();
    public DbSet<ProductoProveedor> ProductosProveedores => Set<ProductoProveedor>();
    public DbSet<MovimientoStock> MovimientosStock => Set<MovimientoStock>();
    public DbSet<StockPorProducto> StockPorProducto => Set<StockPorProducto>();
    public DbSet<StockRealRegistrado> StockRealRegistrado => Set<StockRealRegistrado>();
    public DbSet<Calidad> Calidades => Set<Calidad>();
    public DbSet<GastoFijo> GastosFijos => Set<GastoFijo>();
    public DbSet<InstanciaGasto> InstanciasGasto => Set<InstanciaGasto>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        base.OnModelCreating(model);

        // Unique constraints
        model.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();

        // StockPorProducto: antes 1 fila por producto (unique en ProductoId). Ahora puede haber
        // varias filas por producto cuando tiene variantes de Calidad. Postgres no colapsa NULLs
        // en un índice único compuesto, así que se modela con dos índices únicos parciales:
        // - a lo sumo 1 fila "sin calidad" (CalidadId IS NULL) por producto (comportamiento de siempre)
        // - a lo sumo 1 fila por (producto, calidad) cuando CalidadId no es null
        model.Entity<StockPorProducto>()
            .HasIndex(s => s.ProductoId)
            .HasDatabaseName("IX_StockPorProducto_ProductoId_SinCalidad")
            .HasFilter("\"CalidadId\" IS NULL")
            .IsUnique();

        model.Entity<StockPorProducto>()
            .HasIndex(s => new { s.ProductoId, s.CalidadId })
            .HasDatabaseName("IX_StockPorProducto_ProductoId_CalidadId")
            .HasFilter("\"CalidadId\" IS NOT NULL")
            .IsUnique();

        model.Entity<Calidad>().HasIndex(c => new { c.ProductoId, c.Nombre }).IsUnique();
        model.Entity<Calidad>().HasIndex(c => c.ProductoId);

        // Performance indexes
        model.Entity<Cliente>().HasIndex(c => c.VendedorId);
        model.Entity<Pedido>().HasIndex(p => new { p.ClienteId, p.VendedorId });
        model.Entity<Pedido>().HasIndex(p => p.Estado);
        model.Entity<Venta>().HasIndex(v => new { v.ClienteId, v.Estado });
        model.Entity<Cobranza>().HasIndex(c => new { c.VentaId, c.Estado });
        model.Entity<MovimientoStock>().HasIndex(m => new { m.ProductoId, m.Fecha });

        // Precision for money fields
        foreach (var prop in model.Model.GetEntityTypes()
            .SelectMany(e => e.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            prop.SetPrecision(18);
            prop.SetScale(2);
        }

        // Avoid cascade delete cycles
        model.Entity<Venta>()
            .HasOne(v => v.Pedido)
            .WithOne(p => p.Venta)
            .HasForeignKey<Venta>(v => v.PedidoId)
            .OnDelete(DeleteBehavior.SetNull);

        model.Entity<MovimientoStock>()
            .HasOne(m => m.Venta)
            .WithMany(v => v.MovimientosStock)
            .HasForeignKey(m => m.VentaId)
            .OnDelete(DeleteBehavior.SetNull);

        model.Entity<MovimientoStock>()
            .HasOne(m => m.Proveedor)
            .WithMany(p => p.MovimientosStock)
            .HasForeignKey(m => m.ProveedorId)
            .OnDelete(DeleteBehavior.SetNull);

        model.Entity<Cobranza>()
            .HasOne(c => c.Venta)
            .WithMany(v => v.Cobranzas)
            .HasForeignKey(c => c.VentaId)
            .OnDelete(DeleteBehavior.SetNull);

        model.Entity<StockPorProducto>()
            .HasOne(s => s.Calidad)
            .WithMany(c => c.Stocks)
            .HasForeignKey(s => s.CalidadId)
            .OnDelete(DeleteBehavior.SetNull);

        model.Entity<MovimientoStock>()
            .HasOne(m => m.Calidad)
            .WithMany(c => c.Movimientos)
            .HasForeignKey(m => m.CalidadId)
            .OnDelete(DeleteBehavior.SetNull);

        model.Entity<ItemVenta>()
            .HasOne(i => i.Calidad)
            .WithMany(c => c.ItemsVenta)
            .HasForeignKey(i => i.CalidadId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
