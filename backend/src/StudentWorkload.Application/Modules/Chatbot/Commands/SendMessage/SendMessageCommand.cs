namespace StudentWorkload.Application.Modules.Chatbot.Commands.SendMessage;

// ── Command ──────────────────────────────────────────────────────────────────
public record SendMessageCommand(Guid SessionId, string UserMessage);

// ── Result ───────────────────────────────────────────────────────────────────
public record SendMessageResult(bool IsSuccess, string? AiResponse, DateTime? Timestamp, string? Error = null);