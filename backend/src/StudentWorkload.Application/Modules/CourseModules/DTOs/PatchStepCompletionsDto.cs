using System.ComponentModel.DataAnnotations;

namespace StudentWorkload.Application.Modules.CourseModules.DTOs;

public class PatchStepCompletionsDto
{
    [Required]
    public List<bool> Completions { get; set; } = [];
}
