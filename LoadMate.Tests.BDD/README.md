# LoadMate BDD Tests (Cucumber + Playwright)

This folder contains **BDD-style end-to-end UI tests** for LoadMate, implemented with:

- **Cucumber** (Gherkin feature files)
- **Playwright** (real browser automation)

## Prerequisites

- Node.js 18+
- The LoadMate stack running locally (recommended via Docker Compose)
  - API: `http://localhost:5000`
  - UI: `http://localhost:5173` (Vite) or `http://localhost:3000` (docker)
  - SQL Server: `localhost:1433`

## Install

From repo root:

```bash
cd LoadMate.Tests.BDD
npm install
npx playwright install chromium
```

## Configure

Set environment variables (PowerShell examples):

```powershell
$env:E2E_UI_BASE_URL="http://localhost:3000"   # or http://localhost:5173
$env:E2E_API_BASE_URL="http://localhost:5000/api"
```

Defaults (if not set):

- `E2E_UI_BASE_URL`: `http://localhost:5173`
- `E2E_API_BASE_URL`: `http://localhost:5000/api`
 
Notes:
- The authentication scenarios **seed a test user via the real API** (`/api/auth/register`) to keep the UI test focused on login behavior.

## Run

```bash
npm test
```

Smoke only:

```bash
npm run test:bdd:smoke
```

Headed (browser visible):

```bash
npm run test:bdd:headed
```

## Outputs

- HTML report: `reports/report.html`
- Artifacts on each run:
  - `artifacts/*.png` (screenshot on failure)
  - `artifacts/*-trace.zip` (Playwright trace)

