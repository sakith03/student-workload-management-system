using Microsoft.EntityFrameworkCore;
using StudentWorkload.Infrastructure.Data;
using StudentWorkload.Domain.Modules.Users.Repositories;
using StudentWorkload.Infrastructure.Modules.Users;
using StudentWorkload.Application.Common.Interfaces;
using StudentWorkload.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
 
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
builder.Services.AddScoped<IJwtService, JwtService>();
 
// ─── JWT Authentication ──────────────────────────
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") 
                ?? throw new Exception("JWT_SECRET not set");

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
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
                Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
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
