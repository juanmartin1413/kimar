using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCalidadProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StockPorProducto_ProductoId",
                table: "StockPorProducto");

            migrationBuilder.AddColumn<Guid>(
                name: "CalidadId",
                table: "StockPorProducto",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CalidadId",
                table: "MovimientosStock",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CalidadId",
                table: "ItemsVenta",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Calidades",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Calidades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Calidades_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StockPorProducto_CalidadId",
                table: "StockPorProducto",
                column: "CalidadId");

            migrationBuilder.CreateIndex(
                name: "IX_StockPorProducto_ProductoId_CalidadId",
                table: "StockPorProducto",
                columns: new[] { "ProductoId", "CalidadId" },
                unique: true,
                filter: "\"CalidadId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_StockPorProducto_ProductoId_SinCalidad",
                table: "StockPorProducto",
                column: "ProductoId",
                unique: true,
                filter: "\"CalidadId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_CalidadId",
                table: "MovimientosStock",
                column: "CalidadId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsVenta_CalidadId",
                table: "ItemsVenta",
                column: "CalidadId");

            migrationBuilder.CreateIndex(
                name: "IX_Calidades_ProductoId",
                table: "Calidades",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_Calidades_ProductoId_Nombre",
                table: "Calidades",
                columns: new[] { "ProductoId", "Nombre" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ItemsVenta_Calidades_CalidadId",
                table: "ItemsVenta",
                column: "CalidadId",
                principalTable: "Calidades",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientosStock_Calidades_CalidadId",
                table: "MovimientosStock",
                column: "CalidadId",
                principalTable: "Calidades",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_StockPorProducto_Calidades_CalidadId",
                table: "StockPorProducto",
                column: "CalidadId",
                principalTable: "Calidades",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ItemsVenta_Calidades_CalidadId",
                table: "ItemsVenta");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientosStock_Calidades_CalidadId",
                table: "MovimientosStock");

            migrationBuilder.DropForeignKey(
                name: "FK_StockPorProducto_Calidades_CalidadId",
                table: "StockPorProducto");

            migrationBuilder.DropTable(
                name: "Calidades");

            migrationBuilder.DropIndex(
                name: "IX_StockPorProducto_CalidadId",
                table: "StockPorProducto");

            migrationBuilder.DropIndex(
                name: "IX_StockPorProducto_ProductoId_CalidadId",
                table: "StockPorProducto");

            migrationBuilder.DropIndex(
                name: "IX_StockPorProducto_ProductoId_SinCalidad",
                table: "StockPorProducto");

            migrationBuilder.DropIndex(
                name: "IX_MovimientosStock_CalidadId",
                table: "MovimientosStock");

            migrationBuilder.DropIndex(
                name: "IX_ItemsVenta_CalidadId",
                table: "ItemsVenta");

            migrationBuilder.DropColumn(
                name: "CalidadId",
                table: "StockPorProducto");

            migrationBuilder.DropColumn(
                name: "CalidadId",
                table: "MovimientosStock");

            migrationBuilder.DropColumn(
                name: "CalidadId",
                table: "ItemsVenta");

            migrationBuilder.CreateIndex(
                name: "IX_StockPorProducto_ProductoId",
                table: "StockPorProducto",
                column: "ProductoId",
                unique: true);
        }
    }
}
