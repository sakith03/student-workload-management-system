namespace StudentWorkload.Domain.Modules.Groups.Entities;
 
public enum GroupRole { Owner = 1, Member = 2 }
 
public class GroupMember
{
    public Guid Id { get; private set; }
    public Guid GroupId { get; private set; }
    public Guid UserId { get; private set; }
    public GroupRole Role { get; private set; }
    public DateTime JoinedAt { get; private set; }
 
    private GroupMember() { }
 
    public static GroupMember Create(Guid groupId, Guid userId, GroupRole role = GroupRole.Member)
    {
        return new GroupMember
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            UserId = userId,
            Role = role,
            JoinedAt = DateTime.UtcNow
        };
    }
 
    public bool IsOwner => Role == GroupRole.Owner;
}
