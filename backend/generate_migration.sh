#!/bin/bash
dotnet tool install --global dotnet-ef
export PATH="$PATH:/root/.dotnet/tools"
dotnet clean
dotnet restore
dotnet ef migrations add AddCourseModules -s src/StudentWorkload.API/StudentWorkload.API.csproj -p src/StudentWorkload.Infrastructure/StudentWorkload.Infrastructure.csproj
