import { test, expect } from '@playwright/test';

const BASE_URL = 'https://frontend-loadmate-h5h2gghtascvcnay.centralindia-01.azurewebsites.net';

const MOCK_MODULES = [
  { id: 'mod-001', code: 'SE3032', name: 'Advanced Software Engineering' },
  { id: 'mod-002', code: 'SE3022', name: 'Web Application Development' },
];

const MOCK_GOALS = [
  {
    id: 'goal-001',
    name: 'Existing Lab Goal',
    description: 'An existing goal',
    semester: 'Y3S1',
    colorTag: 'Blue',
    deadlineDate: null,
    stepByStepGuidance: ['Step one'],
    submissionGuidelines: '',
    isCompleted: false,
    subjectId: 'mod-001',
  },
];

// ── Setup: inject JWT + mock ALL API routes ───────────────────────────────────

// ── Setup: inject JWT + mock ALL API routes ───────────────────────────────────
const TEST_EMAIL = 'testuser@test.com';    // your real test account
const TEST_PASSWORD = 'TestPassword123';    // your real test password

async function setupPage(page, context) {
  // Mock API routes first
  await page.route('**/api/academic/subjects', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MODULES),
    })
  );

  await page.route('**/api/goals*', (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GOALS),
      });
    } else {
      route.continue();
    }
  });

  // Go to login page and sign in with real credentials
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');

  await page.locator('input[placeholder="you@university.edu"]').fill(TEST_EMAIL);
  await page.locator('input[placeholder="••••••••"]').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();

  // Wait until redirected away from login (auth complete)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

  // Now navigate to goals — real JWT is in localStorage, mocks are active
  await page.goto(`${BASE_URL}/goals`);
  await page.waitForLoadState('networkidle');
}

// ── Helper: wait for modules to load ─────────────────────────────────────────

async function waitForModules(page) {
  // Wait for the select element to exist first
  await page.locator('select').first().waitFor({ state: 'visible', timeout: 15000 });

  // Then wait for options — but with a longer timeout since deployed API is slower
  await page.waitForFunction(
    () => {
      const select = document.querySelector('select');
      return select && select.querySelectorAll('option').length > 1;
    },
    { timeout: 15000 }
  );
}


// ── Helper: select module then click the HEADER "Add Manually" button ─────────
// Targets the FIRST button (header) by CSS class to avoid strict mode violation

