'use strict';
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const FormData = require('form-data');
const axios = require('axios');

// ─── GIVEN ────────────────────────────────────────────────────────────────────

Given('I have already uploaded a file named {string} to the workspace', async function (fileName) {
    const form = new FormData();
    // Upload endpoint field name is "file" (from [FromForm] IFormFile? file parameter)
    form.append('file', Buffer.from('Cucumber test file content'), {
        filename: fileName,
        contentType: 'application/octet-stream'
    });

    const resp = await this.postForm(`/groups/${this.groupId}/files`, form);
    expect(resp.status, `Pre-condition: file upload should succeed`).to.equal(200);
    this.fileId = resp.data.id;
});

// ─── WHEN: File Operations ────────────────────────────────────────────────────

When('I upload a file named {string} with content type {string}', async function (fileName, contentType) {
    const form = new FormData();
    form.append('file', Buffer.from('Cucumber BDD test file — uploaded by feature test'), {
        filename: fileName,
        contentType: contentType
    });

    // POST /api/groups/{groupId}/files — multipart/form-data
    // Max size: 50MB (RequestSizeLimit in controller)
    await this.postForm(`/groups/${this.groupId}/files`, form);
    if (this.response.status === 200) {
        this.fileId = this.response.data.id;
    }
});

When('I try to upload without providing a file', async function () {
    // Send multipart request with no actual file appended
    // Controller check: if (file is null || file.Length == 0) → 400 "File is required."
    const form = new FormData();
    // intentionally not appending any file

    await this.postForm(`/groups/${this.groupId}/files`, form);
});

When('the second user tries to upload a file to the workspace', async function () {
    const savedToken = this.token;
    this.token = this.secondUserToken; // Non-member — CanAccessGroup() returns false → 403

    const form = new FormData();
    form.append('file', Buffer.from('Unauthorized upload attempt'), {
        filename: 'hack.txt',
        contentType: 'text/plain'
    });

    await this.postForm(`/groups/${this.groupId}/files`, form);
    this.token = savedToken;
});

When('I request the file list for the workspace', async function () {
    // GET /api/groups/{groupId}/files
    // Response: { groupId, files: [{ id, fileName, contentType, sizeBytes, uploadedAt, uploadedByUserId }] }
    await this.get(`/groups/${this.groupId}/files`);
});

When('the second user tries to list files in the workspace', async function () {
    const savedToken = this.token;
    this.token = this.secondUserToken;
    await this.get(`/groups/${this.groupId}/files`);
    this.token = savedToken;
});

When('I download the uploaded file', async function () {
    // GET /api/groups/{groupId}/files/{fileId}/download
    // Returns: File(bytes, contentType, originalFileName)
    await this.get(`/groups/${this.groupId}/files/${this.fileId}/download`);
});

// ─── THEN ─────────────────────────────────────────────────────────────────────

Then('the response should contain the uploaded file ID', function () {
    expect(this.response.data).to.have.property('id');
    expect(this.response.data.id).to.be.a('string').and.not.empty;
});

Then('the response file name should be {string}', function (expectedName) {
    // Response field: fileName (from GroupFilesController Upload response)
    expect(this.response.data.fileName).to.equal(expectedName);
});

Then('the response content type should be {string}', function (expectedType) {
    expect(this.response.data.contentType).to.equal(expectedType);
});

Then('the file list should contain at least {int} file', function (minCount) {
    // Response structure: { groupId, files: [...] }
    const files = this.response.data.files;
    expect(files, 'Response should have a "files" array').to.be.an('array');
    expect(files.length, `File list should have at least ${minCount} file(s)`).to.be.at.least(minCount);
});