using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class AddFacturacionArca : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CreditoAplicado",
                table: "Ventas",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "EmitirFactura",
                table: "Ventas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "HuellaOperacion",
                table: "Ventas",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Iva",
                table: "Ventas",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "OperacionId",
                table: "Ventas",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CondicionIva",
                table: "Clientes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DomicilioFiscal",
                table: "Clientes",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RazonSocial",
                table: "Clientes",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequiereFactura",
                table: "Clientes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ComprobantesFiscales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VentaId = table.Column<Guid>(type: "uuid", nullable: true),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    EmisorId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Ambiente = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CuitEmisor = table.Column<string>(type: "character varying(11)", maxLength: 11, nullable: false),
                    PuntoVenta = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Numero = table.Column<long>(type: "bigint", nullable: true),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    Neto = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Iva = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Estado = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DatosJson = table.Column<string>(type: "text", nullable: false),
                    HuellaVenta = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ComprobanteOrigenId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReemplazaId = table.Column<Guid>(type: "uuid", nullable: true),
                    EfectoComercial = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Motivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Cae = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    VencimientoCae = table.Column<DateOnly>(type: "date", nullable: true),
                    ObservacionesArca = table.Column<string>(type: "text", nullable: true),
                    UltimoError = table.Column<string>(type: "text", nullable: true),
                    Intentos = table.Column<int>(type: "integer", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UltimoIntento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProximoIntento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AutorizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RutaPdf = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    HashPdf = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ErrorPdf = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComprobantesFiscales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComprobantesFiscales_Ventas_VentaId",
                        column: x => x.VentaId,
                        principalTable: "Ventas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IntentosFiscales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ComprobanteFiscalId = table.Column<Guid>(type: "uuid", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Numero = table.Column<long>(type: "bigint", nullable: true),
                    Resultado = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Detalle = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntentosFiscales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IntentosFiscales_ComprobantesFiscales_ComprobanteFiscalId",
                        column: x => x.ComprobanteFiscalId,
                        principalTable: "ComprobantesFiscales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_OperacionId",
                table: "Ventas",
                column: "OperacionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ComprobantesFiscales_Ambiente_CuitEmisor_PuntoVenta_Tipo_Nu~",
                table: "ComprobantesFiscales",
                columns: new[] { "Ambiente", "CuitEmisor", "PuntoVenta", "Tipo", "Numero" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ComprobantesFiscales_ComprobanteOrigenId",
                table: "ComprobantesFiscales",
                column: "ComprobanteOrigenId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ComprobantesFiscales_Estado_ProximoIntento",
                table: "ComprobantesFiscales",
                columns: new[] { "Estado", "ProximoIntento" });

            migrationBuilder.CreateIndex(
                name: "IX_ComprobantesFiscales_ReemplazaId",
                table: "ComprobantesFiscales",
                column: "ReemplazaId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ComprobantesFiscales_VentaId",
                table: "ComprobantesFiscales",
                column: "VentaId");

            migrationBuilder.CreateIndex(
                name: "IX_IntentosFiscales_ComprobanteFiscalId",
                table: "IntentosFiscales",
                column: "ComprobanteFiscalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IntentosFiscales");

            migrationBuilder.DropTable(
                name: "ComprobantesFiscales");

            migrationBuilder.DropIndex(
                name: "IX_Ventas_OperacionId",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "CreditoAplicado",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "EmitirFactura",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "HuellaOperacion",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "Iva",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "OperacionId",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "CondicionIva",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "DomicilioFiscal",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "RazonSocial",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "RequiereFactura",
                table: "Clientes");
        }
    }
}
