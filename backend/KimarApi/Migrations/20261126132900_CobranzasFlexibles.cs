using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class CobranzasFlexibles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DiasPlazoPago",
                table: "Ventas",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "HoraEntregaDesde",
                table: "Ventas",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "HoraEntregaHasta",
                table: "Ventas",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "FechaEntrega",
                table: "Pedidos",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<TimeOnly>(
                name: "HoraEntregaDesde",
                table: "Pedidos",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "HoraEntregaHasta",
                table: "Pedidos",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DiasPlazoPago",
                table: "Clientes",
                type: "integer",
                nullable: false,
                defaultValue: 15);

            migrationBuilder.CreateTable(
                name: "PagosCliente",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OperacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Huella = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    FormaPago = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PagosCliente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PagosCliente_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PagosCliente_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ImputacionesPago",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PagoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CobranzaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImputacionesPago", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImputacionesPago_Cobranzas_CobranzaId",
                        column: x => x.CobranzaId,
                        principalTable: "Cobranzas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ImputacionesPago_PagosCliente_PagoId",
                        column: x => x.PagoId,
                        principalTable: "PagosCliente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImputacionesPago_CobranzaId",
                table: "ImputacionesPago",
                column: "CobranzaId");

            migrationBuilder.CreateIndex(
                name: "IX_ImputacionesPago_PagoId_CobranzaId",
                table: "ImputacionesPago",
                columns: new[] { "PagoId", "CobranzaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PagosCliente_ClienteId",
                table: "PagosCliente",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosCliente_OperacionId",
                table: "PagosCliente",
                column: "OperacionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PagosCliente_UsuarioId",
                table: "PagosCliente",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ImputacionesPago");

            migrationBuilder.DropTable(
                name: "PagosCliente");

            migrationBuilder.DropColumn(
                name: "DiasPlazoPago",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "HoraEntregaDesde",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "HoraEntregaHasta",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "FechaEntrega",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "HoraEntregaDesde",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "HoraEntregaHasta",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "DiasPlazoPago",
                table: "Clientes");
        }
    }
}
