namespace StudentWorkload.Application.Modules.Academic.Commands.AddSubject;

using StudentWorkload.Domain.Modules.Subjects.Entities;
using StudentWorkload.Domain.Modules.Subjects.Repositories;

public class AddSubjectCommandHandler
{
    private readonly ISubjectRepository _subjectRepo;

    public AddSubjectCommandHandler(ISubjectRepository subjectRepo)
        => _subjectRepo = subjectRepo;

    public async Task<AddSubjectResult> HandleAsync(
        AddSubjectCommand command,
        CancellationToken ct = default)
    {
        var subject = Subject.Create(
            command.UserId,
            command.AcademicProfileId,
            command.Code,
            command.Name,
            command.CreditHours,
            command.Color);

        await _subjectRepo.AddAsync(subject, ct);
        await _subjectRepo.SaveChangesAsync(ct);

        return new AddSubjectResult(subject.Id, subject.Code, subject.Name, subject.Color);
    }
}