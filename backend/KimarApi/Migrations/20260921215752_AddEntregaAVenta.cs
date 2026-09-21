using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class AddEntregaAVenta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EstadoEntrega",
                table: "Ventas",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "pendiente"); // backfill: las ventas existentes quedan "en preparación"

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEntregado",
                table: "Ventas",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaListo",
                table: "Ventas",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RepartidorId",
                table: "Ventas",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_EstadoEntrega_RepartidorId",
                table: "Ventas",
                columns: new[] { "EstadoEntrega", "RepartidorId" });

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_FechaEntrega",
                table: "Ventas",
                column: "FechaEntrega");

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_RepartidorId",
                table: "Ventas",
                column: "RepartidorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Ventas_Usuarios_RepartidorId",
                table: "Ventas",
                column: "RepartidorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ventas_Usuarios_RepartidorId",
                table: "Ventas");

            migrationBuilder.DropIndex(
                name: "IX_Ventas_EstadoEntrega_RepartidorId",
                table: "Ventas");

            migrationBuilder.DropIndex(
                name: "IX_Ventas_FechaEntrega",
                table: "Ventas");

            migrationBuilder.DropIndex(
                name: "IX_Ventas_RepartidorId",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "EstadoEntrega",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "FechaEntregado",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "FechaListo",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "RepartidorId",
                table: "Ventas");
        }
    }
}
