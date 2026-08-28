using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class AddOrdenToProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Orden",
                table: "Productos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Backfill: deja los productos existentes ordenados alfabéticamente
            // hasta que alguien los reordene manualmente con drag&drop.
            migrationBuilder.Sql(@"
                WITH numerados AS (
                    SELECT ""Id"", ROW_NUMBER() OVER (ORDER BY ""Nombre"") - 1 AS rn
                    FROM ""Productos""
                )
                UPDATE ""Productos"" p
                SET ""Orden"" = n.rn
                FROM numerados n
                WHERE n.""Id"" = p.""Id"";
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Orden",
                table: "Productos");
        }
    }
}
