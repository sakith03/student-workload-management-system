# ─── STAGE 1: Build ─────────────────────────────────
# Use the full SDK to compile our code
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
 
# Copy solution and project files first (for Docker layer caching)
# If only source files change, this layer is cached and dependencies aren't re-restored
COPY StudentWorkload.sln ./
COPY src/StudentWorkload.Domain/StudentWorkload.Domain.csproj src/StudentWorkload.Domain/
COPY src/StudentWorkload.Application/StudentWorkload.Application.csproj src/StudentWorkload.Application/
COPY src/StudentWorkload.Infrastructure/StudentWorkload.Infrastructure.csproj src/StudentWorkload.Infrastructure/
COPY src/StudentWorkload.API/StudentWorkload.API.csproj src/StudentWorkload.API/
# COPY tests/StudentWorkload.UnitTests/ tests/StudentWorkload.UnitTests/
# COPY tests/StudentWorkload.IntegrationTests/ tests/StudentWorkload.IntegrationTests/

# Restore dependencies
RUN dotnet restore
 
# Copy remaining source files
COPY . .
 
# Build in Release mode
RUN dotnet build src/StudentWorkload.API/StudentWorkload.API.csproj -c Release -o /app/build
 
# Publish (self-contained output)
RUN dotnet publish src/StudentWorkload.API/StudentWorkload.API.csproj -c Release -o /app/publish
 
# ─── STAGE 2: Runtime ───────────────────────────────
# Use the small ASP.NET runtime image (NOT the SDK)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
 
# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
 
# Copy ONLY the published output from the build stage
COPY --from=build /app/publish ./
 
# Switch to non-root user
USER appuser
 
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
 
ENTRYPOINT ["dotnet", "StudentWorkload.API.dll"]
