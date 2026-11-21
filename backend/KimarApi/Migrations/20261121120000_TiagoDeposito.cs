using KimarApi.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace KimarApi.Migrations;

[DbContext(typeof(KimarDbContext))]
[Migration("20261121120000_TiagoDeposito")]
public class TiagoDeposito : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        UPDATE "Usuarios" SET "Rol" = 'deposito'
        WHERE lower("Email") = 'tiago.lopez@kimarcompany.com.ar';
        """);

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        UPDATE "Usuarios" SET "Rol" = 'vendedor'
        WHERE lower("Email") = 'tiago.lopez@kimarcompany.com.ar' AND "Rol" = 'deposito';
        """);
}
