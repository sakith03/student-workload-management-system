using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentWorkload.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDeadlineDateAndStepCompletions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the old hours-per-week column
            migrationBuilder.DropColumn(
                name: "TargetHoursPerWeek",
                table: "modules");

            // Add deadline date
            migrationBuilder.AddColumn<DateTime>(
                name: "DeadlineDate",
                table: "modules",
                type: "datetime2",
                nullable: true);

            // Add step completions (JSON bool array)
            migrationBuilder.AddColumn<string>(
                name: "StepCompletions",
                table: "modules",
                type: "NVARCHAR(MAX)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeadlineDate",
                table: "modules");

            migrationBuilder.DropColumn(
                name: "StepCompletions",
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
