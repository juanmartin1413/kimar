using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCompraYFormaPagoProveedor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CompraId",
                table: "MovimientosStock",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FormaPagoReal",
                table: "CuotasProveedor",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MontoPagado",
                table: "CuotasProveedor",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CompraId",
                table: "CompromisosProveedor",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Adjuntos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EntidadTipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EntidadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RutaArchivo = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Adjuntos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Adjuntos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormasPagoProveedor",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProveedorId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaDesde = table.Column<DateOnly>(type: "date", nullable: false),
                    FechaHasta = table.Column<DateOnly>(type: "date", nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormasPagoProveedor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormasPagoProveedor_Proveedores_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "Proveedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Compras",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProveedorId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    FormaPagoProveedorId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaRecepcion = table.Column<DateOnly>(type: "date", nullable: false),
                    NroRemito = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NroFactura = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Compras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Compras_FormasPagoProveedor_FormaPagoProveedorId",
                        column: x => x.FormaPagoProveedorId,
                        principalTable: "FormasPagoProveedor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Compras_Proveedores_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "Proveedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Compras_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TramosPago",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FormaPagoProveedorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Orden = table.Column<int>(type: "integer", nullable: false),
                    Porcentaje = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DiasPlazo = table.Column<int>(type: "integer", nullable: false),
                    MetodoPago = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TramosPago", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TramosPago_FormasPagoProveedor_FormaPagoProveedorId",
                        column: x => x.FormaPagoProveedorId,
                        principalTable: "FormasPagoProveedor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ItemsCompra",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompraId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CalidadId = table.Column<Guid>(type: "uuid", nullable: true),
                    Cantidad = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Subtotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemsCompra", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemsCompra_Calidades_CalidadId",
                        column: x => x.CalidadId,
                        principalTable: "Calidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ItemsCompra_Compras_CompraId",
                        column: x => x.CompraId,
                        principalTable: "Compras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ItemsCompra_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_CompraId",
                table: "MovimientosStock",
                column: "CompraId");

            migrationBuilder.CreateIndex(
                name: "IX_CompromisosProveedor_CompraId",
                table: "CompromisosProveedor",
                column: "CompraId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Adjuntos_EntidadTipo_EntidadId",
                table: "Adjuntos",
                columns: new[] { "EntidadTipo", "EntidadId" });

            migrationBuilder.CreateIndex(
                name: "IX_Adjuntos_UsuarioId",
                table: "Adjuntos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_FormaPagoProveedorId",
                table: "Compras",
                column: "FormaPagoProveedorId");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_ProveedorId_FechaRecepcion",
                table: "Compras",
                columns: new[] { "ProveedorId", "FechaRecepcion" });

            migrationBuilder.CreateIndex(
                name: "IX_Compras_UsuarioId",
                table: "Compras",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_FormaPagoProveedor_ProveedorId_Vigente",
                table: "FormasPagoProveedor",
                column: "ProveedorId",
                unique: true,
                filter: "\"FechaHasta\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsCompra_CalidadId",
                table: "ItemsCompra",
                column: "CalidadId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsCompra_CompraId",
                table: "ItemsCompra",
                column: "CompraId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsCompra_ProductoId",
                table: "ItemsCompra",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_TramosPago_FormaPagoProveedorId",
                table: "TramosPago",
                column: "FormaPagoProveedorId");

            migrationBuilder.AddForeignKey(
                name: "FK_CompromisosProveedor_Compras_CompraId",
                table: "CompromisosProveedor",
                column: "CompraId",
                principalTable: "Compras",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientosStock_Compras_CompraId",
                table: "MovimientosStock",
                column: "CompraId",
                principalTable: "Compras",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CompromisosProveedor_Compras_CompraId",
                table: "CompromisosProveedor");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientosStock_Compras_CompraId",
                table: "MovimientosStock");

            migrationBuilder.DropTable(
                name: "Adjuntos");

            migrationBuilder.DropTable(
                name: "ItemsCompra");

            migrationBuilder.DropTable(
                name: "TramosPago");

            migrationBuilder.DropTable(
                name: "Compras");

            migrationBuilder.DropTable(
                name: "FormasPagoProveedor");

            migrationBuilder.DropIndex(
                name: "IX_MovimientosStock_CompraId",
                table: "MovimientosStock");

            migrationBuilder.DropIndex(
                name: "IX_CompromisosProveedor_CompraId",
                table: "CompromisosProveedor");

            migrationBuilder.DropColumn(
                name: "CompraId",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "FormaPagoReal",
                table: "CuotasProveedor");

            migrationBuilder.DropColumn(
                name: "MontoPagado",
                table: "CuotasProveedor");

            migrationBuilder.DropColumn(
                name: "CompraId",
                table: "CompromisosProveedor");
        }
    }
}
