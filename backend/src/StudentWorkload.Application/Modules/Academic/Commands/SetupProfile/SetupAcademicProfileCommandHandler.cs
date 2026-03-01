namespace StudentWorkload.Application.Modules.Academic.Commands.SetupProfile;
 
using StudentWorkload.Domain.Modules.Academic.Entities;
using StudentWorkload.Domain.Modules.Academic.Repositories;
 
public class SetupAcademicProfileCommandHandler
{
    private readonly IAcademicProfileRepository _repo;
    public SetupAcademicProfileCommandHandler(IAcademicProfileRepository repo) => _repo = repo;
 
    public async Task<SetupProfileResult> HandleAsync(
        SetupAcademicProfileCommand cmd, CancellationToken ct = default)
    {
        // If profile already exists, update it instead of creating a new one
        var existing = await _repo.GetByUserIdAsync(cmd.UserId, ct);
        if (existing is not null)
        {
            existing.Update(cmd.AcademicYear, cmd.Semester);
            await _repo.SaveChangesAsync(ct);
            return SetupProfileResult.Success(existing.Id);
        }
 
        var profile = AcademicProfile.Create(cmd.UserId, cmd.AcademicYear, cmd.Semester);
        await _repo.AddAsync(profile, ct);
        await _repo.SaveChangesAsync(ct);
        return SetupProfileResult.Success(profile.Id);
    }
}
 
public record SetupProfileResult
{
    public bool IsSuccess { get; init; }
    public Guid? ProfileId { get; init; }
    public string? Error { get; init; }
    public static SetupProfileResult Success(Guid id) => new() { IsSuccess = true, ProfileId = id };
    public static SetupProfileResult Failure(string err) => new() { IsSuccess = false, Error = err };
}
