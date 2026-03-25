namespace StudentWorkload.Infrastructure.Modules.Chatbot;

using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Chatbot.Entities;
using StudentWorkload.Domain.Modules.Chatbot.Repositories;
using StudentWorkload.Infrastructure.Data;

public class ChatMessageRepository : IChatMessageRepository
{
    private readonly AppDbContext _context;
    public ChatMessageRepository(AppDbContext context) => _context = context;

    public async Task<IEnumerable<ChatMessage>> GetBySessionIdAsync(Guid sessionId, CancellationToken ct = default)
        => await _context.ChatMessages
            .Where(m => m.SessionId == sessionId)
            .OrderBy(m => m.SentAt)
            .ToListAsync(ct);

    public async Task AddAsync(ChatMessage message, CancellationToken ct = default)
        => await _context.ChatMessages.AddAsync(message, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}