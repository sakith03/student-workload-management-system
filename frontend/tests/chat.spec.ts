import { test, expect } from '@playwright/test';

test('Group chat e2e with iterative messages and failing-send edge case', async ({ page }) => {
  test.setTimeout(90000);

  // Use unique IDs per run so repeated executions do not clash with existing data.
  const runId = `${Date.now()}`;
  const moduleCode = `CS${runId.slice(-4)}`;
  const moduleName = `Test Module ${runId.slice(-6)}`;
  const groupName = `test-group-${runId.slice(-6)}`;
  const messagesToSend = [
    `hello team ${runId.slice(-3)}`,
    `deadline reminder ${runId.slice(-3)}`,
    `sharing status update ${runId.slice(-3)}`,
  ];

  let createdGroupId = '';
  let createdSubjectId = '';
  let appOrigin = '';

  try {
    // Login and navigate to module management before creating fresh test data.
    await page.goto('/login');
    appOrigin = new URL(page.url()).origin;

    await page.getByRole('textbox', { name: 'you@university.edu' }).fill('test2@gmail.com');
    await page.getByRole('textbox', { name: '••••••••' }).fill('*Test123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('navigation').getByText('My Modules').click();

    const addModuleButton = page.getByRole('button', { name: '+ Add Module' });
    await expect(addModuleButton).toBeVisible();
    await addModuleButton.click();
    await page.getByRole('textbox', { name: 'e.g. CSP6001' }).fill(moduleCode);
    await page.getByRole('textbox', { name: 'e.g. Cloud Systems Programming' }).fill(moduleName);

    // Capture the create-module API response so we can reuse IDs and clean up later.
    const addModuleResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/academic/subjects') &&
        response.request().method() === 'POST' &&
        response.status() === 201
    );
    await page.getByRole('button', { name: 'Add Module' }).click();
    const addModuleResponse = await addModuleResponsePromise;
    const addModuleBody = await addModuleResponse.json();
    createdSubjectId = addModuleBody.subjectId || addModuleBody.id || '';

    const createdModuleCard = page.locator('.subject-card').filter({ hasText: moduleCode }).first();
    await expect(createdModuleCard).toBeVisible();
    await createdModuleCard.getByRole('button', { name: 'View Workspace →' }).click();

    // Select the newly created module in the workspace create form.
    const subjectDropdown = page.getByRole('combobox').first();
    await expect(subjectDropdown).toBeVisible();
    if (createdSubjectId) {
      await subjectDropdown.selectOption(createdSubjectId);
    } else {
      await subjectDropdown.selectOption({ label: `${moduleCode} — ${moduleName}` });
    }

    await page.getByRole('textbox', { name: 'e.g. Team Alpha' }).fill(groupName);
    const createGroupResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/groups') &&
        response.request().method() === 'POST' &&
        response.status() === 201
    );
    await page.getByRole('button', { name: 'Create Group' }).click();
    const createGroupResponse = await createGroupResponsePromise;
    const createGroupBody = await createGroupResponse.json();
    createdGroupId = createGroupBody.id || createGroupBody.groupId || '';

    // Fallback: if API shape changes, derive workspace ID from the redirected URL.
    await expect(page).toHaveURL(/\/workspace\/[0-9a-f-]+$/i);
    if (!createdGroupId) {
      const workspaceIdFromUrl = page.url().split('/workspace/')[1];
      createdGroupId = workspaceIdFromUrl || '';
    }

    const chatInput = page.getByRole('textbox', { name: 'Message your group…' });
    const sendButton = page.locator('.gc-send-btn');

    // Loop-based send test: verifies each message is posted and rendered in chat.
    for (const message of messagesToSend) {
      await chatInput.fill(message);
      await sendButton.click();
      await expect(page.getByText(message, { exact: true })).toBeVisible();
    }

    // Edge case: simulate a failed POST call and verify error + input restore behavior.
    const failingMessage = `failing-send-${runId.slice(-5)}`;
    await page.route('**/api/groupchat/**/messages', async (route) => {
      if (route.request().method() === 'POST') {
        await route.abort();
        return;
      }
      await route.continue();
    });

    await chatInput.fill(failingMessage);
    await sendButton.click();
    await expect(page.getByText('Failed to send message. Please try again.')).toBeVisible();
    await expect(chatInput).toHaveValue(failingMessage);

    // Remove failure simulation and verify that retry succeeds.
    await page.unroute('**/api/groupchat/**/messages');
    await sendButton.click();
    await expect(page.getByText(failingMessage, { exact: true })).toBeVisible();
    await expect(chatInput).toHaveValue('');
  } finally {
    // Always try to delete the created workspace so reruns stay conflict-free.
    if (createdGroupId) {
      page.once('dialog', (dialog) => dialog.accept());
      await page.goto(`/workspace/${createdGroupId}`);
      const deleteWorkspaceButton = page.getByRole('button', { name: 'Delete workspace' });
      if (await deleteWorkspaceButton.isVisible().catch(() => false)) {
        await deleteWorkspaceButton.click();
        await expect(page).toHaveURL(/\/workspaces$/);
      }
    }

    // Best-effort subject cleanup (API availability differs by backend deployment).
    if (createdSubjectId && appOrigin) {
      const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
      if (token) {
        await page.request.delete(`${appOrigin}/api/academic/subjects/${createdSubjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }
  }
});