namespace StudentWorkload.Domain.Modules.Subjects.Entities;
 
public class Subject
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }         // Owner (student)
    public Guid AcademicProfileId { get; private set; }
    public string Code { get; private set; } = null!;         // e.g. "CSP6001"
    public string Name { get; private set; } = null!;         // e.g. "Cloud Systems Programming"
    public int CreditHours { get; private set; }     // e.g. 3
    public string Color { get; private set; } = null!;        // UI display color hex
    public DateTime CreatedAt { get; private set; }
    public bool IsActive { get; private set; }
 
    private Subject() { }
 
    private static readonly string[] DefaultColors = {
        "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
        "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"
    };
 
    private static readonly Random _rng = new();
 
    public static Subject Create(
        Guid userId,
        Guid academicProfileId,
        string code,
        string name,
        int creditHours,
        string? color = null)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Module code is required.");
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Module name is required.");
        if (creditHours < 1 || creditHours > 6)
            throw new ArgumentException("Credit hours must be between 1 and 6.");
 
        return new Subject
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AcademicProfileId = academicProfileId,
            Code = code.Trim().ToUpper(),
            Name = name.Trim(),
            CreditHours = creditHours,
            Color = color ?? DefaultColors[_rng.Next(DefaultColors.Length)],
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
    }
}
