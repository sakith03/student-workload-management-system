namespace StudentWorkload.API.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;

[ApiController]
[Route("api/groups/{groupId}/files")]
[Authorize]
public class GroupFilesController : ControllerBase
{
    private readonly IGroupRepository _groupRepo;
    private readonly IGroupSharedFileRepository _sharedFileRepo;
    private readonly ILogger<GroupFilesController> _logger;

    public GroupFilesController(
        IGroupRepository groupRepo,
        IGroupSharedFileRepository sharedFileRepo,
        ILogger<GroupFilesController> logger)
    {
        _groupRepo = groupRepo;
        _sharedFileRepo = sharedFileRepo;
        _logger = logger;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private async Task<bool> CanAccessGroup(Guid groupId, Guid userId)
    {
        var group = await _groupRepo.GetByIdAsync(groupId);
        if (group is null || !group.IsActive) return false;
        if (group.CreatedByUserId == userId) return true;
        return await _groupRepo.IsUserMemberAsync(groupId, userId);
    }

    private string GetStorageRoot()
    {
        // Allow explicit override in Docker/K8s via env var.
        var configuredPath = Environment.GetEnvironmentVariable("WORKSPACE_FILES_PATH");
        if (!string.IsNullOrWhiteSpace(configuredPath))
            return configuredPath;

        // Temp path is writable in Linux containers (/tmp) and local dev.
        return Path.Combine(Path.GetTempPath(), "studentworkload-workspace-files");
    }

    [HttpGet]
    public async Task<IActionResult> ListFiles(Guid groupId)
    {
        if (!await CanAccessGroup(groupId, GetUserId()))
            return Forbid();

        var files = await _sharedFileRepo.GetByGroupIdAsync(groupId);
        return Ok(new
        {
            groupId,
            files = files.Select(f => new
            {
                id = f.Id,
                fileName = f.OriginalFileName,
                contentType = f.ContentType,
                sizeBytes = f.SizeBytes,
                uploadedAt = f.UploadedAt,
                uploadedByUserId = f.UploadedByUserId
            })
        });
    }

    [HttpPost]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> Upload(Guid groupId, [FromForm] IFormFile? file)
    {
        var userId = GetUserId();
        if (!await CanAccessGroup(groupId, userId))
            return Forbid();

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "File is required." });

        var safeOriginalName = Path.GetFileName(file.FileName);
        var fileId = Guid.NewGuid();
        var extension = Path.GetExtension(safeOriginalName);
        var storedName = $"{fileId}{extension}";

        // Use ContentRootPath to avoid permission issues with runtime/bin folders.
        var storageRoot = GetStorageRoot();
        var groupFolder = Path.Combine(storageRoot, groupId.ToString());
        var storedPath = Path.Combine(groupFolder, storedName);

        try
        {
            Directory.CreateDirectory(groupFolder);

            await using (var stream = System.IO.File.Create(storedPath))
            {
                await file.CopyToAsync(stream);
            }

            var sharedFile = GroupSharedFile.Create(
                groupId,
                userId,
                safeOriginalName,
                storedName,
                file.ContentType,
                file.Length
            );

            await _sharedFileRepo.AddAsync(sharedFile);
            await _sharedFileRepo.SaveChangesAsync();

            return Ok(new
            {
                id = sharedFile.Id,
                fileName = sharedFile.OriginalFileName,
                contentType = sharedFile.ContentType,
                sizeBytes = sharedFile.SizeBytes,
                uploadedAt = sharedFile.UploadedAt,
                uploadedByUserId = sharedFile.UploadedByUserId
            });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Failed to save shared file metadata for group {GroupId}", groupId);
            return StatusCode(500, new { message = "Failed to save file metadata. Ensure latest DB migrations are applied." });
        }
        catch (IOException ex)
        {
            _logger.LogError(ex, "Failed to write shared file content for group {GroupId}", groupId);
            return StatusCode(500, new { message = "Failed to write uploaded file to server storage." });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogError(ex, "No permission for shared-file storage path for group {GroupId}", groupId);
            return StatusCode(500, new { message = "Server has no permission to write uploaded files." });
        }
    }

    [HttpGet("{fileId}/download")]
    public async Task<IActionResult> Download(Guid groupId, Guid fileId)
    {
        if (!await CanAccessGroup(groupId, GetUserId()))
            return Forbid();

        var file = await _sharedFileRepo.GetByIdAsync(fileId);
        if (file is null || file.GroupId != groupId)
            return NotFound();

        var path = Path.Combine(GetStorageRoot(), groupId.ToString(), file.StoredFileName);
        if (!System.IO.File.Exists(path))
            return NotFound(new { message = "File contents not found on server." });

        var bytes = await System.IO.File.ReadAllBytesAsync(path);
        return File(bytes, file.ContentType, file.OriginalFileName);
    }
}
