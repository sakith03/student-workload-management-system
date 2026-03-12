namespace StudentWorkload.Infrastructure.Modules.Users;
 
using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Users.Entities;
using StudentWorkload.Domain.Modules.Users.Repositories;
using StudentWorkload.Infrastructure.Data;
 
public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;
 
    public UserRepository(AppDbContext context)
    {
        _context = context;
    }
 
    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email, ct);
 
    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Users.FindAsync(new object[] { id }, ct);
 
    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default)
        => await _context.Users.AnyAsync(u => u.Email == email, ct);
 
    public async Task AddAsync(User user, CancellationToken ct = default)
        => await _context.Users.AddAsync(user, ct);
 
    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}
