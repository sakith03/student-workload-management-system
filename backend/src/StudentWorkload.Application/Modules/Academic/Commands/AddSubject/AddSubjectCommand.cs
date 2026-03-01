namespace StudentWorkload.Application.Modules.Academic.Commands.AddSubject;
public record AddSubjectCommand(
    Guid UserId, Guid AcademicProfileId, string Code, string Name, int CreditHours, string? Color);
