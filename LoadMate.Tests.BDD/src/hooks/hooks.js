const fs = require("fs");
const path = require("path");
const { Before, After, Status } = require("@cucumber/cucumber");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

Before(async function () {
  ensureDir(path.resolve(process.cwd(), "reports"));
  ensureDir(path.resolve(process.cwd(), "artifacts"));
  await this.launchBrowser();
});

After(async function (scenario) {
  const name = scenario.pickle?.name?.replace(/[^\w\-]+/g, "_").slice(0, 80) || "scenario";
  const stamp = Date.now();

  if (scenario.result?.status === Status.FAILED) {
    const screenshotPath = path.resolve(process.cwd(), "artifacts", `${stamp}-${name}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  }

  const tracePath = path.resolve(process.cwd(), "artifacts", `${stamp}-${name}-trace.zip`);
  await this.context?.tracing?.stop({ path: tracePath }).catch(() => {});

  await this.closeBrowser();
});

