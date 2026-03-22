namespace StudentWorkload.Domain.Modules.Users.Entities;
 
using StudentWorkload.Domain.Modules.Users.Enums;
using StudentWorkload.Domain.Modules.Users.ValueObjects;
 
public class User
{
    // Private setters enforce encapsulation — only this class can change its state
    public Guid Id { get; private set; }
    public Email Email { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public string FirstName { get; private set; } = null!;
    public string LastName { get; private set; } = null!;
    public UserRole Role { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public bool IsActive { get; private set; }
 
    // EF Core requires a parameterless constructor (keep private)
    private User() { }
 
    // Factory method — the ONLY way to create a valid User
    // This ensures all business rules are applied at creation
    public static User Create(
        string email,
        string passwordHash,
        string firstName,
        string lastName,
        UserRole role = UserRole.Student)
    {
        // Validate inputs — throw domain exceptions for invalid data
        ArgumentException.ThrowIfNullOrEmpty(firstName, nameof(firstName));
        ArgumentException.ThrowIfNullOrEmpty(lastName, nameof(lastName));
        ArgumentException.ThrowIfNullOrEmpty(passwordHash, nameof(passwordHash));
 
        return new User
        {
            Id = Guid.NewGuid(),
            Email = Email.Create(email), // Value Object validates email format
            PasswordHash = passwordHash,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Role = role,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
    }
 
    // Domain behaviors — actions the User entity can perform
    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
    public string FullName => $"{FirstName} {LastName}";
}
