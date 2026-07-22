using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCalidadToStockReal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CalidadId",
                table: "StockRealRegistrado",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockRealRegistrado_CalidadId",
                table: "StockRealRegistrado",
                column: "CalidadId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockRealRegistrado_Calidades_CalidadId",
                table: "StockRealRegistrado",
                column: "CalidadId",
                principalTable: "Calidades",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockRealRegistrado_Calidades_CalidadId",
                table: "StockRealRegistrado");

            migrationBuilder.DropIndex(
                name: "IX_StockRealRegistrado_CalidadId",
                table: "StockRealRegistrado");

            migrationBuilder.DropColumn(
                name: "CalidadId",
                table: "StockRealRegistrado");
        }
    }
}
