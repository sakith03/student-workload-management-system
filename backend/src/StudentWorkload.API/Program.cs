using Microsoft.EntityFrameworkCore;
using StudentWorkload.Infrastructure.Data;
using StudentWorkload.Domain.Modules.Users.Repositories;
using StudentWorkload.Infrastructure.Modules.Users;
<<<<<<< HEAD
using StudentWorkload.Domain.Modules.CourseModules.Repositories;
using StudentWorkload.Infrastructure.Modules.CourseModules;
using StudentWorkload.Application.Modules.CourseModules.Services;
=======
>>>>>>> origin/develop
using StudentWorkload.Application.Common.Interfaces;
using StudentWorkload.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
<<<<<<< HEAD
=======
using StudentWorkload.Domain.Modules.Academic.Repositories;
using StudentWorkload.Domain.Modules.Subjects.Repositories;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Infrastructure.Modules.Academic;
using StudentWorkload.Infrastructure.Modules.Subjects;
using StudentWorkload.Infrastructure.Modules.Groups;

>>>>>>> origin/develop
 
var builder = WebApplication.CreateBuilder(args);
 
// ─── Database ────────────────────────────────────

var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") 
                 ?? throw new Exception("DB_PASSWORD not set");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!
                        .Replace("${DB_PASSWORD}", dbPassword);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
 
// ─── Dependency Injection ────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
<<<<<<< HEAD
builder.Services.AddScoped<ICourseModuleRepository, CourseModuleRepository>();
builder.Services.AddScoped<ICourseModuleService, CourseModuleService>();
builder.Services.AddScoped<IJwtService, JwtService>();
 
// ─── JWT Authentication ──────────────────────────
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") 
                ?? throw new Exception("JWT_SECRET not set");

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
=======
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAcademicProfileRepository, AcademicProfileRepository>();
builder.Services.AddScoped<ISubjectRepository, SubjectRepository>();
builder.Services.AddScoped<IGroupRepository, GroupRepository>();

 
// ─── JWT Authentication ──────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");

// Use JwtSettings:Secret from config (same source as JwtService.cs uses for signing)
// This avoids a mismatch with any system-level JWT_SECRET environment variable
var jwtSecretKey = jwtSettings["Secret"]
    ?? throw new Exception("JwtSettings:Secret not configured");

>>>>>>> origin/develop
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
<<<<<<< HEAD
                Encoding.UTF8.GetBytes(jwtSecret))
=======
                Encoding.UTF8.GetBytes(jwtSecretKey))
>>>>>>> origin/develop
        };
    });
 
builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
 
// ─── CORS for React Frontend ─────────────────────
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});
 
var app = builder.Build();
 
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
 
app.UseCors("AllowFrontend");
app.UseAuthentication(); // Must come BEFORE UseAuthorization
app.UseAuthorization();
app.MapControllers();
 
// Auto-migrate on startup (Development only)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}
 
app.Run();
