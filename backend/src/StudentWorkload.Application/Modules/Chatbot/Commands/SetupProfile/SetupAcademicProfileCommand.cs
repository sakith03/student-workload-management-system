namespace StudentWorkload.Application.Modules.Academic.Commands.SetupProfile;

// ── Command ──────────────────────────────────────────────────────────────────
public record SetupAcademicProfileCommand(Guid UserId, int AcademicYear, int Semester);

// ── Result ───────────────────────────────────────────────────────────────────
public record SetupAcademicProfileResult(bool IsSuccess, Guid ProfileId, string? Error = null);