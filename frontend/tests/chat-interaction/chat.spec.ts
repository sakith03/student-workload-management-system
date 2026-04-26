import { test, expect } from '@playwright/test';
import { setupMocks, goToChat, GROUP_ID } from './chat-helpers';

// test 1: empty state ----------------------------------------------------
test('1 — Empty state shows placeholder when no messages exist', async ({ page }) => {
  await setupMocks(page);
  await page.goto(`/workspace/${GROUP_ID}`);

  // Verify empty state UI elements are displayed.
  await expect(page.getByText('No messages yet')).toBeVisible();
  await expect(
    page.getByText('Start the thread — share deadlines, links, or a quick hello to your teammates.')
  ).toBeVisible();
  // Header subtitle should show the "no messages" prompt.
  await expect(page.getByText('Say hi — quick questions & updates stay here')).toBeVisible();
});

// test 2: Send button disabled state -------------------------------------------------
test('2 — Send button is disabled when input is empty', async ({ page }) => {
  await setupMocks(page);
  const chatInput = await goToChat(page);
  const sendButton = page.locator('.gc-send-btn');

  // Empty input = button disabled.
  await expect(sendButton).toBeDisabled();

  // Type something = button enabled.
  await chatInput.fill('test');
  await expect(sendButton).toBeEnabled();

  // Clear = disabled again.
  await chatInput.fill('');
  await expect(sendButton).toBeDisabled();
});

// Test 3: Iterative message sending-------------------------------------------------
test('3 — Iterative message sending via loop', async ({ page }) => {
  await setupMocks(page);
  const chatInput = await goToChat(page);
  const sendButton = page.locator('.gc-send-btn');

  const messagesToSend = [
    'hello team',
    'deadline reminder',
    'sharing status update',
  ];

  // Loop-based send: verify each message is posted and rendered in chat.
  for (const message of messagesToSend) {
    await chatInput.fill(message);
    await sendButton.click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
  }

  // Input should be cleared after the last send.
  await expect(chatInput).toHaveValue('');
});

// Test 4: Keyboard shortcuts-------------------------------------------------
test('4 — Enter key sends message, Shift+Enter does not', async ({ page }) => {
  await setupMocks(page);
  const chatInput = await goToChat(page);

  // Shift+Enter should NOT send the message.
  await chatInput.fill('should not send');
  await chatInput.press('Shift+Enter');
  // Message should still be in the input, not rendered as a chat bubble.
  await expect(page.locator('.gc-bubble').filter({ hasText: 'should not send' })).toHaveCount(0);

  // Enter (without Shift) should send the message.
  await chatInput.fill('sent via enter');
  await chatInput.press('Enter');
  await expect(page.getByText('sent via enter', { exact: true })).toBeVisible();
  await expect(chatInput).toHaveValue('');
});

// Test 5: Failed send error handling -------------------------------------------------
test('5 — Failed send shows error and restores input', async ({ page }) => {
  await setupMocks(page);
  const chatInput = await goToChat(page);
  const sendButton = page.locator('.gc-send-btn');

  const failingMessage = 'this should fail';

  // Override chat route to abort POST requests (simulate network failure).
  await page.route('**/api/groupchat/*/messages', async (route) => {
    if (route.request().method() === 'POST') {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ messages: [] }),
    });
  });

  await chatInput.fill(failingMessage);
  await sendButton.click();

  // Error toast should appear and the failed message text should be restored in the input.
  await expect(page.getByText('Failed to send message. Please try again.')).toBeVisible();
  await expect(chatInput).toHaveValue(failingMessage);
});

// Test 6: Retry after failure -------------------------------------------------
test('6 — Retry after failed send succeeds', async ({ page }) => {
  const { messages } = await setupMocks(page);
  const chatInput = await goToChat(page);
  const sendButton = page.locator('.gc-send-btn');

  let msgCounter = 100;
  const failingMessage = 'retry me';

  // First: make POST fail.
  await page.route('**/api/groupchat/*/messages', async (route) => {
    if (route.request().method() === 'POST') {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ messages }),
    });
  });

  await chatInput.fill(failingMessage);
  await sendButton.click();
  await expect(page.getByText('Failed to send message. Please try again.')).toBeVisible();
  await expect(chatInput).toHaveValue(failingMessage);

  // Remove failure override and restore success handler.
  await page.unroute('**/api/groupchat/*/messages');
  await page.route('**/api/groupchat/*/messages', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const newMsg = {
        id: `msg-${++msgCounter}`,
        senderUserId: 'user-1',
        senderName: 'Test User',
        messageText: body.messageText,
        sentAt: new Date().toISOString(),
      };
      messages.push(newMsg);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newMsg),
      });
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ messages }),
    });
  });

  // Retry — should succeed now.
  await sendButton.click();
  await expect(page.getByText(failingMessage, { exact: true })).toBeVisible();
  await expect(chatInput).toHaveValue('');
});

// Test 7: Pre-seeded messages-------------------------------------------------
test('7 — Pre-sent messages shows with correct sender info', async ({ page }) => {
  const { messages } = await setupMocks(page);

  // Pre-seed messages before navigating.
  messages.push(
    {
      id: 'msg-a',
      senderUserId: 'user-2',
      senderName: 'Alice Johnson',
      messageText: 'Hey everyone!',
      sentAt: new Date(Date.now() - 3600_000).toISOString(),
    },
    {
      id: 'msg-b',
      senderUserId: 'user-1',
      senderName: 'Test User',
      messageText: 'Hi Alice!',
      sentAt: new Date(Date.now() - 1800_000).toISOString(),
    },
  );

  await page.goto(`/workspace/${GROUP_ID}`);

  // Both messages should be visible.
  await expect(page.getByText('Hey everyone!')).toBeVisible();
  await expect(page.getByText('Hi Alice!')).toBeVisible();

  // Other user's name is shown; own messages don't display sender name.
  await expect(page.locator('.gc-sender').filter({ hasText: 'Alice Johnson' })).toBeVisible();

  // Header shows correct message count.
  await expect(page.getByText('2 messages in this workspace')).toBeVisible();
});

// Test 8: Singular message count grammar -------------------------------------------------
test('8 — Header shows singular "message" for exactly one message', async ({ page }) => {
  const { messages } = await setupMocks(page);

  // Pre-seed a single message.
  messages.push({
    id: 'msg-solo',
    senderUserId: 'user-1',
    senderName: 'Test User',
    messageText: 'Only one here',
    sentAt: new Date().toISOString(),
  });

  await page.goto(`/workspace/${GROUP_ID}`);

  // Header should use singular "message" (not "messages").
  await expect(page.getByText('1 message in this workspace')).toBeVisible();
});