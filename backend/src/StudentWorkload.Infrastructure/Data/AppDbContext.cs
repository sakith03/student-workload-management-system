namespace StudentWorkload.Infrastructure.Data;
 
using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Users.Entities;
using StudentWorkload.Domain.Modules.Users.Enums;
using StudentWorkload.Domain.Modules.Users.ValueObjects;
using StudentWorkload.Domain.Modules.CourseModules.Entities;
 
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
 
    public DbSet<User> Users { get; set; }
    public DbSet<CourseModule> CourseModules { get; set; }
 
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
 
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).ValueGeneratedNever(); 
 
            // Map the Email Value Object to a column
            entity.Property(u => u.Email)
                .HasConversion(
                    v => v.Value,           // Store as string
                    v => Email.Create(v)    // Load as Value Object
                )
                .HasMaxLength(255)
                .IsRequired();
 
            entity.HasIndex(u => u.Email).IsUnique(); // Enforce unique email
 
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.Role).HasConversion<int>(); // Store enum as int
            entity.Property(u => u.CreatedAt).IsRequired();
            entity.Property(u => u.IsActive).IsRequired().HasDefaultValue(true);

            entity.ToTable("Users");
        });

        modelBuilder.Entity<CourseModule>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Id).ValueGeneratedNever();
            
            entity.Property(m => m.Name).IsRequired().HasMaxLength(120);
            entity.Property(m => m.Description).HasMaxLength(500); // optional mapping
            entity.Property(m => m.ColorTag).IsRequired().HasDefaultValue("Blue").HasMaxLength(50);
            entity.Property(m => m.TargetHoursPerWeek).HasColumnType("decimal(5,2)").IsRequired();
            entity.Property(m => m.Semester).IsRequired().HasMaxLength(20);

            // Add index for faster reads by user id
            entity.HasIndex(m => m.UserId);
            
            // Assuming no navigation property right now from user to course modules (to keep it clean) or we can specify it if it existed.
            // A simple Foreign key mapping is sufficient.
            entity.HasOne<User>()
                  .WithMany() // User hasn't a list of CourseModules explicitly in its class
                  .HasForeignKey(m => m.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable("modules");
        });
    }
}
