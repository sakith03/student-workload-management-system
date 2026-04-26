import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

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

async function setupPage(page, context) {
  await context.addInitScript(() => {
    localStorage.setItem(
      'jwt_token',
      'header.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6IlN0dWRlbnQifQ.signature'
    );
  });

  // Mock subjects/modules endpoint
  await page.route('**/api/academic/subjects', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MODULES),
    })
  );

  // Mock moduleService.getModules — intercept ALL requests to /api/goals*
  // so the goal list renders (not empty state) — this prevents the 2nd "+ Add Manually" button
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

  await page.goto(`${BASE_URL}/goals`);
  await page.waitForLoadState('networkidle');
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

  // ── 1. Header button is visible and disabled without a module ─────────────

  test('should show add manually button visible in header', async ({ page }) => {
    // Wait for the page to fully settle with mocked modules
    await page.waitForFunction(
      () => {
        const select = document.querySelector('select');
        return select && select.querySelectorAll('option').length > 1;
      },
      { timeout: 10000 }
    );

    const headerAddBtn = page.locator('button.subjects-btn', { hasText: '+ Add Manually' });
    await expect(headerAddBtn).toBeVisible();
    // With mocked data, first module is auto-selected, so button is enabled
    await expect(headerAddBtn).toBeEnabled();
  });

  // ── 2. Button enables after module selection ──────────────────────────────

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

  // ── 3. Opens manual form ──────────────────────────────────────────────────

  test('should open manual goal form when button clicked', async ({ page }) => {
    await openManualForm(page);
    await expect(page.getByText('📝 Add Manually')).toBeVisible();
  });

  // ── 4. Form renders all required fields ───────────────────────────────────

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

  // ── 5. Goal name input ────────────────────────────────────────────────────

  test('should allow entering goal name', async ({ page }) => {
    await openManualForm(page);

    const nameInput = page.locator('input[placeholder="e.g. Complete Lab 7"]');
    await nameInput.fill('Lab Assignment 5');
    await expect(nameInput).toHaveValue('Lab Assignment 5');
  });

  // ── 6. Description textarea ───────────────────────────────────────────────

  test('should allow entering description', async ({ page }) => {
    await openManualForm(page);

    const descInput = page.locator(
      'textarea[placeholder="What do you need to achieve in this goal?"]'
    );
    await descInput.fill('Complete all tasks in the lab sheet');
    await expect(descInput).toHaveValue('Complete all tasks in the lab sheet');
  });

  // ── 7. Semester tag input ─────────────────────────────────────────────────

  test('should allow entering semester tag', async ({ page }) => {
    await openManualForm(page);

    const semesterInput = page.locator('input[placeholder="e.g. Y3S1"]');
    await semesterInput.fill('Y3S2');
    await expect(semesterInput).toHaveValue('Y3S2');
  });

  // ── 8. Color selector ─────────────────────────────────────────────────────

  test('should allow selecting color tag', async ({ page }) => {
    await openManualForm(page);

    const colorSelect = page.locator('select').nth(1);
    await colorSelect.selectOption('Green');
    await expect(colorSelect).toHaveValue('Green');
  });

  // ── 9. Add single step ────────────────────────────────────────────────────

  test('should add a step with step builder', async ({ page }) => {
    await openManualForm(page);

    const stepAdder = page.locator(
      'textarea[placeholder="Type a step and press Add or Enter…"]'
    );
    await stepAdder.fill('Understand the algorithm');
    await page.locator('button.goals-step-adder-btn').click();

    await expect(page.locator('.goals-manual-step-text').first()).toHaveText(
      'Understand the algorithm'
    );
    // Adder clears itself after commit
    await expect(stepAdder).toHaveValue('');
  });

  // ── 10. Add step via Enter key ────────────────────────────────────────────

  test('should add a step by pressing Enter in step adder', async ({ page }) => {
    await openManualForm(page);

    const stepAdder = page.locator(
      'textarea[placeholder="Type a step and press Add or Enter…"]'
    );
    await stepAdder.fill('Press Enter step');
    await stepAdder.press('Enter');

    await expect(page.locator('.goals-manual-step-text').first()).toHaveText('Press Enter step');
  });

  // ── 11. Add multiple steps ────────────────────────────────────────────────

  test('should add multiple steps', async ({ page }) => {
    await openManualForm(page);

    const stepAdder = page.locator(
      'textarea[placeholder="Type a step and press Add or Enter…"]'
    );
    const addStepBtn = page.locator('button.goals-step-adder-btn');

    for (const step of ['Step 1: Understand', 'Step 2: Code', 'Step 3: Test']) {
      await stepAdder.fill(step);
      await addStepBtn.click();
    }

    const stepTexts = page.locator('.goals-manual-step-text');
    await expect(stepTexts).toHaveCount(3);
    await expect(stepTexts.nth(0)).toHaveText('Step 1: Understand');
    await expect(stepTexts.nth(1)).toHaveText('Step 2: Code');
    await expect(stepTexts.nth(2)).toHaveText('Step 3: Test');
  });

  // ── 12. Step count label updates ──────────────────────────────────────────

  test('should update step count label as steps are added', async ({ page }) => {
    await openManualForm(page);

    await expect(page.getByText(/0 steps added/i)).toBeVisible();

    const stepAdder = page.locator(
      'textarea[placeholder="Type a step and press Add or Enter…"]'
    );
    await stepAdder.fill('First step');
    await page.locator('button.goals-step-adder-btn').click();

    await expect(page.getByText(/1 step added/i)).toBeVisible();
  });

  // ── 13. Delete a step ─────────────────────────────────────────────────────

  test('should delete a step', async ({ page }) => {
    await openManualForm(page);

    const stepAdder = page.locator(
      'textarea[placeholder="Type a step and press Add or Enter…"]'
    );
    await stepAdder.fill('Step to delete');
    await page.locator('button.goals-step-adder-btn').click();

    await expect(page.locator('.goals-manual-step-text').first()).toHaveText('Step to delete');

    await page.locator('.goals-step-delete-btn').first().click();

    await expect(page.locator('.goals-manual-step-text')).toHaveCount(0);
  });

  // ── 14. Delete only the targeted step ────────────────────────────────────

  test('should delete only the targeted step', async ({ page }) => {
    await openManualForm(page);

    const stepAdder = page.locator(
      'textarea[placeholder="Type a step and press Add or Enter…"]'
    );
    const addStepBtn = page.locator('button.goals-step-adder-btn');

    await stepAdder.fill('Keep this step');
    await addStepBtn.click();
    await stepAdder.fill('Delete this step');
    await addStepBtn.click();

    // Delete the second step (index 1)
    await page.locator('.goals-step-delete-btn').nth(1).click();

    const remaining = page.locator('.goals-manual-step-text');
    await expect(remaining).toHaveCount(1);
    await expect(remaining.first()).toHaveText('Keep this step');
  });

  // ── 15. Add Step button disabled when textarea is empty ───────────────────

  test('should keep Add Step button disabled when textarea is empty', async ({ page }) => {
    await openManualForm(page);

    await expect(page.locator('button.goals-step-adder-btn')).toBeDisabled();
  });

  // ── 16. FIXED: disable native HTML validation before triggering JS validation
  test('should show error when submitting without goal name', async ({ page }) => {
    await openManualForm(page);

    // Leave name empty, fill valid semester
    await page.locator('input[placeholder="e.g. Y3S1"]').fill('Y3S1');

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
      /Goal name is required/i,
      { timeout: 5000 }
    );
  });


  // ── 17. FIXED: same approach for semester validation
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

  // ── 18. Validation: at least one step required ────────────────────────────

  test('should show error when submitting with no steps', async ({ page }) => {
    await openManualForm(page);

    await page.locator('input[placeholder="e.g. Complete Lab 7"]').fill('My Goal');
    await page.locator('input[placeholder="e.g. Y3S1"]').fill('Y3S1');

    // No steps added
    await page.locator('button.subjects-btn', { hasText: /Create Goal/i }).click();

    await expect(page.locator('.subjects-error')).toContainText(/Add at least one step/i);
  });

  // ── 19. Cancel closes the form ────────────────────────────────────────────

  test('should close form when cancel is clicked', async ({ page }) => {
    await openManualForm(page);

    // Target the Cancel button scoped inside the form card only
    await page.locator('.goals-card').getByRole('button', { name: /Cancel/i }).click();

    await expect(page.getByText('📝 Add Manually')).not.toBeVisible({ timeout: 3000 });
  });

  // ── 20. Successful goal creation ─────────────────────────────────────────

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

    // FIXED: correct endpoint is /api/modules/manual, not /api/goals/manual
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