namespace StudentWorkload.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Domain.Modules.Users.Repositories;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupChatController : ControllerBase
{
    private readonly IGroupChatMessageRepository _chatRepo;
    private readonly IGroupRepository _groupRepo;
    private readonly IUserRepository _userRepo;

    public GroupChatController(
        IGroupChatMessageRepository chatRepo,
        IGroupRepository groupRepo,
        IUserRepository userRepo)
    {
        _chatRepo = chatRepo;
        _groupRepo = groupRepo;
        _userRepo = userRepo;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // ─── GET api/groupchat/{groupId}/messages ──────────────────────────
    // Returns all chat messages for the group, ordered by time.
    // Only accessible by group creator or member.
    [HttpGet("{groupId}/messages")]
    public async Task<IActionResult> GetMessages(Guid groupId)
    {
        var group = await _groupRepo.GetByIdAsync(groupId);
        if (group is null) return NotFound(new { message = "Group not found." });

        var userId = GetUserId();
        var isCreator = group.CreatedByUserId == userId;
        var isMember = !isCreator && await _groupRepo.IsUserMemberAsync(groupId, userId);

        if (!isCreator && !isMember)
            return Forbid();

        var messages = await _chatRepo.GetByGroupIdAsync(groupId);

        return Ok(new
        {
            groupId,
            messages = messages.Select(m => new
            {
                id = m.Id,
                senderUserId = m.SenderUserId,
                senderName = m.SenderName,
                messageText = m.MessageText,
                sentAt = m.SentAt
            })
        });
    }

    // ─── POST api/groupchat/{groupId}/messages ─────────────────────────
    // Send a new message to the group chat.
    // Only accessible by group creator or member.
    [HttpPost("{groupId}/messages")]
    public async Task<IActionResult> SendMessage(Guid groupId, [FromBody] SendGroupChatRequest? request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.MessageText))
            return BadRequest(new { message = "Message text is required." });

        var trimmed = request.MessageText.Trim();
        if (trimmed.Length > 4000)
            return BadRequest(new { message = "Message is too long (max 4000 characters)." });

        var group = await _groupRepo.GetByIdAsync(groupId);
        if (group is null) return NotFound(new { message = "Group not found." });

        var userId = GetUserId();
        var isCreator = group.CreatedByUserId == userId;
        var isMember = !isCreator && await _groupRepo.IsUserMemberAsync(groupId, userId);

        if (!isCreator && !isMember)
            return Forbid();

        // Get the sender's name
        var user = await _userRepo.GetByIdAsync(userId);
        var senderName = user is not null
            ? $"{user.FirstName} {user.LastName}"
            : "Unknown User";

        var message = GroupChatMessage.Create(groupId, userId, senderName, trimmed);
        await _chatRepo.AddAsync(message);
        await _chatRepo.SaveChangesAsync();

        return Ok(new
        {
            id = message.Id,
            senderUserId = message.SenderUserId,
            senderName = message.SenderName,
            messageText = message.MessageText,
            sentAt = message.SentAt
        });
    }
}

public record SendGroupChatRequest(string MessageText);
