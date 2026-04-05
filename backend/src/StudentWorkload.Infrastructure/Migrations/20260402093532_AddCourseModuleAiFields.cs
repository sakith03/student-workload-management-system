using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentWorkload.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseModuleAiFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StepByStepGuidance",
                table: "modules",
                type: "NVARCHAR(MAX)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubmissionGuidelines",
                table: "modules",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StepByStepGuidance",
                table: "modules");

            migrationBuilder.DropColumn(
                name: "SubmissionGuidelines",
                table: "modules");
        }
    }
}
