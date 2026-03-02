// FILE PATH:
// backend/src/StudentWorkload.API/Controllers/InvitationsController.cs

namespace StudentWorkload.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using StudentWorkload.Application.Modules.Groups.Commands.SendInvitation;
using StudentWorkload.Application.Modules.Groups.Commands.AcceptInvitation;
using StudentWorkload.Application.Common.Interfaces;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Domain.Modules.Users.Repositories;
using Microsoft.Extensions.Configuration;

[ApiController]
[Route("api/[controller]")]
public class InvitationsController : ControllerBase
{
    private readonly IGroupRepository _groupRepo;
    private readonly IGroupInvitationRepository _invitationRepo;
    private readonly IUserRepository _userRepo;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;

    public InvitationsController(
        IGroupRepository groupRepo,
        IGroupInvitationRepository invitationRepo,
        IUserRepository userRepo,
        IEmailService emailService,
        IConfiguration config)
    {
        _groupRepo = groupRepo;
        _invitationRepo = invitationRepo;
        _userRepo = userRepo;
        _emailService = emailService;
        _config = config;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // ─── POST api/invitations  ───────────────────────────────────────────
    // Authenticated group member sends invitation to an email
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> SendInvitation([FromBody] SendInvitationRequest request)
    {
        var frontendUrl = _config["AppSettings:FrontendBaseUrl"]
                          ?? "http://localhost:5173";

        var handler = new SendInvitationCommandHandler(
            _groupRepo, _invitationRepo, _userRepo, _emailService, frontendUrl);

        var result = await handler.HandleAsync(
            new SendInvitationCommand(request.GroupId, GetUserId(), request.Email));

        if (!result.IsSuccess)
            return BadRequest(new { message = result.Error });

        return Ok(new { message = "Invitation sent successfully." });
    }

    // ─── GET api/invitations/preview/{token}  ───────────────────────────
    // Public endpoint — returns invitation info so the frontend can show a
    // "You've been invited to X" banner without requiring login first.
    [HttpGet("preview/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> PreviewInvitation(string token)
    {
        var invitation = await _invitationRepo.GetByTokenAsync(token);
        if (invitation is null || !invitation.IsValid())
            return NotFound(new { message = "Invitation is invalid or has expired." });

        var group = await _groupRepo.GetByIdAsync(invitation.GroupId);
        if (group is null)
            return NotFound(new { message = "Group not found." });

        return Ok(new
        {
            groupId = group.Id,
            groupName = group.Name,
            invitedEmail = invitation.InvitedEmail,
            expiresAt = invitation.ExpiresAt
        });
    }

    // ─── POST api/invitations/accept/{token}  ───────────────────────────
    // Authenticated endpoint — logged-in user accepts the invitation
    [HttpPost("accept/{token}")]
    [Authorize]
    public async Task<IActionResult> AcceptInvitation(string token)
    {
        var handler = new AcceptInvitationCommandHandler(_invitationRepo, _groupRepo);
        var result = await handler.HandleAsync(
            new AcceptInvitationCommand(token, GetUserId()));

        if (!result.IsSuccess)
            return BadRequest(new { message = result.Error });

        return Ok(new { groupId = result.GroupId });
    }
}

public record SendInvitationRequest(Guid GroupId, string Email);