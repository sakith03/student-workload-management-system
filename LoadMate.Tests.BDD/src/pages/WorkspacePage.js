class WorkspacePage {
  constructor(page) {
    this.page = page;
  }

  title() {
    return this.page.locator(".dash-nav-title span");
  }

  inviteMemberButton() {
    return this.page.getByRole("button", { name: /Invite Member/i });
  }
}

module.exports = { WorkspacePage };

