class InvitePage {
  constructor(page) {
    this.page = page;
  }

  async goto(baseUrl, token) {
    await this.page.goto(`${baseUrl}/invite/${token}`, { waitUntil: "domcontentloaded" });
  }

  groupNameStrong() {
    // "Join <strong>GROUP</strong> on LoadMate"
    return this.page.locator("p").locator("strong");
  }

  async clickCreateAccountAndJoin() {
    await this.page.getByRole("button", { name: /Create Account/i }).click();
  }

  async clickAlreadyHaveAccount() {
    await this.page.getByRole("button", { name: /I already have an account/i }).click();
  }

  invalidInvitationCard() {
    return this.page.getByRole("heading", { name: /Invalid Invitation/i });
  }
}

module.exports = { InvitePage };

