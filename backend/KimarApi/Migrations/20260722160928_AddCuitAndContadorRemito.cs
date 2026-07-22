using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace KimarApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCuitAndContadorRemito : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cuit",
                table: "Clientes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ContadoresRemito",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Ultimo = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContadoresRemito", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ContadoresRemito",
                columns: new[] { "Id", "Ultimo" },
                values: new object[] { 1, 0L });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContadoresRemito");

            migrationBuilder.DropColumn(
                name: "Cuit",
                table: "Clientes");
        }
    }
}
