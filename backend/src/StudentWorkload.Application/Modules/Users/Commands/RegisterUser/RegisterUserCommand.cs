namespace StudentWorkload.Application.Modules.Users.Commands.RegisterUser;
 
public record RegisterUserCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Role = "Student"
);
