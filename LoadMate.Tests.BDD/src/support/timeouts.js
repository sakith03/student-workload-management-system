const { setDefaultTimeout } = require("@cucumber/cucumber");

// UI E2E steps often require >5s (default), especially on first load in Docker.
setDefaultTimeout(30 * 1000);

