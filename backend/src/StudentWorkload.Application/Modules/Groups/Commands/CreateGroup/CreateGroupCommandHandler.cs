namespace StudentWorkload.Application.Modules.Groups.Commands.CreateGroup;
 
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
 
public class CreateGroupCommandHandler
{
    private readonly IGroupRepository _repo;
    public CreateGroupCommandHandler(IGroupRepository repo) => _repo = repo;
 
    public async Task<CreateGroupResult> HandleAsync(
        CreateGroupCommand cmd, CancellationToken ct = default)
    {
        var group = Group.Create(
            cmd.SubjectId, 
            cmd.CreatedByUserId,
            cmd.Name, 
            cmd.Description,
            cmd.MaxMembers);
        
        var member = GroupMember.Create(
            group.Id, 
            cmd.CreatedByUserId,
            GroupRole.Owner);
            
 
        await _repo.AddAsync(group, ct);
        await _repo.AddMemberAsync(member, ct);
        await _repo.SaveChangesAsync(ct);
 
        // InviteCode is stored in DB — teammate's join feature will use it
        return new CreateGroupResult(true, group.Id, group.InviteCode, null);
    }
}
 
public record CreateGroupResult(bool IsSuccess, Guid? GroupId, string? InviteCode, string? Error);
