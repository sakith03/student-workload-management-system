namespace StudentWorkload.Application.Modules.Academic.Commands.AddSubject;
 
using StudentWorkload.Domain.Modules.Subjects.Entities;
using StudentWorkload.Domain.Modules.Subjects.Repositories;
 
public class AddSubjectCommandHandler
{
    private readonly ISubjectRepository _repo;
    public AddSubjectCommandHandler(ISubjectRepository repo) => _repo = repo;
 
    public async Task<AddSubjectResult> HandleAsync(AddSubjectCommand cmd, CancellationToken ct = default)
    {
        var subject = Subject.Create(
            cmd.UserId, cmd.AcademicProfileId,
            cmd.Code, cmd.Name, cmd.CreditHours, cmd.Color);
 
        await _repo.AddAsync(subject, ct);
        await _repo.SaveChangesAsync(ct);
 
        return new AddSubjectResult(true, subject.Id, subject.Code, subject.Name, subject.Color);
    }
}
 
public record AddSubjectResult(bool IsSuccess, Guid? SubjectId, string? Code, string? Name, string? Color);
