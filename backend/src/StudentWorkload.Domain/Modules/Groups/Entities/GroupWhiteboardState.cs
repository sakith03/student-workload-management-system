namespace StudentWorkload.Domain.Modules.Groups.Entities;

public class GroupWhiteboardState
{
    public Guid GroupId { get; private set; }
    public string StateJson { get; private set; } = "[]";
    public DateTime UpdatedAt { get; private set; }

    private GroupWhiteboardState() { }

    public static GroupWhiteboardState Create(Guid groupId, string? stateJson = null)
    {
        if (groupId == Guid.Empty)
            throw new ArgumentException("GroupId is required.", nameof(groupId));

        return new GroupWhiteboardState
        {
            GroupId = groupId,
            StateJson = string.IsNullOrWhiteSpace(stateJson) ? "[]" : stateJson,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void UpdateState(string stateJson)
    {
        StateJson = string.IsNullOrWhiteSpace(stateJson) ? "[]" : stateJson;
        UpdatedAt = DateTime.UtcNow;
    }
}
