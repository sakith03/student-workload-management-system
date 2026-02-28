namespace StudentWorkload.Application.Modules.Users.Commands.LoginUser;
 
using StudentWorkload.Application.Common.Interfaces;
using StudentWorkload.Domain.Modules.Users.Repositories;
 
public class LoginUserCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;
 
    public LoginUserCommandHandler(IUserRepository userRepository, IJwtService jwtService)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
    }
 
    public async Task<LoginUserResult> HandleAsync(
        LoginUserCommand command,
        CancellationToken cancellationToken = default)
    {
        // Find user by email
        var user = await _userRepository.GetByEmailAsync(command.Email, cancellationToken);
 
        if (user is null || !user.IsActive)
            return LoginUserResult.Failure("Invalid email or password.");
 
        // Verify password hash
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(command.Password, user.PasswordHash);
 
        if (!isPasswordValid)
            return LoginUserResult.Failure("Invalid email or password.");
 
        // Generate JWT token
        var token = _jwtService.GenerateToken(user);
 
        return LoginUserResult.Success(token, user.Email.Value, user.Role.ToString());
    }
}
 
public record LoginUserResult
{
    public bool IsSuccess { get; init; }
    public string? ErrorMessage { get; init; }
    public string? Token { get; init; }
    public string? Email { get; init; }
    public string? Role { get; init; }
 
    public static LoginUserResult Success(string token, string email, string role) =>
        new() { IsSuccess = true, Token = token, Email = email, Role = role };
 
    public static LoginUserResult Failure(string error) =>
        new() { IsSuccess = false, ErrorMessage = error };
}
