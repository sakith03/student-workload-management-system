namespace StudentWorkload.Application.Modules.Goals.DTOs;

/// <summary>
/// What we return to the frontend after proxying the document through n8n + Gemini.
/// Maps directly from the n8n response JSON array element.
/// </summary>
public class ParsedGoalResponseDto
{
    // ── Extraction metadata ───────────────────────────────────────────────────
    public string? FileName             { get; set; }
    public string  ExtractionStatus     { get; set; } = "unknown";
    public int     ExtractionPercentage { get; set; }
    public int     FieldsExtracted      { get; set; }

    // ── Extracted content ─────────────────────────────────────────────────────
    public string?       Name                  { get; set; }
    public string?       DueDate               { get; set; }
    public string?       Description           { get; set; }
    public string?       SemesterTag           { get; set; }
    public List<string>? StepByStepGuidance    { get; set; }
    public string?       SubmissionGuidelines  { get; set; }
}