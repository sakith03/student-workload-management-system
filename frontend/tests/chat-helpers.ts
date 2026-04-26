import { expect, type Page } from '@playwright/test';

/** Build a fake JWT that AuthContext can decode via atob(token.split(".")[1]). */
function makeFakeJwt(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesig`;
}

export const MOCK_TOKEN = makeFakeJwt({
  sub: 'user-1',
  email: 'test2@gmail.com',
  role: 'student',
});

export const GROUP_ID = 'mock-group-001';

/** Shared setup — mocks every API route so nothing writes to the database.
 *  Returns the in-memory messages array so tests can pre-seed data. */
export async function setupMocks(page: Page) {
  const messages: any[] = [];
  let msgCounter = 0;

  // Catch-all (registered first = lowest priority in Playwright LIFO).
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );

  // Chat messages
  await page.route('**/api/groupchat/*/messages', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ messages }),
      });
    }
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
    await route.continue();
  });

  // Group members
  await page.route('**/api/groups/*/members', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ userId: 'user-1', name: 'Test User', role: 'owner' }]),
    })
  );

  // Pending invitations
  await page.route('**/api/groups/*/pending-invitations', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );

  // Single group detail
  await page.route(`**/api/groups/${GROUP_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: GROUP_ID,
        name: 'Mock Group',
        subjectId: 'subj-1',
        maxMembers: 5,
        createdAt: new Date().toISOString(),
        createdByUserId: 'user-1',
      }),
    })
  );

  // Subjects
  await page.route('**/api/academic/subjects', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'subj-1', code: 'CS1234', name: 'Mock Module' }]),
    })
  );

  // Inject fake JWT.
  await page.addInitScript((tok: string) => {
    window.localStorage.setItem('jwt_token', tok);
  }, MOCK_TOKEN);

  return { messages, getMsgCounter: () => msgCounter };
}

/** Navigate to the workspace and wait for the chat input to be ready. */
export async function goToChat(page: Page) {
  await page.goto(`/workspace/${GROUP_ID}`);
  const chatInput = page.getByRole('textbox', { name: 'Message your group…' });
  await expect(chatInput).toBeEnabled({ timeout: 15000 });
  return chatInput;
}
