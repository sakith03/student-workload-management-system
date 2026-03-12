namespace StudentWorkload.Application.Modules.CourseModules.DTOs;

public class CourseModuleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ColorTag { get; set; } = string.Empty;
    public decimal TargetHoursPerWeek { get; set; }
    public string Semester { get; set; } = string.Empty;
    public Guid? SubjectId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
