namespace StudentWorkload.Application.Common.Interfaces;
 
using StudentWorkload.Domain.Modules.Users.Entities;
 
public interface IJwtService
{
    string GenerateToken(User user);
}
