class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async goto(baseUrl) {
    await this.page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  }

  emailInput() {
    return this.page.getByPlaceholder("you@university.edu");
  }

  passwordInput() {
    return this.page.getByPlaceholder("••••••••");
  }

  submitButton() {
    return this.page.getByRole("button", { name: "Sign In" });
  }

  errorBox() {
    return this.page.locator(".auth-error");
  }
}

module.exports = { LoginPage };

