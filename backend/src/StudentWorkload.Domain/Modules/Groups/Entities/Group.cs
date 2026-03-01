namespace StudentWorkload.Domain.Modules.Groups.Entities;
 
public class Group
{
    public Guid Id { get; private set; }
    // Subject to which this group belongs (a subject is the finer-grained class/module)
    public Guid SubjectId { get; private set; }
    // User who created the group (for permission checks)
    public Guid CreatedByUserId { get; private set; }
    public string Name { get; private set; }         // e.g. "Team Alpha"
    public string Description { get; private set; }
    public string InviteCode { get; private set; }   // Short code to join
    public int MaxMembers { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public bool IsActive { get; private set; }
 
    private Group() { }
 
    public static Group Create(Guid subjectId, Guid createdByUserId, string name, string description, int maxMembers = 6)
    {
        if (subjectId == Guid.Empty)
            throw new ArgumentException("SubjectId must be provided.", nameof(subjectId));
        if (createdByUserId == Guid.Empty)
            throw new ArgumentException("CreatedByUserId must be provided.", nameof(createdByUserId));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Group name is required.");
        if (maxMembers < 2 || maxMembers > 10)
            throw new ArgumentException("Max members must be between 2 and 10.");
 
        return new Group
        {
            Id = Guid.NewGuid(),
            SubjectId = subjectId,
            CreatedByUserId = createdByUserId,
            Name = name.Trim(),
            Description = description?.Trim() ?? string.Empty,
            InviteCode = GenerateInviteCode(),
            MaxMembers = maxMembers,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
    }
 
    private static string GenerateInviteCode()
    {
        // Generates a 6-character alphanumeric code e.g. "X7K2PQ"
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = new Random();
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[rng.Next(chars.Length)]).ToArray());
    }
}
