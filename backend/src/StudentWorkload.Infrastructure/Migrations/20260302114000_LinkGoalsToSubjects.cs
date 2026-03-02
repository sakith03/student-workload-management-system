using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentWorkload.Infrastructure.Migrations
{
    public partial class LinkGoalsToSubjects : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SubjectId",
                table: "modules",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_modules_SubjectId",
                table: "modules",
                column: "SubjectId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_modules_SubjectId",
                table: "modules");

            migrationBuilder.DropColumn(
                name: "SubjectId",
                table: "modules");
        }
    }
}
