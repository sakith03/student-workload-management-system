namespace StudentWorkload.Domain.Modules.Chatbot.Entities;

public class ChatSession
{
    public Guid Id { get; private set; }
    public Guid GroupId { get; private set; }   // FK to Group
    public Guid UserId { get; private set; }    // FK to User (who started the session)
    public string ModuleName { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public bool IsActive { get; private set; }

    private ChatSession() { }

    public static ChatSession Create(Guid groupId, Guid userId, string moduleName)
    {
        if (groupId == Guid.Empty)
            throw new ArgumentException("GroupId is required.");
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId is required.");
        if (string.IsNullOrWhiteSpace(moduleName))
            throw new ArgumentException("Module name is required.");

        return new ChatSession
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            UserId = userId,
            ModuleName = moduleName.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
    }

    public void Deactivate() => IsActive = false;
}