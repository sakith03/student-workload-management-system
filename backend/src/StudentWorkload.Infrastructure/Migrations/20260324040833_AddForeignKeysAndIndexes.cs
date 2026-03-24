using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentWorkload.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddForeignKeysAndIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Subjects_AcademicProfileId",
                table: "Subjects",
                column: "AcademicProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_UserId",
                table: "Subjects",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_CreatedByUserId",
                table: "Groups",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_SubjectId",
                table: "Groups",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_UserId",
                table: "GroupMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_InvitedByUserId",
                table: "GroupInvitations",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_InvitedEmail",
                table: "GroupInvitations",
                column: "InvitedEmail");

            migrationBuilder.AddForeignKey(
                name: "FK_AcademicProfiles_Users_UserId",
                table: "AcademicProfiles",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupInvitations_Groups_GroupId",
                table: "GroupInvitations",
                column: "GroupId",
                principalTable: "Groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupInvitations_Users_InvitedByUserId",
                table: "GroupInvitations",
                column: "InvitedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMembers_Groups_GroupId",
                table: "GroupMembers",
                column: "GroupId",
                principalTable: "Groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMembers_Users_UserId",
                table: "GroupMembers",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Groups_Subjects_SubjectId",
                table: "Groups",
                column: "SubjectId",
                principalTable: "Subjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Groups_Users_CreatedByUserId",
                table: "Groups",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Subjects_AcademicProfiles_AcademicProfileId",
                table: "Subjects",
                column: "AcademicProfileId",
                principalTable: "AcademicProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Subjects_Users_UserId",
                table: "Subjects",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AcademicProfiles_Users_UserId",
                table: "AcademicProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupInvitations_Groups_GroupId",
                table: "GroupInvitations");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupInvitations_Users_InvitedByUserId",
                table: "GroupInvitations");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMembers_Groups_GroupId",
                table: "GroupMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMembers_Users_UserId",
                table: "GroupMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_Groups_Subjects_SubjectId",
                table: "Groups");

            migrationBuilder.DropForeignKey(
                name: "FK_Groups_Users_CreatedByUserId",
                table: "Groups");

            migrationBuilder.DropForeignKey(
                name: "FK_Subjects_AcademicProfiles_AcademicProfileId",
                table: "Subjects");

            migrationBuilder.DropForeignKey(
                name: "FK_Subjects_Users_UserId",
                table: "Subjects");

            migrationBuilder.DropIndex(
                name: "IX_Subjects_AcademicProfileId",
                table: "Subjects");

            migrationBuilder.DropIndex(
                name: "IX_Subjects_UserId",
                table: "Subjects");

            migrationBuilder.DropIndex(
                name: "IX_Groups_CreatedByUserId",
                table: "Groups");

            migrationBuilder.DropIndex(
                name: "IX_Groups_SubjectId",
                table: "Groups");

            migrationBuilder.DropIndex(
                name: "IX_GroupMembers_UserId",
                table: "GroupMembers");

            migrationBuilder.DropIndex(
                name: "IX_GroupInvitations_InvitedByUserId",
                table: "GroupInvitations");

            migrationBuilder.DropIndex(
                name: "IX_GroupInvitations_InvitedEmail",
                table: "GroupInvitations");
        }
    }
}
