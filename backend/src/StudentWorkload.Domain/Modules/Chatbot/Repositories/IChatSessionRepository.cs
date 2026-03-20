namespace StudentWorkload.Domain.Modules.Chatbot.Repositories;

using StudentWorkload.Domain.Modules.Chatbot.Entities;

public interface IChatSessionRepository
{
    Task<ChatSession?> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default);
    Task<ChatSession?> GetByIdAsync(Guid sessionId, CancellationToken ct = default);
    Task AddAsync(ChatSession session, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}