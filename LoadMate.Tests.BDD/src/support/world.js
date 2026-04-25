'use strict';
const { setWorldConstructor, World } = require("@cucumber/cucumber");
const { chromium } = require("playwright");
const { config } = require("./env");
const axios = require('axios');

/**
 * LoadMateWorld - Unified shared context for both API and UI tests.
 */
class LoadMateWorld extends World {
  constructor(options) {
    super(options);

    // --- BASE CONFIGURATION ---
    this.uiBaseUrl = config.uiBaseUrl || 'http://localhost:3000';
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:5000';

    // nethma: Playwright Browser Objects ---
    this.browser = null;
    this.context = null;
    this.page = null;

    // chathura: API State & Authentication ---
    this.token = null;      // Stores JWT Bearer token
    this.subjectId = null;  // Stores UUID for workspace creation
    this.response = null;   // Stores the last axios response for assertions
    this.fileId = null;     // Stores the most recently uploaded file ID

    // --- SHARED SCENARIO DATA ---
    this.groupId = null;
    this.groupName = null;
    this.invitationToken = null;
    this.invitedEmail = null;
    this.invitedPassword = null;
  }

  // ===========================================================================
  // nethma: Browser Management
  // ===========================================================================
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

  // ===========================================================================
  // chathura: HTTP API Helpers (Axios)
  // ===========================================================================

  /**
   * Internal caller to catch axios errors and store response for BDD steps.
   */
  async _call(axiosConfig) {
    try {
      this.response = await axios(axiosConfig);
    } catch (err) {
      if (err.response) {
        this.response = err.response; // Store 4xx/5xx responses for Then assertions
      } else {
        throw err; // Network or other errors
      }
    }
    return this.response;
  }

  _authHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
    };
  }

  get(path) {
    return this._call({ method: 'GET', url: `${this.apiBaseUrl}${path}`, headers: this._authHeaders() });
  }

  post(path, body) {
    return this._call({ method: 'POST', url: `${this.apiBaseUrl}${path}`, headers: this._authHeaders(), data: body });
  }

  put(path, body) {
    return this._call({ method: 'PUT', url: `${this.apiBaseUrl}${path}`, headers: this._authHeaders(), data: body });
  }

  delete(path) {
    return this._call({ method: 'DELETE', url: `${this.apiBaseUrl}${path}`, headers: this._authHeaders() });
  }

  /** For multipart/form-data file uploads (Workspace Shared Files) */
  postForm(path, formData) {
    return this._call({
      method: 'POST',
      url: `${this.apiBaseUrl}${path}`,
      headers: { ...this._authHeaders(), ...formData.getHeaders() },
      data: formData
    });
  }
}

setWorldConstructor(LoadMateWorld);

module.exports = { LoadMateWorld };