namespace StudentWorkload.Application.Modules.Users.Commands.RegisterUser;
 
using StudentWorkload.Domain.Modules.Users.Entities;
using StudentWorkload.Domain.Modules.Users.Enums;
using StudentWorkload.Domain.Modules.Users.Repositories;
 
public class RegisterUserCommandHandler
{
    private readonly IUserRepository _userRepository;
 
    public RegisterUserCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }
 
    public async Task<RegisterUserResult> HandleAsync(
        RegisterUserCommand command,
        CancellationToken cancellationToken = default)
    {
        // Business Rule: Email must be unique
        var emailExists = await _userRepository.ExistsByEmailAsync(
            command.Email, cancellationToken);
 
        if (emailExists)
            return RegisterUserResult.Failure("Email address is already registered.");
 
        // Parse role safely
        if (!Enum.TryParse<UserRole>(command.Role, true, out var role))
            role = UserRole.Student;
 
        // Hash password — NEVER store plaintext passwords
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(command.Password, workFactor: 12);
 
        // Create domain entity through factory method
        var user = User.Create(
            command.Email,
            passwordHash,
            command.FirstName,
            command.LastName,
            role);
 
        await _userRepository.AddAsync(user, cancellationToken);
        await _userRepository.SaveChangesAsync(cancellationToken);
 
        return RegisterUserResult.Success(user.Id, user.Email.Value);
    }
}
 
// Result object — avoids throwing exceptions for expected business failures
public record RegisterUserResult
{
    public bool IsSuccess { get; init; }
    public string? ErrorMessage { get; init; }
    public Guid? UserId { get; init; }
    public string? Email { get; init; }
 
    public static RegisterUserResult Success(Guid id, string email) =>
        new() { IsSuccess = true, UserId = id, Email = email };
 
    public static RegisterUserResult Failure(string error) =>
        new() { IsSuccess = false, ErrorMessage = error };
}
