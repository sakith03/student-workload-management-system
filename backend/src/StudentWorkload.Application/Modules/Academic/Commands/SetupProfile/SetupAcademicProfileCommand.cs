namespace StudentWorkload.Application.Modules.Academic.Commands.SetupProfile;
public record SetupAcademicProfileCommand(Guid UserId, int AcademicYear, int Semester);
