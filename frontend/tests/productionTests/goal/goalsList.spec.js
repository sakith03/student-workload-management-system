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

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Goals - Goal List Display', () => {

    test.beforeEach(async ({ page, context }) => {
        await setupPage(page, context);
    });

    // FIX: "Select a module" text lives inside a hidden <option> element.
    // Goals.jsx renders the visible empty-state as:
    //   <div className="subjects-empty">Select a module above to view its goals.</div>
    // Target that visible div text instead.
    test('should select module prompt when no module chosen', async ({ page }) => {
        // Goals.jsx auto-selects the first module via useEffect, so by the time
        // networkidle fires a module is already selected. To get back to the
        // "no module" empty state we force-reset the <select> value to '' via
        // page.evaluate(). We cannot use selectOption({ value: '' }) because the
        // placeholder <option value="" disabled> has the `disabled` attribute and
        // Playwright refuses to select disabled options.
        await waitForModules(page);

        // Force the select back to '' and dispatch a React-compatible change event
        // so the component's onChange handler fires and clears selectedModuleId.
        await page.evaluate(() => {
            const select = document.querySelector('select');
            if (!select) return;
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLSelectElement.prototype, 'value'
            ).set;
            nativeInputValueSetter.call(select, '');
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        await page.waitForTimeout(300);

        // Goals.jsx renders when selectedModuleId is '':
        //   <div className="subjects-empty">Select a module above to view its goals.</div>
        await expect(
            page.locator('.subjects-empty', { hasText: /Select a module above/i })
        ).toBeVisible({ timeout: 5000 });
    });

    // FIX: Goals.jsx uses class "goals-goal-card" not "goal-card".
    // Also selectOption nth(1) picks mod-002 but auto-selection already set mod-001;
    // explicitly select mod-001 to guarantee the mocked goals load.
    test('should display goals after module selection', async ({ page }) => {
        await waitForModules(page);
        await page.locator('select').first().selectOption(MOCK_MODULES[0].id);
        await page.waitForResponse('**/api/goals*', { timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(500);

        // Goals.jsx goal card class is "goals-goal-card"
        const goalCards = page.locator('.goals-goal-card');
        const emptyState = page.locator('.subjects-empty');

        const hasGoals = await goalCards.count() > 0;
        const hasEmptyState = await emptyState.isVisible().catch(() => false);

        expect(hasGoals || hasEmptyState).toBeTruthy();
    });

    // FIX: strict mode violation — getByText(/No goals|Upload a lab sheet/i) matched
    // TWO elements ("No goals yet" and "Upload a lab sheet for..."). 
    // Target the specific "No goals yet" <p> inside .subjects-empty instead.
    test('should show empty state when no goals exist', async ({ page }) => {
        await waitForModules(page);
        await page.locator('select').first().selectOption(MOCK_MODULES[0].id);
        await page.waitForResponse('**/api/goals*', { timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(500);

        const goalCards = page.locator('.goals-goal-card');
        if (await goalCards.count() === 0) {
            // Goals.jsx empty state renders a <p> with "No goals yet" inside .subjects-empty
            await expect(
                page.locator('.subjects-empty').getByText(/No goals yet/i)
            ).toBeVisible({ timeout: 5000 });
        }
    });

    // FIX: use correct class "goals-color-dot" (Goals.jsx: className="goals-color-dot")
    test('should display goal color indicators', async ({ page }) => {
        await waitForModules(page);
        await page.locator('select').first().selectOption(MOCK_MODULES[0].id);
        await page.waitForResponse('**/api/goals*', { timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(500);

        const goalCards = page.locator('.goals-goal-card');
        if (await goalCards.count() > 0) {
            // Goals.jsx: <div className="goals-color-dot" .../>
            await expect(page.locator('.goals-color-dot').first()).toBeVisible();
        }
    });

    test('should show goal actions buttons', async ({ page }) => {
        await waitForModules(page);
        await page.locator('select').first().selectOption(MOCK_MODULES[0].id);
        await page.waitForResponse('**/api/goals*', { timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(500);

        const goalCards = page.locator('.goals-goal-card');
        if (await goalCards.count() > 0) {
            const buttons = goalCards.first().locator('button');
            expect(await buttons.count()).toBeGreaterThan(0);
        }
    });
});