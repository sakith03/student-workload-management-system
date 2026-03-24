namespace StudentWorkload.Infrastructure.Modules.Chatbot;

using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Chatbot.Entities;
using StudentWorkload.Domain.Modules.Chatbot.Repositories;
using StudentWorkload.Infrastructure.Data;

public class ChatSessionRepository : IChatSessionRepository
{
    private readonly AppDbContext _context;
    public ChatSessionRepository(AppDbContext context) => _context = context;

    public async Task<ChatSession?> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default)
        => await _context.ChatSessions
            .FirstOrDefaultAsync(s => s.GroupId == groupId && s.IsActive, ct);

    public async Task<ChatSession?> GetByIdAsync(Guid sessionId, CancellationToken ct = default)
        => await _context.ChatSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

    public async Task AddAsync(ChatSession session, CancellationToken ct = default)
        => await _context.ChatSessions.AddAsync(session, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}