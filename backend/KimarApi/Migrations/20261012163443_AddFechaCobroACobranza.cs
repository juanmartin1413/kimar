using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class AddFechaCobroACobranza : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "FechaCobro",
                table: "Cobranzas",
                type: "date",
                nullable: true);

            // Backfill: las cobranzas ya cobradas no registraban cuándo se cobraron; se usa la fecha
            // planificada como mejor aproximación disponible. Desde ahora Cobrar graba la fecha real.
            migrationBuilder.Sql(@"
                UPDATE ""Cobranzas""
                SET ""FechaCobro"" = ""Fecha""
                WHERE ""Estado"" = 'cobrado' AND ""FechaCobro"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaCobro",
                table: "Cobranzas");
        }
    }
}
