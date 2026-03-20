namespace StudentWorkload.Application.Modules.Chatbot.Commands.InitializeChatbot;

// ── Command ──────────────────────────────────────────────────────────────────
public record InitializeChatbotCommand(Guid GroupId, Guid UserId, string ModuleName);

// ── Result ───────────────────────────────────────────────────────────────────
public record InitializeChatbotResult(bool IsSuccess, Guid SessionId, string? Error = null);