class RegisterPage {
  constructor(page) {
    this.page = page;
  }

  async goto(baseUrl) {
    await this.page.goto(`${baseUrl}/register`, { waitUntil: "domcontentloaded" });
  }

  async registerStudent({ firstName, lastName, email, password }) {
    // Role defaults to Student; we still click to be explicit for demos.
    await this.page.getByRole("button", { name: /^Student$/ }).click();

    await this.page.getByPlaceholder("John").fill(firstName);
    await this.page.getByPlaceholder("Doe").fill(lastName);
    await this.page.getByPlaceholder("you@university.edu").fill(email);
    await this.page.getByPlaceholder("Min. 8 characters").fill(password);

    await this.page.getByRole("button", { name: /Create Account/i }).click();
  }

  errorBox() {
    return this.page.locator(".auth-error");
  }
}

module.exports = { RegisterPage };