async function openManualForm(page) {
  // Wait for modules to populate
  await page.waitForFunction(
    () => {
      const select = document.querySelector('select');
      return select && select.querySelectorAll('option').length > 1;
    },
    { timeout: 10000 }
  );

  // Select first module
  await page.locator('select').first().selectOption(MOCK_MODULES[0].id);

  // Wait for goals to load (so empty state — and its 2nd Add Manually — won't appear)
  await page.waitForResponse('**/api/goals*', { timeout: 5000 }).catch(() => { });

  // Target ONLY the header button by its specific class — avoids strict mode violation
  const headerAddBtn = page.locator('button.subjects-btn', { hasText: '+ Add Manually' });
  await expect(headerAddBtn).toBeEnabled({ timeout: 5000 });
  await headerAddBtn.click();

  // Confirm form opened
  await expect(page.getByText('📝 Add Manually')).toBeVisible({ timeout: 5000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Goals - Manual Goal Creation', () => {

  test.beforeEach(async ({ page, context }) => {
    await setupPage(page, context);
  });


  // ── Button enables after module selection ──────────────────────────────

  test('should enable add manually button after module selected', async ({ page }) => {
    await page.waitForFunction(
      () => {
        const select = document.querySelector('select');
        return select && select.querySelectorAll('option').length > 1;
      },
      { timeout: 10000 }
    );

    await page.locator('select').first().selectOption(MOCK_MODULES[0].id);

    const headerAddBtn = page.locator('button.subjects-btn', { hasText: '+ Add Manually' });
    await expect(headerAddBtn).toBeEnabled({ timeout: 5000 });
  });


  // ──  Form renders all required fields ───────────────────────────────────

  test('should display manual form with all fields', async ({ page }) => {
    await openManualForm(page);

    await expect(page.locator('input[placeholder="e.g. Complete Lab 7"]')).toBeVisible();
    await expect(
      page.locator('textarea[placeholder="What do you need to achieve in this goal?"]')
    ).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. Y3S1"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    // Color dropdown: nth(1) because nth(0) is the module selector
    await expect(page.locator('select').nth(1)).toBeVisible();
    await expect(
      page.locator('textarea[placeholder="Type a step and press Add or Enter…"]')
    ).toBeVisible();
  });


  // ── Add step via Enter key ────────────────────────────────────────────

  test('should add a step by pressing Enter in step adder', async ({ page }) => {
    await openManualForm(page);

    const stepAdder = page.locator(
      'textarea[placeholder="Type a step and press Add or Enter…"]'
    );
    await stepAdder.fill('Press Enter step');
    await stepAdder.press('Enter');

    await expect(page.locator('.goals-manual-step-text').first()).toHaveText('Press Enter step');
  });


  // ── same approach for semester validation (Edge Cases) ────────────────────────────────────────────
  test('should show error when submitting without semester tag', async ({ page }) => {
    await openManualForm(page);

    await page.locator('input[placeholder="e.g. Complete Lab 7"]').fill('My Goal');
    // Leave semester empty

    // Add a step
    const stepAdder = page.locator(
      'textarea[placeholder="Type a step and press Add or Enter…"]'
    );
    await stepAdder.fill('A step');
    await page.locator('button.goals-step-adder-btn').click();

    // Disable browser native validation so JS validation in submitGoal() runs
    await page.evaluate(() => {
      document.querySelectorAll('form').forEach(f => { f.noValidate = true; });
    });

    await page.locator('button.subjects-btn', { hasText: /Create Goal/i }).click();

    await expect(page.locator('.subjects-error')).toContainText(
      /Semester tag is required/i,
      { timeout: 5000 }
    );
  });

  // ── Validation: at least one step required ────────────────────────────

  test('should show error when submitting with no steps', async ({ page }) => {
    await openManualForm(page);

    await page.locator('input[placeholder="e.g. Complete Lab 7"]').fill('My Goal');
    await page.locator('input[placeholder="e.g. Y3S1"]').fill('Y3S1');

    // No steps added
    await page.locator('button.subjects-btn', { hasText: /Create Goal/i }).click();

    await expect(page.locator('.subjects-error')).toContainText(/Add at least one step/i);
  });


  // ── 20. Successful goal creation (Happy Path)─────────────────────────────────────────

  test('should create a goal and add it to the list', async ({ page }) => {
    const newGoal = {
      id: 'goal-new',
      name: 'New Manual Goal',
      description: 'Test description',
      semester: 'Y3S1',
      colorTag: 'Green',
      deadlineDate: null,
      stepByStepGuidance: ['Step A'],
      submissionGuidelines: '',
      isCompleted: false,
      subjectId: 'mod-001',
    };

    await page.route('**/api/modules/manual', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newGoal),
        });
      } else {
        route.continue();
      }
    });

    await openManualForm(page);

    await page.locator('input[placeholder="e.g. Complete Lab 7"]').fill('New Manual Goal');
    await page.locator('input[placeholder="e.g. Y3S1"]').fill('Y3S1');
    await page.locator('select').nth(1).selectOption('Green');

    const stepAdder = page.locator(
      'textarea[placeholder="Type a step and press Add or Enter…"]'
    );
    await stepAdder.fill('Step A');
    await page.locator('button.goals-step-adder-btn').click();

    await page.locator('button.subjects-btn', { hasText: /Create Goal/i }).click();

    // Form closes after successful create
    await expect(page.getByText('📝 Add Manually')).not.toBeVisible({ timeout: 8000 });
    await expect(page.locator('.goals-goal-name').first()).toHaveText('New Manual Goal');
  });


});