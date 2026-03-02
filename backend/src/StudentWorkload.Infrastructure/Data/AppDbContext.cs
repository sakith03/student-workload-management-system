namespace StudentWorkload.Infrastructure.Data;

using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Users.Entities;
using StudentWorkload.Domain.Modules.Users.ValueObjects;

using StudentWorkload.Domain.Modules.CourseModules.Entities;
using StudentWorkload.Domain.Modules.Academic.Entities;
using StudentWorkload.Domain.Modules.Subjects.Entities;
using StudentWorkload.Domain.Modules.Groups.Entities;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = default!;
    public DbSet<CourseModule> CourseModules { get; set; } = default!;
    public DbSet<AcademicProfile> AcademicProfiles { get; set; } = default!;
    public DbSet<Subject> Subjects { get; set; } = default!;
    public DbSet<Group> Groups { get; set; } = default!;
    public DbSet<GroupMember> GroupMembers { get; set; } = default!;

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
                    v => Email.Create(v)
                )
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

        // ── CourseModule ──────────────────────────────────────────────────
        modelBuilder.Entity<CourseModule>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Id).ValueGeneratedNever();

            entity.Property(m => m.Name).IsRequired().HasMaxLength(120);
            entity.Property(m => m.Description).HasMaxLength(500);
            entity.Property(m => m.ColorTag).IsRequired().HasDefaultValue("Blue").HasMaxLength(50);
            entity.Property(m => m.TargetHoursPerWeek).HasColumnType("decimal(5,2)").IsRequired();
            entity.Property(m => m.Semester).IsRequired().HasMaxLength(20);

            entity.HasIndex(m => m.UserId);

            entity.HasOne<User>()
                  .WithMany()
                  .HasForeignKey(m => m.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable("modules");
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

            entity.ToTable("Subjects");
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

            entity.Property(g => g.MaxMembers).HasDefaultValue(6);
            entity.Property(g => g.IsActive).HasDefaultValue(true);

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

            entity.ToTable("GroupMembers");
        });
    }
}