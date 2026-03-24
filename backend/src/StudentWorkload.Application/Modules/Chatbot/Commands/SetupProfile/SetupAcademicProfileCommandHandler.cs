namespace StudentWorkload.Application.Modules.Academic.Commands.SetupProfile;

using StudentWorkload.Domain.Modules.Academic.Entities;
using StudentWorkload.Domain.Modules.Academic.Repositories;

public class SetupAcademicProfileCommandHandler
{
    private readonly IAcademicProfileRepository _profileRepo;

    public SetupAcademicProfileCommandHandler(IAcademicProfileRepository profileRepo)
        => _profileRepo = profileRepo;

    public async Task<SetupAcademicProfileResult> HandleAsync(
        SetupAcademicProfileCommand command,
        CancellationToken ct = default)
    {
        // If profile already exists, update it instead of creating a duplicate
        var existing = await _profileRepo.GetByUserIdAsync(command.UserId, ct);
        if (existing is not null)
        {
            try
            {
                existing.Update(command.AcademicYear, command.Semester);
                await _profileRepo.SaveChangesAsync(ct);
                return new SetupAcademicProfileResult(true, existing.Id);
            }
            catch (ArgumentException ex)
            {
                return new SetupAcademicProfileResult(false, Guid.Empty, ex.Message);
            }
        }

        try
        {
            var profile = AcademicProfile.Create(command.UserId, command.AcademicYear, command.Semester);
            await _profileRepo.AddAsync(profile, ct);
            await _profileRepo.SaveChangesAsync(ct);
            return new SetupAcademicProfileResult(true, profile.Id);
        }
        catch (ArgumentException ex)
        {
            return new SetupAcademicProfileResult(false, Guid.Empty, ex.Message);
        }
    }
}