namespace StudentWorkload.Application.Modules.Groups.Commands.CreateGroup;
public record CreateGroupCommand(
    Guid SubjectId, Guid CreatedByUserId, string Name, string Description, int MaxMembers);
