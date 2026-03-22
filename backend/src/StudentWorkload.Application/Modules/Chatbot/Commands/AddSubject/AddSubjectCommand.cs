namespace StudentWorkload.Application.Modules.Academic.Commands.AddSubject;

// ── Command ──────────────────────────────────────────────────────────────────
public record AddSubjectCommand(
    Guid UserId,
    Guid AcademicProfileId,
    string Code,
    string Name,
    int CreditHours,
    string? Color);

// ── Result ───────────────────────────────────────────────────────────────────
public record AddSubjectResult(bool IsSuccess, Guid SubjectId, string Code, string Name, string Color);