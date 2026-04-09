namespace StudentWorkload.API.Hubs;

using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;

[Authorize]
public class WhiteboardHub : Hub
{
    private readonly IGroupRepository _groupRepo;
    private readonly IGroupWhiteboardStateRepository _whiteboardRepo;

    public WhiteboardHub(IGroupRepository groupRepo, IGroupWhiteboardStateRepository whiteboardRepo)
    {
        _groupRepo = groupRepo;
        _whiteboardRepo = whiteboardRepo;
    }

    private Guid GetUserId()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userId, out var parsed) ? parsed : Guid.Empty;
    }

    private async Task<bool> CanAccessGroup(Guid groupId, Guid userId)
    {
        var group = await _groupRepo.GetByIdAsync(groupId);
        if (group is null || !group.IsActive) return false;
        if (group.CreatedByUserId == userId) return true;
        return await _groupRepo.IsUserMemberAsync(groupId, userId);
    }

    public async Task JoinWorkspace(Guid groupId)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty || !await CanAccessGroup(groupId, userId))
            throw new HubException("Forbidden");

        await Groups.AddToGroupAsync(Context.ConnectionId, groupId.ToString());
    }

    public async Task SendStroke(Guid groupId, WhiteboardStroke stroke)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty || !await CanAccessGroup(groupId, userId))
            throw new HubException("Forbidden");

        var state = await _whiteboardRepo.GetByGroupIdAsync(groupId);
        var strokes = string.IsNullOrWhiteSpace(state?.StateJson)
            ? new List<WhiteboardStroke>()
            : JsonSerializer.Deserialize<List<WhiteboardStroke>>(state.StateJson) ?? new List<WhiteboardStroke>();

        strokes.Add(stroke);
        var updatedJson = JsonSerializer.Serialize(strokes);

        if (state is null)
        {
            state = GroupWhiteboardState.Create(groupId, updatedJson);
            await _whiteboardRepo.AddAsync(state);
        }
        else
        {
            state.UpdateState(updatedJson);
        }

        await _whiteboardRepo.SaveChangesAsync();
        await Clients.Group(groupId.ToString()).SendAsync("strokeReceived", stroke);
    }

    public async Task ClearBoard(Guid groupId)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty || !await CanAccessGroup(groupId, userId))
            throw new HubException("Forbidden");

        var state = await _whiteboardRepo.GetByGroupIdAsync(groupId);
        if (state is null)
        {
            state = GroupWhiteboardState.Create(groupId, "[]");
            await _whiteboardRepo.AddAsync(state);
        }
        else
        {
            state.UpdateState("[]");
        }

        await _whiteboardRepo.SaveChangesAsync();
        await Clients.Group(groupId.ToString()).SendAsync("boardCleared");
    }

    public async Task ReplaceBoardState(Guid groupId, IEnumerable<WhiteboardStroke> strokes)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty || !await CanAccessGroup(groupId, userId))
            throw new HubException("Forbidden");

        var safeStrokes = strokes?.ToList() ?? new List<WhiteboardStroke>();
        var updatedJson = JsonSerializer.Serialize(safeStrokes);

        var state = await _whiteboardRepo.GetByGroupIdAsync(groupId);
        if (state is null)
        {
            state = GroupWhiteboardState.Create(groupId, updatedJson);
            await _whiteboardRepo.AddAsync(state);
        }
        else
        {
            state.UpdateState(updatedJson);
        }

        await _whiteboardRepo.SaveChangesAsync();
        await Clients.Group(groupId.ToString()).SendAsync("boardStateReplaced", safeStrokes);
    }
}

public record WhiteboardStroke(
    double FromX,
    double FromY,
    double ToX,
    double ToY,
    string Color,
    double LineWidth,
    double Alpha = 1);
