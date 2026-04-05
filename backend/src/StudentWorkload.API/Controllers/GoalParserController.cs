namespace StudentWorkload.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;
using StudentWorkload.Application.Modules.Goals.DTOs;

[ApiController]
[Route("api/goals")]
[Authorize]
public class GoalParserController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration     _config;

    public GoalParserController(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _config            = config;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    /// <summary>
    /// Accepts a PDF or DOCX, forwards it to the n8n AI pipeline,
    /// and returns structured goal data for pre-filling the form.
    /// </summary>
    [HttpPost("parse-document")]
    [RequestSizeLimit(10_485_760)]                         // 10 MB
    [RequestFormLimits(MultipartBodyLengthLimit = 10_485_760)]
    public async Task<IActionResult> ParseDocument(
        [FromForm]  IFormFile file,
        [FromQuery] Guid?     subjectId,
        CancellationToken     cancellationToken)
    {
        // ── 1. Validate the uploaded file ─────────────────────────────────────
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded. Please select a PDF or DOCX file." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed   = new[] { ".pdf", ".doc", ".docx" };

        if (!allowed.Contains(extension))
            return BadRequest(new
            {
                message = $"'{extension}' is not supported. Please upload a PDF or DOCX file."
            });

        if (file.Length > 10_485_760)
            return BadRequest(new { message = "File exceeds the 10 MB limit." });

        // ── 2. Build the n8n webhook URL with query params ────────────────────
        var n8nBase = _config["N8n:BaseUrl"] ?? "http://localhost:5678";
        var userId  = GetUserId();

        var queryParts = new List<string> { $"userId={userId}" };
        if (subjectId.HasValue) queryParts.Add($"subjectId={subjectId.Value}");

        var n8nUrl = $"{n8nBase}/webhook/parse-assignment?{string.Join("&", queryParts)}";

        // ── 3. Stream file to n8n as multipart/form-data ─────────────────────
        var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(120); // n8n + Gemini can take a while

        using var multipart = new MultipartFormDataContent();
        await using var stream = file.OpenReadStream();

        var streamContent = new StreamContent(stream);
        streamContent.Headers.ContentType =
            new System.Net.Http.Headers.MediaTypeHeaderValue(
                file.ContentType ?? "application/octet-stream");

        multipart.Add(streamContent, "file", file.FileName);

        HttpResponseMessage n8nResponse;
        try
        {
            n8nResponse = await httpClient.PostAsync(n8nUrl, multipart, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(503, new
            {
                message = "AI processing service is unavailable. Please ensure n8n is running.",
                detail  = ex.Message
            });
        }
        catch (TaskCanceledException)
        {
            return StatusCode(504, new
            {
                message = "AI processing timed out. The document may be too complex. Please try again."
            });
        }

        // ── 4. Handle non-success from n8n ────────────────────────────────────
        if (!n8nResponse.IsSuccessStatusCode)
        {
            var errBody = await n8nResponse.Content.ReadAsStringAsync(cancellationToken);
            return StatusCode(502, new
            {
                message = "AI processing failed. Please check the document and try again.",
                detail  = errBody.Length > 300 ? errBody[..300] : errBody
            });
        }

        // ── 5. Parse n8n response — it returns an ARRAY: [{...}] ─────────────
        var json = await n8nResponse.Content.ReadAsStringAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(json))
            return StatusCode(422, new { message = "AI service returned an empty response." });

        JsonElement itemEl;
        try
        {
            using var doc  = JsonDocument.Parse(json);
            var       root = doc.RootElement;

            itemEl = root.ValueKind == JsonValueKind.Array
                ? (root.GetArrayLength() == 0
                    ? throw new InvalidOperationException("Empty array")
                    : root[0].Clone())
                : root.Clone();
        }
        catch (Exception ex)
        {
            return StatusCode(422, new
            {
                message = "Could not parse the AI response.",
                detail  = ex.Message
            });
        }

        // ── 6. Map to our clean DTO ───────────────────────────────────────────
        var result = MapN8nToDto(itemEl, file.FileName);
        return Ok(result);
    }

    // ── Private mapping helpers ───────────────────────────────────────────────

    private static ParsedGoalResponseDto MapN8nToDto(JsonElement item, string fallbackName)
    {
        var dto = new ParsedGoalResponseDto
        {
            FileName             = GetStr(item, "fileName") ?? fallbackName,
            ExtractionStatus     = GetStr(item, "extractionStatus") ?? "unknown",
            ExtractionPercentage = GetInt(item, "extractionPercentage"),
            FieldsExtracted      = GetInt(item, "fieldsExtracted")
        };

        if (!item.TryGetProperty("extractedData", out var data))
            return dto;

        dto.Name                 = GetNullStr(data, "name");
        dto.DueDate              = GetNullStr(data, "dueDate");
        dto.Description          = GetNullStr(data, "description");
        dto.SemesterTag          = GetNullStr(data, "semesterTag");
        dto.SubmissionGuidelines = GetNullStr(data, "submissionGuidelines");

        if (data.TryGetProperty("stepByStepGuidance", out var steps) &&
            steps.ValueKind == JsonValueKind.Array)
        {
            dto.StepByStepGuidance = steps
                .EnumerateArray()
                .Where(s => s.ValueKind == JsonValueKind.String)
                .Select(s => s.GetString()!)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();
        }

        return dto;
    }

    private static string? GetStr(JsonElement el, string key) =>
        el.TryGetProperty(key, out var p) && p.ValueKind == JsonValueKind.String
            ? p.GetString() : null;

    private static string? GetNullStr(JsonElement el, string key)
    {
        if (!el.TryGetProperty(key, out var p)) return null;
        return p.ValueKind == JsonValueKind.Null ? null : p.GetString();
    }

    private static int GetInt(JsonElement el, string key) =>
        el.TryGetProperty(key, out var p) && p.ValueKind == JsonValueKind.Number
            ? p.GetInt32() : 0;
}