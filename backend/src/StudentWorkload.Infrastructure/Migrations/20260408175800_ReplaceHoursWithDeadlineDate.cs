using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentWorkload.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceHoursWithDeadlineDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetHoursPerWeek",
                table: "modules");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeadlineDate",
                table: "modules",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeadlineDate",
                table: "modules");

            migrationBuilder.AddColumn<decimal>(
                name: "TargetHoursPerWeek",
                table: "modules",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
