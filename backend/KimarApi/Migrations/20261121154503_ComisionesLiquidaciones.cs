using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class ComisionesLiquidaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ComisionPorKg",
                table: "Vendedores",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unidad",
                table: "ItemsVenta",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ComisionDocumentos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    VendedorId = table.Column<Guid>(type: "uuid", nullable: false),
                    OperacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Huella = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    Creado = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrigenId = table.Column<Guid>(type: "uuid", nullable: true),
                    Comision = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Pago = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Compensado = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    FormaPago = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Referencia = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Motivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DatosJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComisionDocumentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComisionDocumentos_ComisionDocumentos_OrigenId",
                        column: x => x.OrigenId,
                        principalTable: "ComisionDocumentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComisionDocumentos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComisionDocumentos_Vendedores_VendedorId",
                        column: x => x.VendedorId,
                        principalTable: "Vendedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ComisionAplicaciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentoId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnticipoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Importe = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComisionAplicaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComisionAplicaciones_ComisionDocumentos_AnticipoId",
                        column: x => x.AnticipoId,
                        principalTable: "ComisionDocumentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComisionAplicaciones_ComisionDocumentos_DocumentoId",
                        column: x => x.DocumentoId,
                        principalTable: "ComisionDocumentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ComisionDetalles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentoId = table.Column<Guid>(type: "uuid", nullable: false),
                    VentaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Importe = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComisionDetalles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComisionDetalles_ComisionDocumentos_DocumentoId",
                        column: x => x.DocumentoId,
                        principalTable: "ComisionDocumentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComisionDetalles_Ventas_VentaId",
                        column: x => x.VentaId,
                        principalTable: "Ventas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComisionAplicaciones_AnticipoId",
                table: "ComisionAplicaciones",
                column: "AnticipoId");

            migrationBuilder.CreateIndex(
                name: "IX_ComisionAplicaciones_DocumentoId",
                table: "ComisionAplicaciones",
                column: "DocumentoId");

            migrationBuilder.CreateIndex(
                name: "IX_ComisionDetalles_DocumentoId",
                table: "ComisionDetalles",
                column: "DocumentoId");

            migrationBuilder.CreateIndex(
                name: "IX_ComisionDetalles_VentaId",
                table: "ComisionDetalles",
                column: "VentaId");

            migrationBuilder.CreateIndex(
                name: "IX_ComisionDocumentos_Numero",
                table: "ComisionDocumentos",
                column: "Numero",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ComisionDocumentos_OperacionId",
                table: "ComisionDocumentos",
                column: "OperacionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ComisionDocumentos_OrigenId",
                table: "ComisionDocumentos",
                column: "OrigenId");

            migrationBuilder.CreateIndex(
                name: "IX_ComisionDocumentos_UsuarioId",
                table: "ComisionDocumentos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ComisionDocumentos_VendedorId",
                table: "ComisionDocumentos",
                column: "VendedorId");
            migrationBuilder.Sql("""
                UPDATE "ItemsVenta" i SET "Unidad" = p."Unidad" FROM "Productos" p WHERE p."Id" = i."ProductoId";
                UPDATE "Vendedores" v SET "ComisionPorKg" = 500 FROM "Usuarios" u
                WHERE v."UsuarioId" = u."Id" AND lower(u."Email") IN ('luciano@kimarcompany.com.ar', 'manuel.gonzalez@kimarcompany.com.ar');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComisionAplicaciones");

            migrationBuilder.DropTable(
                name: "ComisionDetalles");

            migrationBuilder.DropTable(
                name: "ComisionDocumentos");

            migrationBuilder.DropColumn(
                name: "ComisionPorKg",
                table: "Vendedores");

            migrationBuilder.DropColumn(
                name: "Unidad",
                table: "ItemsVenta");
        }
    }
}
