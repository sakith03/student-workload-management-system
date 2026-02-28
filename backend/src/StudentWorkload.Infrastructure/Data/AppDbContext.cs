namespace StudentWorkload.Infrastructure.Data;
 
using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Users.Entities;
using StudentWorkload.Domain.Modules.Users.Enums;
using StudentWorkload.Domain.Modules.Users.ValueObjects;
 
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
 
    public DbSet<User> Users { get; set; }
 
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
    }
}
