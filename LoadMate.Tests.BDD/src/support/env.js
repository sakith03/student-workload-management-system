const path = require("path");
const dotenv = require("dotenv");

// LoadMate repo already has a root .env for docker compose.
// We also allow a dedicated env file for BDD tests.
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function getEnv(name, fallback) {
  const val = process.env[name];
  if (val === undefined || val === "") return fallback;
  return val;
}

module.exports = {
  getEnv,
  config: {
    uiBaseUrl: getEnv("E2E_UI_BASE_URL", "http://localhost:5173"),
    apiBaseUrl: getEnv("E2E_API_BASE_URL", "http://localhost:5000/api"),
    headless: getEnv("E2E_HEADLESS", "true") !== "false",

    // SQL Server (docker compose default)
    dbServer: getEnv("E2E_DB_SERVER", "localhost"),
    dbPort: Number(getEnv("E2E_DB_PORT", "1433")),
    dbUser: getEnv("E2E_DB_USER", "sa"),
    dbPassword: getEnv("E2E_DB_PASSWORD", process.env.DB_PASSWORD),
    dbName: getEnv("E2E_DB_NAME", "StudentWorkloadDb"),
  },
};

