namespace StudentWorkload.Application.Modules.Chatbot.Queries.GetChatHistory;

using StudentWorkload.Domain.Modules.Chatbot.Repositories;

// ── Query Result DTO ─────────────────────────────────────────────────────────
public record ChatMessageDto(string Sender, string MessageText, DateTime SentAt);

public class GetChatHistoryQueryHandler
{
    private readonly IChatMessageRepository _messageRepo;

    public GetChatHistoryQueryHandler(IChatMessageRepository messageRepo)
        => _messageRepo = messageRepo;

    public async Task<IEnumerable<ChatMessageDto>> HandleAsync(
        Guid sessionId,
        CancellationToken ct = default)
    {
        var messages = await _messageRepo.GetBySessionIdAsync(sessionId, ct);
        return messages.Select(m => new ChatMessageDto(m.Sender, m.MessageText, m.SentAt));
    }
}