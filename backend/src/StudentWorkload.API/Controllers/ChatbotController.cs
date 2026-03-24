namespace StudentWorkload.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using StudentWorkload.Application.Modules.Chatbot.Commands.InitializeChatbot;
using StudentWorkload.Application.Modules.Chatbot.Commands.SendMessage;
using StudentWorkload.Application.Modules.Chatbot.Queries.GetChatHistory;
using StudentWorkload.Domain.Modules.Chatbot.Repositories;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatbotController : ControllerBase
{
    private readonly IChatSessionRepository _sessionRepo;
    private readonly IChatMessageRepository _messageRepo;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public ChatbotController(
        IChatSessionRepository sessionRepo,
        IChatMessageRepository messageRepo,
        IHttpClientFactory httpClientFactory,
        IConfiguration config)
    {
        _sessionRepo = sessionRepo;
        _messageRepo = messageRepo;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // POST api/chatbot/initialize
    // SG-90: Initialize a chatbot session for a group workspace
    [HttpPost("initialize")]
    public async Task<IActionResult> Initialize([FromBody] InitializeChatbotRequest request)
    {
        var handler = new InitializeChatbotCommandHandler(_sessionRepo);
        var result = await handler.HandleAsync(
            new InitializeChatbotCommand(request.GroupId, GetUserId(), request.ModuleName));

        if (!result.IsSuccess)
            return BadRequest(new { message = result.Error });

        return Ok(new { sessionId = result.SessionId, message = "Chatbot session ready." });
    }

    // POST api/chatbot/message
    // SG-95: Send a user message and get AI response
    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        var apiKey = _config["Gemini:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
            return StatusCode(500, new { message = "Gemini API key is not configured." });

        var httpClient = _httpClientFactory.CreateClient();
        var handler = new SendMessageCommandHandler(_sessionRepo, _messageRepo, httpClient, apiKey);
        var result = await handler.HandleAsync(
            new SendMessageCommand(request.SessionId, request.UserMessage));

        if (!result.IsSuccess)
            return BadRequest(new { message = result.Error });

        return Ok(new
        {
            aiResponse = result.AiResponse,
            timestamp = result.Timestamp
        });
    }

    // GET api/chatbot/history/{sessionId}
    // SG-100: Retrieve chat history for a session
    [HttpGet("history/{sessionId:guid}")]
    public async Task<IActionResult> GetHistory(Guid sessionId)
    {
        // Verify the session exists and belongs to a group this user has access to
        var session = await _sessionRepo.GetByIdAsync(sessionId);
        if (session is null)
            return NotFound(new { message = "Chat session not found." });

        var handler = new GetChatHistoryQueryHandler(_messageRepo);
        var messages = await handler.HandleAsync(sessionId);

        return Ok(new
        {
            sessionId,
            moduleName = session.ModuleName,
            messages = messages.Select(m => new
            {
                m.Sender,
                m.MessageText,
                m.SentAt
            })
        });
    }
}

// ── Request DTOs ─────────────────────────────────────────────────────────────
public record InitializeChatbotRequest(Guid GroupId, string ModuleName);
public record SendMessageRequest(Guid SessionId, string UserMessage);