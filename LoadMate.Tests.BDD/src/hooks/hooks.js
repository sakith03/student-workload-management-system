'use strict';
const fs = require("fs");
const path = require("path");
const { Before, After, Status, setDefaultTimeout } = require("@cucumber/cucumber");
const { randomUUID } = require('crypto');
const axios = require('axios');

// Global timeout: API and Browser calls can be slow
setDefaultTimeout(90000);

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}


Before({ tags: "@ui" }, async function () {
  ensureDir(path.resolve(process.cwd(), "reports"));
  ensureDir(path.resolve(process.cwd(), "artifacts"));


  await this.launchBrowser();
});

Before({ tags: "@api" }, async function () {
  const baseUrl = this.apiBaseUrl;
  const uniqueId = randomUUID().slice(0, 8);
  const email = `bdd_${uniqueId}@workload.test`;
  const password = 'Cucumber@Test1234';

  const timeout = 20000;
  // 1. Register
  await axios.post(`${baseUrl}/auth/register`, {
    email, password,
    firstName: 'Cucumber', lastName: 'Tester', role: 'Student'
  });

  // 2. Login
  const loginResp = await axios.post(`${baseUrl}/auth/login`, { email, password });
  this.token = loginResp.data.token;

  const authHeader = { Authorization: `Bearer ${this.token}` };

  // 3. Create academic profile (required before creating a subject)
  await axios.post(`${baseUrl}/academic/profile/setup`,
    { academicYear: 3, semester: 1 },
    { headers: authHeader }
  );

  // 4. Create a real Subject → get a FK-valid subjectId
  const subjectResp = await axios.post(`${baseUrl}/academic/subjects`,
    { code: `BDD${uniqueId}`, name: 'BDD Test Subject', creditHours: 3, color: '#34d399' },
    { headers: authHeader }
  );

  this.subjectId = subjectResp.data.subjectId;

  if (!this.subjectId) {
    throw new Error('Setup failed: subjectId missing from POST /academic/subjects response');
  }

  // Reset per-scenario state
  this.groupId = null;
  this.fileId = null;
  this.response = null;
  this.secondUserToken = null;
});


After(async function (scenario) {
  // ── API Cleanup ────────────────────────────────────────────────────────────
  // Delete in dependency order: group → subject → user account
  // All failures are non-fatal to avoid masking the actual test result.
  if (this.token) {
    const baseUrl = this.apiBaseUrl;
    const headers = { Authorization: `Bearer ${this.token}` };
    const timeout = 10000;

    // 1. Delete workspace (may already be gone if the scenario deleted it)
    if (this.groupId) {
      try {
        await axios.delete(`${baseUrl}/groups/${this.groupId}`, { headers, timeout });
      } catch (_) { }
    }

    // 2. Delete the subject created in Before
    if (this.subjectId) {
      try {
        await axios.delete(`${baseUrl}/academic/subjects/${this.subjectId}`, { headers, timeout });
      } catch (_) { }
    }

    // 3. Delete the test user account itself so no orphaned users accumulate
    try {
      await axios.delete(`${baseUrl}/auth/account`, { headers, timeout });
    } catch (_) { }
  }

  // --- UI Cleanup ---
  if (this.page) {
    const name = scenario.pickle?.name?.replace(/[^\w\-]+/g, "_").slice(0, 80) || "scenario";
    const stamp = Date.now();

    if (scenario.result?.status === Status.FAILED) {
      const screenshotPath = path.resolve(process.cwd(), "artifacts", `${stamp}-${name}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => { });
    }

    if (this.context?.tracing) {
      const tracePath = path.resolve(process.cwd(), "artifacts", `${stamp}-${name}-trace.zip`);
      await this.context.tracing.stop({ path: tracePath }).catch(() => { });
    }
    await this.closeBrowser();
  }
});