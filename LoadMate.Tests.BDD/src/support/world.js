const { setWorldConstructor, World } = require("@cucumber/cucumber");
const { chromium } = require("playwright");
const { config } = require("./env");

class LoadMateWorld extends World {
  constructor(options) {
    super(options);
    this.uiBaseUrl = config.uiBaseUrl;
    this.apiBaseUrl = config.apiBaseUrl;

    this.browser = null;
    this.context = null;
    this.page = null;

    // Scenario data
    this.invitationToken = null;
    this.invitedEmail = null;
    this.invitedPassword = null;
    this.groupId = null;
    this.groupName = null;
  }

  async launchBrowser() {
    this.browser = await chromium.launch({ headless: config.headless });
    this.context = await this.browser.newContext();
    await this.context.tracing.start({ screenshots: true, snapshots: true, sources: false });
    this.page = await this.context.newPage();
  }

  async closeBrowser() {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    this.page = null;
    this.context = null;
    this.browser = null;
  }
}

setWorldConstructor(LoadMateWorld);

module.exports = { LoadMateWorld };

