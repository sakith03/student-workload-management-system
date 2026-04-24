const { Given, When, Then } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");

const api = require("../support/api");
const { LoginPage } = require("../pages/LoginPage");

function uniqueEmail(stamp) {
  return `bdd.auth.${stamp}@university.test`;
}

Given("a registered user exists", async function () {
  const stamp = Date.now();
  const email = uniqueEmail(stamp);
  const password = "Password!12345";

  await api.register({
    firstName: "BDD",
    lastName: "AuthUser",
    email,
    password,
    role: "Student",
  });

  // Ensure the user has an academic profile so UI login routes to /dashboard (not /onboarding).
  const jwt = await api.login(email, password);
  await api.setupProfile(jwt, 1, 1);

  this.authEmail = email;
  this.authPassword = password;
});

Given("the user is not authenticated", async function () {
  // Ensure no JWT is present for this browser context
  await this.context.clearCookies().catch(() => {});
  await this.page.addInitScript(() => {
    localStorage.removeItem("jwt_token");
    sessionStorage.removeItem("pendingInviteToken");
  });
});

Given("the user is on the login page", async function () {
  const login = new LoginPage(this.page);
  await login.goto(this.uiBaseUrl);
});

When("the user logs in with valid credentials", async function () {
  const login = new LoginPage(this.page);
  await login.goto(this.uiBaseUrl);
  await login.emailInput().fill(this.authEmail);
  await login.passwordInput().fill(this.authPassword);
  await login.submitButton().click();
});

When(
  "the user attempts to log in with email {string} and password {string}",
  async function (email, password) {
    const login = new LoginPage(this.page);
    await login.goto(this.uiBaseUrl);

    if (email) await login.emailInput().fill(email);
    if (password) await login.passwordInput().fill(password);

    await login.submitButton().click();
  }
);

When(
  "the user attempts to submit the login form with email {string} and password {string}",
  async function (email, password) {
    const login = new LoginPage(this.page);

    // Assume we're already on /login via Given step.
    // Fill whatever values provided; leave blank if empty.
    await login.emailInput().fill(email ?? "");
    await login.passwordInput().fill(password ?? "");

    // If the browser blocks submission due to native validation, the click resolves
    // but no navigation happens. We assert "remain on /login" in a Then step.
    await login.submitButton().click();
  }
);

When("the user navigates to {string}", async function (path) {
  await this.page.goto(`${this.uiBaseUrl}${path}`, { waitUntil: "domcontentloaded" });
});

Then("the user should be redirected to {string}", async function (path) {
  const rx = new RegExp(`${path.replace("/", "\\/")}$`);
  await expect(this.page).toHaveURL(rx, { timeout: 15000 });
});

Then("the user should remain on {string}", async function (path) {
  const rx = new RegExp(`${path.replace("/", "\\/")}$`);
  await expect(this.page).toHaveURL(rx, { timeout: 15000 });
});

Then("the user should not have a JWT token stored", async function () {
  // The frontend has a global 401 interceptor that can trigger a full page navigation.
  // Ensure the page is stable before reading storage.
  await this.page.waitForURL(/\/login$/, { timeout: 15000 }).catch(() => {});
  await this.page.waitForLoadState("domcontentloaded");

  let token;
  for (let i = 0; i < 5; i++) {
    try {
      token = await this.page.evaluate(() => localStorage.getItem("jwt_token"));
      break;
    } catch (e) {
      // If navigation happens between checks, wait and retry.
      await this.page.waitForLoadState("domcontentloaded").catch(() => {});
    }
  }

  expect(token).toBeFalsy();
});

Then("the top bar should show the user's email", async function () {
  await expect(this.page.locator(".nav-user-email")).toHaveText(this.authEmail, { timeout: 15000 });
});

