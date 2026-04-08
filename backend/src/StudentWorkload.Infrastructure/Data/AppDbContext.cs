namespace StudentWorkload.Infrastructure.Data;

using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Users.Entities;
using StudentWorkload.Domain.Modules.Users.ValueObjects;
using StudentWorkload.Domain.Modules.CourseModules.Entities;
using StudentWorkload.Domain.Modules.Academic.Entities;
using StudentWorkload.Domain.Modules.Subjects.Entities;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Chatbot.Entities;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = default!;
    public DbSet<CourseModule> CourseModules { get; set; } = default!;
    public DbSet<AcademicProfile> AcademicProfiles { get; set; } = default!;
    public DbSet<Subject> Subjects { get; set; } = default!;
    public DbSet<Group> Groups { get; set; } = default!;
    public DbSet<GroupMember> GroupMembers { get; set; } = default!;
    public DbSet<GroupInvitation> GroupInvitations { get; set; } = default!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = default!;
    public DbSet<ChatSession> ChatSessions { get; set; } = default!;
    public DbSet<GroupChatMessage> GroupChatMessages { get; set; } = default!;
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── User ──────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).ValueGeneratedNever();

            entity.Property(u => u.Email)
                .HasConversion(
                    v => v.Value,
                    v => Email.Create(v))
                .HasMaxLength(255)
                .IsRequired();

            entity.HasIndex(u => u.Email).IsUnique();

            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.Role).HasConversion<int>();
            entity.Property(u => u.CreatedAt).IsRequired();
            entity.Property(u => u.IsActive).IsRequired().HasDefaultValue(true);

            entity.ToTable("Users");
        });

        // ── AcademicProfile ───────────────────────────────────────────────
        modelBuilder.Entity<AcademicProfile>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.UserId).IsRequired();

            entity.HasIndex(a => a.UserId).IsUnique();

            entity.Property(a => a.AcademicYear).IsRequired();
            entity.Property(a => a.Semester).IsRequired();
            entity.Property(a => a.IsSetupComplete).HasDefaultValue(false);

            // ✅ NEW: Real FK constraint — profile is owned by exactly one user.
            // Cascade: deleting a user removes their profile too.
            entity.HasOne<User>()
                .WithOne()
                .HasForeignKey<AcademicProfile>(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable("AcademicProfiles");
        });

        // ── Subject ───────────────────────────────────────────────────────
        modelBuilder.Entity<Subject>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.UserId).IsRequired();

            entity.Property(s => s.Code).IsRequired().HasMaxLength(20);
            entity.Property(s => s.Name).IsRequired().HasMaxLength(200);
            entity.Property(s => s.CreditHours).IsRequired();
            entity.Property(s => s.Color).HasMaxLength(10);
            entity.Property(s => s.IsActive).HasDefaultValue(true);

            // ✅ NEW: FK to AcademicProfile.
            // Restrict: you cannot delete a profile that still has subjects.
            // This protects the academic record from accidental data loss.
            entity.HasOne<AcademicProfile>()
                .WithMany()
                .HasForeignKey(s => s.AcademicProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            // ✅ NEW: FK to User.
            // Restrict (not Cascade) here to avoid the SQL Server "multiple cascade
            // paths" error — User already cascades to AcademicProfile which cascades
            // to Subject. Two cascade routes from the same parent table are rejected
            // by SQL Server. Restrict is safe; user deletion is handled explicitly.
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.ToTable("Subjects");
        });

        // ── CourseModule ──────────────────────────────────────────────────
        // No changes here — FK to Users already existed in the original migration.
        modelBuilder.Entity<CourseModule>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Id).ValueGeneratedNever();

            entity.Property(m => m.Name).IsRequired().HasMaxLength(120);
            entity.Property(m => m.Description).HasMaxLength(500);
            entity.Property(m => m.ColorTag).IsRequired().HasDefaultValue("Blue").HasMaxLength(50);
            entity.Property(m => m.DeadlineDate).IsRequired(false);
            entity.Property(m => m.Semester).IsRequired().HasMaxLength(20);
            entity.Property(m => m.SubjectId).IsRequired(false);

            // ── AI extraction fields ──
            entity.Property(m => m.StepByStepGuidance)
                .HasColumnType("NVARCHAR(MAX)")
                .IsRequired(false);

            entity.Property(m => m.StepCompletions)
                .HasColumnType("NVARCHAR(MAX)")
                .IsRequired(false);

            entity.Property(m => m.SubmissionGuidelines)
                .HasMaxLength(2000)
                .IsRequired(false);

            entity.HasIndex(m => m.UserId);
            entity.HasIndex(m => m.SubjectId);

            entity.HasOne<User>()
                  .WithMany()
                  .HasForeignKey(m => m.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable("modules");
        });

        // ── Group ─────────────────────────────────────────────────────────
        modelBuilder.Entity<Group>(entity =>
        {
            entity.HasKey(g => g.Id);

            entity.Property(g => g.SubjectId).IsRequired();
            entity.Property(g => g.CreatedByUserId).IsRequired();
            entity.Property(g => g.Name).IsRequired().HasMaxLength(100);
            entity.Property(g => g.Description).HasMaxLength(500);
            entity.Property(g => g.InviteCode).IsRequired().HasMaxLength(10);

            entity.HasIndex(g => g.InviteCode).IsUnique();

            // ✅ NEW: Index on CreatedByUserId — used by GetMyGroups() on every
            // workspaces page load. Without this it's a full table scan.
            entity.HasIndex(g => g.CreatedByUserId);

            entity.Property(g => g.MaxMembers).HasDefaultValue(6);
            entity.Property(g => g.IsActive).HasDefaultValue(true);

            // ✅ NEW: FK to Subject (Restrict — preserve group history if subject removed)
            entity.HasOne<Subject>()
                .WithMany()
                .HasForeignKey(g => g.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);

            // ✅ NEW: FK to User as creator (Restrict — can't delete a user who owns groups)
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(g => g.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.ToTable("Groups");
        });

        // ── GroupMember ───────────────────────────────────────────────────
        modelBuilder.Entity<GroupMember>(entity =>
        {
            entity.HasKey(gm => gm.Id);

            entity.Property(gm => gm.GroupId).IsRequired();
            entity.Property(gm => gm.UserId).IsRequired();
            entity.Property(gm => gm.Role).HasConversion<int>();

            entity.HasIndex(gm => new { gm.GroupId, gm.UserId }).IsUnique();

            // ✅ NEW: FK to Group (Cascade — remove memberships when a group is deleted)
            entity.HasOne<Group>()
                .WithMany()
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ NEW: FK to User (Restrict — forces explicit membership cleanup before
            // a user can be deleted. Prevents silent orphaned data.)
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(gm => gm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.ToTable("GroupMembers");
        });

        // ── GroupInvitation ───────────────────────────────────────────────
        modelBuilder.Entity<GroupInvitation>(entity =>
        {
            entity.HasKey(i => i.Id);

            entity.Property(i => i.GroupId).IsRequired();
            entity.Property(i => i.InvitedByUserId).IsRequired();
            entity.Property(i => i.InvitedEmail).IsRequired().HasMaxLength(255);
            entity.Property(i => i.Token).IsRequired().HasMaxLength(64);
            entity.Property(i => i.Status).HasConversion<int>();
            entity.Property(i => i.ExpiresAt).IsRequired();
            entity.Property(i => i.CreatedAt).IsRequired();

            entity.HasIndex(i => i.Token).IsUnique();
            entity.HasIndex(i => new { i.GroupId, i.InvitedEmail });

            // ✅ NEW: Standalone index on InvitedEmail — used by HasPendingInvitationAsync()
            // which checks for duplicate invites on every send. This makes it fast.
            entity.HasIndex(i => i.InvitedEmail);

            // ✅ NEW: FK to Group (Cascade — invitations are cleaned up when group is deleted)
            entity.HasOne<Group>()
                .WithMany()
                .HasForeignKey(i => i.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ NEW: FK to User as inviter (Restrict — preserves invitation audit trail)
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(i => i.InvitedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.ToTable("GroupInvitations");
        });

        modelBuilder.Entity<ChatSession>(entity =>
{
    entity.HasKey(s => s.Id);
    entity.Property(s => s.Id).ValueGeneratedNever();
 
    entity.Property(s => s.GroupId).IsRequired();
    entity.Property(s => s.UserId).IsRequired();
    entity.Property(s => s.ModuleName).IsRequired().HasMaxLength(200);
    entity.Property(s => s.CreatedAt).IsRequired();
    entity.Property(s => s.IsActive).HasDefaultValue(true);
 
    entity.HasIndex(s => s.GroupId);
 
    entity.HasOne<Group>()
          .WithMany()
          .HasForeignKey(s => s.GroupId)
          .OnDelete(DeleteBehavior.Cascade);
 
    entity.ToTable("ChatSessions");
});
 
modelBuilder.Entity<ChatMessage>(entity =>
{
    entity.HasKey(m => m.Id);
    entity.Property(m => m.Id).ValueGeneratedNever();
 
    entity.Property(m => m.SessionId).IsRequired();
    entity.Property(m => m.Sender).IsRequired().HasMaxLength(10);  // "user" or "ai"
    entity.Property(m => m.MessageText).IsRequired().HasColumnType("TEXT");
    entity.Property(m => m.SentAt).IsRequired();
 
    entity.HasIndex(m => m.SessionId);
 
    entity.HasOne<ChatSession>()
          .WithMany()
          .HasForeignKey(m => m.SessionId)
          .OnDelete(DeleteBehavior.Cascade);
 
    entity.ToTable("ChatMessages");
});

        // ── GroupChatMessage ──────────────────────────────────────────────
        modelBuilder.Entity<GroupChatMessage>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Id).ValueGeneratedNever();

            entity.Property(m => m.GroupId).IsRequired();
            entity.Property(m => m.SenderUserId).IsRequired();
            entity.Property(m => m.SenderName).IsRequired().HasMaxLength(200);
            entity.Property(m => m.MessageText).IsRequired().HasColumnType("NVARCHAR(MAX)");
            entity.Property(m => m.SentAt).IsRequired();

            entity.HasIndex(m => new { m.GroupId, m.SentAt });

            entity.HasOne<Group>()
                  .WithMany()
                  .HasForeignKey(m => m.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable("GroupChatMessages");
        });
    }
}