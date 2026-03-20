namespace StudentWorkload.Domain.Modules.Chatbot.Repositories;

using StudentWorkload.Domain.Modules.Chatbot.Entities;

public interface IChatMessageRepository
{
    Task<IEnumerable<ChatMessage>> GetBySessionIdAsync(Guid sessionId, CancellationToken ct = default);
    Task AddAsync(ChatMessage message, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}