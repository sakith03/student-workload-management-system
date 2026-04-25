# LoadMate

Student workload, goals, and group collaboration platform: subjects and course modules, team workspaces with chat, shared files, a real-time whiteboard, email invitations, a Gemini-backed workspace assistant, and n8n-powered parsing of assignment documents into goal drafts.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![CI](https://github.com/sakith03/student-workload-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/sakith03/student-workload-management-system/actions/workflows/ci.yml)

## Overview

LoadMate helps students organize coursework into **subjects** and **goals** (course modules with step-by-step guidance and deadlines), track completion, and collaborate in **subject-scoped workspaces**: invite members, chat, upload shared files, and sketch on a **SignalR** whiteboard. A per-workspace **chatbot** uses the Google **Gemini** API, and uploading briefs (PDF/DOC/DOCX) can pre-fill goals via an external **n8n** workflow.

The backend is a **modular monolith** with **DDD-style** layering: `StudentWorkload.Domain`, `Application`, `Infrastructure`, and `API`. The API is **ASP.NET Core 8**, **Entity Framework Core** against **SQL Server**, **JWT** authentication, **Swagger** in Development, automatic EF **migrations** on startup, and a **`/health`** endpoint for monitoring.

The frontend is **React 19** with **Vite 7**, **Tailwind CSS**, **Axios**, and **SignalR** for the whiteboard hub.

## Live demo

- **App:** [https://frontend-loadmate-h5h2gghtascvcnay.centralindia-01.azurewebsites.net/login](https://frontend-loadmate-h5h2gghtascvcnay.centralindia-01.azurewebsites.net/login)
- **API health:** [https://backend-loadmate-b3ezg2behsgyerbw.centralindia-01.azurewebsites.net/health](https://backend-loadmate-b3ezg2behsgyerbw.centralindia-01.azurewebsites.net/health)

## Screenshot

Add a capture as `docs/screenshot.png` (create `docs/` if needed), then uncomment or replace:

```markdown
![LoadMate UI](docs/screenshot.png)
```

## Features

| Area | Capabilities |
|------|----------------|
| **Auth** | Register, login, JWT; `me`; admin-only route (`AuthController`) |
| **Academic** | Academic year/semester profile; add/list subjects (`AcademicController`) |
| **Goals / modules** | CRUD course modules; manual goals with steps; patch step completions; mark complete (`ModulesController`) |
| **Workspaces** | Create/update/delete groups; list by subject; “my” groups; members; pending invitations (`GroupsController`) |
| **Invitations** | Email invite; public preview by token; accept when logged in (`InvitationsController`) |
| **Chat** | Group message list and send (`GroupChatController`) |
| **Files** | List, upload (50 MB), download; storage path override via env (`GroupFilesController`) |
| **Whiteboard** | Persisted state over REST; live strokes via SignalR `/hubs/whiteboard` (JWT may be passed as `access_token` query) |
| **Chatbot** | Initialize session, send message (Gemini), history (`ChatbotController`) |
| **Document AI** | `POST api/goals/parse-document` — PDF/DOC/DOCX (10 MB) to n8n webhook (`GoalParserController`) |

## Tech stack

| Layer | Technology | Notes |
|--------|------------|--------|
| API | ASP.NET Core 8 (`net8.0`) | JWT Bearer 8.0, SignalR, Swashbuckle 6.6.2, EF Core tools 8.0 |
| Data | SQL Server | **Runtime:** `UseSqlServer` in `Program.cs`. Local Docker: `mcr.microsoft.com/mssql/server:2022-latest`. Pomelo MySQL package is referenced in Infrastructure but not used at startup. |
| Frontend | React 19, Vite 7, React Router 7, Tailwind 3, Axios, `@microsoft/signalr` | See `frontend/package.json` |
| Tests | xUnit, Moq, FluentAssertions, Coverlet | `backend/tests/*` |
| CI | GitHub Actions | `docker compose` build/up, health check, `dotnet test` |
| CD | Docker Hub + Azure Web Apps | Images `myapp-backend` / `myapp-frontend`; rollback to `:previous` on failed health check |

## Repository layout

```
student-workload-management-system/
├── backend/
│   ├── StudentWorkload.sln
│   ├── src/
│   │   ├── StudentWorkload.API/          # Controllers, SignalR hub, Program.cs
│   │   ├── StudentWorkload.Application/ # Commands, handlers, DTOs, services
│   │   ├── StudentWorkload.Domain/       # Entities, repository interfaces
│   │   └── StudentWorkload.Infrastructure/ # EF Core, repositories, email/JWT
│   └── tests/
│       ├── StudentWorkload.UnitTests/
│       └── StudentWorkload.IntegrationTests/
├── frontend/                 # Vite + React (JSX), nginx in Docker
├── StudentWorkload/          # Project analysis / documentation (e.g. LoadMate_Full_Analysis.md)
├── tests/jmeter/             # JMeter scenarios (invitation flow); see tests/jmeter/README.md
├── .github/workflows/        # ci.yml, cd.yml
├── docker-compose.yml        # MSSQL + API + frontend (dev)
├── docker-compose.production.yml  # Pre-built images
├── .env.example
└── LICENSE
```

## Prerequisites

- [.NET SDK 8.0](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 18+ (CI uses 18; frontend Docker build uses Node 20)
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (recommended for full stack)

## Getting started

### 1. Clone and environment

```bash
git clone https://github.com/sakith03/student-workload-management-system.git
cd student-workload-management-system
cp .env.example .env
```

Edit `.env` with strong `DB_PASSWORD`, `JWT_SECRET`, email credentials, and optionally `GEMINI_API_KEY` for the chatbot.

### 2. Run with Docker Compose

```bash
docker compose up -d
```

| Service | URL / port |
|---------|------------|
| API (host) | `http://localhost:5000` → container `8080` |
| Frontend | `http://localhost:3000` (nginx) |
| SQL Server | `localhost:1433` |

Add `GEMINI_API_KEY` to `.env` if you use the chatbot (mapped to `Gemini__ApiKey` in compose).

### 3. API only (local dotnet)

Set `ConnectionStrings__DefaultConnection` (and `JwtSettings__Secret`, etc.) via environment variables or user secrets, then:

```bash
cd backend/src/StudentWorkload.API
dotnet run
```

With the default **http** profile, Swagger is at `http://localhost:5191/swagger` when `ASPNETCORE_ENVIRONMENT=Development` (`launchSettings.json`).

### 4. Frontend only (Vite)

```bash
cd frontend
npm install
npm run dev
```

Dev server: `http://localhost:5173`. CORS allows `5173` and `3000`.

Optional API base (defaults to `http://localhost:5000/api` if unset):

```bash
# PowerShell
$env:VITE_API_URL = "http://localhost:5191"
npm run dev
```

Production build:

```bash
cd frontend
npm ci
npm run build
```

Docker build for frontend uses build arg `VITE_API_URL` (see `frontend/Dockerfile`).

## Configuration

| Variable / setting | Description |
|--------------------|-------------|
| `DB_PASSWORD` | SQL Server `sa` password (Docker Compose) |
| `ConnectionStrings__DefaultConnection` | Full SQL Server connection string |
| `JWT_SECRET` / `JwtSettings__Secret` | Symmetric key for signing JWTs (use a long, random secret) |
| `JwtSettings__Issuer`, `JwtSettings__Audience`, `JwtSettings__ExpirationMinutes` | JWT validation |
| `EMAIL_*` / `EmailSettings__*` | SMTP (e.g. Gmail) for invitations |
| `GEMINI_API_KEY` / `Gemini__ApiKey` | Google Gemini API key |
| `N8n__BaseUrl` | n8n base URL; webhook path used: `/webhook/parse-assignment` |
| `AppSettings__FrontendBaseUrl` | Base URL for invitation links in emails |
| `WORKSPACE_FILES_PATH` | Optional directory root for group file storage |
| `VITE_API_URL` | Frontend build-time API origin |

See `.env.example` and `appsettings.Development.json` for examples.

## API quick reference

Base URL: `/api` (except `/health` and `/hubs/whiteboard`). Most routes require `Authorization: Bearer <token>`.

- **Auth:** `POST .../auth/register`, `POST .../auth/login`, `GET .../auth/me`, `GET .../auth/admin-only`
- **Academic:** `POST/GET .../academic/profile`, `POST/GET .../academic/subjects`
- **Modules:** `GET|POST .../modules`, `POST .../modules/manual`, `PUT|DELETE .../modules/{id}`, `PATCH .../modules/{id}/completions`, `PATCH .../modules/{id}/complete`
- **Groups:** `POST .../groups`, `GET .../groups/{id}`, `GET .../groups/subject/{subjectId}`, `GET .../groups/my`, `PUT|DELETE .../groups/{id}`, `GET .../groups/{groupId}/members`, `GET .../groups/{groupId}/pending-invitations`
- **Invitations:** `POST .../invitations`, `GET .../invitations/preview/{token}`, `POST .../invitations/accept/{token}`
- **Group chat:** `GET|POST .../groupchat/{groupId}/messages`
- **Files:** `GET|POST .../groups/{groupId}/files`, `GET .../groups/{groupId}/files/{fileId}/download`
- **Whiteboard state:** `GET .../groups/{groupId}/whiteboard/state`
- **Chatbot:** `POST .../chatbot/initialize`, `POST .../chatbot/message`, `GET .../chatbot/history/{sessionId}`
- **Goals / parse:** `POST .../goals/parse-document` (multipart file)
- **Health:** `GET /health` → `Healthy`
- **SignalR:** `/hubs/whiteboard`

## Testing

```bash
# Backend (unit + integration)
dotnet test ./backend --logger "trx;LogFileName=test_results.trx"

# Frontend lint
cd frontend && npm run lint
```

Load testing / invitation flows: [tests/jmeter/README.md](tests/jmeter/README.md).

## Deployment

- **CI:** On push/PR to `main` or `develop` — Node install, `docker compose build` / `up`, wait for `http://localhost:5000/health`, `docker compose down`, `dotnet test` (`.github/workflows/ci.yml`).
- **CD:** On push to `main` or `develop` — build/push Docker images, deploy to Azure Web Apps, health check with rollback to `:previous` images, optional Slack (`.github/workflows/cd.yml`).

**Publish API (example):**

```bash
dotnet publish backend/src/StudentWorkload.API/StudentWorkload.API.csproj -c Release -o ./publish
```

## Contributing

1. Fork the repo and branch from `main` or `develop`.
2. Use [.github/pull_request_template.md](.github/pull_request_template.md) for PRs.
3. Keep CI green; run `npm run lint` for frontend changes.

## License

[MIT](LICENSE) — Copyright (c) 2026 Sakith Abeywickrama.

## Further reading

- In-depth analysis: [StudentWorkload/LoadMate_Full_Analysis.md](StudentWorkload/LoadMate_Full_Analysis.md)
