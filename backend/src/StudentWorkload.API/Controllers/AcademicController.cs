namespace StudentWorkload.API.Controllers;
 
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using StudentWorkload.Application.Modules.Academic.Commands.SetupProfile;
using StudentWorkload.Application.Modules.Academic.Commands.AddSubject;
using StudentWorkload.Domain.Modules.Academic.Repositories;
using StudentWorkload.Domain.Modules.Subjects.Repositories;
 
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AcademicController : ControllerBase
{
    private readonly IAcademicProfileRepository _profileRepo;
    private readonly ISubjectRepository _subjectRepo;
 
    public AcademicController(
        IAcademicProfileRepository profileRepo,
        ISubjectRepository subjectRepo)
    {
        _profileRepo = profileRepo;
        _subjectRepo = subjectRepo;
    }
 
    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
 
    // POST api/academic/profile/setup
    [HttpPost("profile/setup")]
    public async Task<IActionResult> SetupProfile([FromBody] SetupProfileRequest request)
    {
        var handler = new SetupAcademicProfileCommandHandler(_profileRepo);
        var result = await handler.HandleAsync(
            new SetupAcademicProfileCommand(GetUserId(), request.AcademicYear, request.Semester));
 
        if (!result.IsSuccess) return BadRequest(new { message = result.Error });
        return Ok(new { profileId = result.ProfileId, message = "Academic profile saved." });
    }
 
    // GET api/academic/profile
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await _profileRepo.GetByUserIdAsync(GetUserId());
        if (profile is null) return NotFound(new { message = "Profile not set up yet." });
        return Ok(new {
            profile.AcademicYear,
            profile.Semester,
            profile.IsSetupComplete
        });
    }
 
    // POST api/academic/subjects
    [HttpPost("subjects")]
    public async Task<IActionResult> AddSubject([FromBody] AddSubjectRequest request)
    {
        var profile = await _profileRepo.GetByUserIdAsync(GetUserId());
        if (profile is null)
            return BadRequest(new { message = "Set up your academic profile first." });
 
        var handler = new AddSubjectCommandHandler(_subjectRepo);
        var result = await handler.HandleAsync(new AddSubjectCommand(
            GetUserId(), profile.Id,
            request.Code, request.Name, request.CreditHours, request.Color));
 
        return CreatedAtAction(nameof(GetSubjects), new { },
            new { subjectId = result.SubjectId, code = result.Code, name = result.Name, color = result.Color });
    }
 
    // GET api/academic/subjects
    [HttpGet("subjects")]
    public async Task<IActionResult> GetSubjects()
    {
        var subjects = await _subjectRepo.GetByUserIdAsync(GetUserId());
        return Ok(subjects.Select(s => new {
            s.Id, s.Code, s.Name, s.CreditHours, s.Color, s.CreatedAt
        }));
    }
}
 
public record SetupProfileRequest(int AcademicYear, int Semester);
public record AddSubjectRequest(string Code, string Name, int CreditHours, string? Color);
