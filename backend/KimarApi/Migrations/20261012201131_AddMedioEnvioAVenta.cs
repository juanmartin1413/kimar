using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMedioEnvioAVenta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MedioEnvio",
                table: "Ventas",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "reparto"); // ventas existentes: reparto propio
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MedioEnvio",
                table: "Ventas");
        }
    }
}
