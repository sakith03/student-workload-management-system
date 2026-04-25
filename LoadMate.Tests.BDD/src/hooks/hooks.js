'use strict';
const fs = require("fs");
const path = require("path");
const { Before, After, Status, setDefaultTimeout } = require("@cucumber/cucumber");
const { randomUUID } = require('crypto');
const axios = require('axios');

// Global timeout: API and Browser calls can be slow
setDefaultTimeout(20000);

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

// =============================================================================
// BEFORE HOOK 1: Nethma's Setup (Runs ONLY for scenarios tagged with @ui)
// =============================================================================
Before({ tags: "@ui" }, async function () {
  // Nethma: Browser & Directory Setup ---
  ensureDir(path.resolve(process.cwd(), "reports"));
  ensureDir(path.resolve(process.cwd(), "artifacts"));

  // Launch Playwright browser (Nethma) - Will NOT run during Chathura's API tests
  await this.launchBrowser();
});

// =============================================================================
// BEFORE HOOK 2: Chathura's Setup (Runs ONLY for scenarios tagged with @api)
// =============================================================================
Before({ tags: "@api" }, async function () {
  // Chathura: API Authentication Setup ---
  // We need a fresh JWT token for our API-driven BDD tests
  const baseUrl = this.apiBaseUrl || 'http://localhost:5000/api';
  const uniqueId = randomUUID().slice(0, 8);
  const email = `cucumber_${uniqueId}@workload.test`;
  const password = 'Cucumber@Test1234';

  try {
    // 1. Register a unique test user
    await axios.post(`${baseUrl}/auth/register`, {
      email,
      password,
      firstName: 'Cucumber',
      lastName: 'Tester',
      role: 'Student'
    });

    // 2. Login to get the JWT token
    const loginResp = await axios.post(`${baseUrl}/auth/login`, {
      email,
      password
    });

    // Store token and a random SubjectId on 'this' (CustomWorld) for step definitions
    this.token = loginResp.data.token;
    this.subjectId = "48DC8B89-6FA0-488D-8D90-33FE54CC6E66";

  } catch (error) {
    console.error("Critical: API Auth Setup failed for Chathura's tests.");
    throw error;
  }
});

// =============================================================================
// AFTER HOOK: Runs after every scenario (UI and API)
// =============================================================================
After(async function (scenario) {
  // Nethma: Screenshots & Cleanup
  const name = scenario.pickle?.name?.replace(/[^\w\-]+/g, "_").slice(0, 80) || "scenario";
  const stamp = Date.now();

  // Only run UI cleanup if the browser page was actually opened (Playwright exists)
  if (this.page) {
    // If the scenario fails, take a screenshot
    if (scenario.result?.status === Status.FAILED) {
      const screenshotPath = path.resolve(process.cwd(), "artifacts", `${stamp}-${name}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => { });
    }

    // Stop Playwright tracing
    const tracePath = path.resolve(process.cwd(), "artifacts", `${stamp}-${name}-trace.zip`);
    if (this.context?.tracing) {
      await this.context.tracing.stop({ path: tracePath }).catch(() => { });
    }

    // Close the browser session
    await this.closeBrowser();
  }
});