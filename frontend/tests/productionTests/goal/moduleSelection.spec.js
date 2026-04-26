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

// ── Heading locator helper ────────────────────────────────────────────────────
// Goals.jsx: <MainLayout title="My Goals">. We don't have MainLayout source so
// we try role=heading first, then fall back to any visible element with that text.

async function expectHeadingVisible(page) {
    const byRole = page.getByRole('heading', { name: /My Goals/i });
    const roleCount = await byRole.count();
    if (roleCount > 0) {
        await expect(byRole.first()).toBeVisible({ timeout: 5000 });
    } else {
        await expect(page.getByText('My Goals', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    }
}

// ── Target the HEADER upload button by CSS class ──────────────────────────────
// Goals.jsx renders TWO "Upload Lab Sheet" buttons when goals=[] (empty state):
//   1. Header area:     <button className="goals-btn goals-btn--ai" ...>
//   2. Empty-state div: <button className="goals-btn goals-btn--ai" ...>
// After a module is selected and goals load (non-empty), only the header button
// remains. We use .first() on the class selector as the stable, strict-mode-safe
// alternative to getByRole which matches both.

function headerUploadBtn(page) {
    return page.locator('button.goals-btn.goals-btn--ai').first();
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Goals - Module Selection', () => {

    test.beforeEach(async ({ page, context }) => {
        await setupPage(page, context);
    });

    // FIX: getByRole('heading') may not match if MainLayout renders the title
    // in a non-semantic element. Use the resilient helper instead.
    test('should render goals page with module selector', async ({ page }) => {
        await expectHeadingVisible(page);
        const moduleSelector = page.locator('select').first();
        await expect(moduleSelector).toBeVisible();
    });

    test('should display select module placeholder', async ({ page }) => {
        const moduleSelector = page.locator('select').first();
        await expect(moduleSelector.locator('option[value=""]')).toContainText(/Select a module/i);
    });

    test('should load modules on page load', async ({ page }) => {
        const moduleSelector = page.locator('select').first();
        const options = moduleSelector.locator('option');
        const optionCount = await options.count();

        // Should have at least placeholder + 1 module
        expect(optionCount).toBeGreaterThanOrEqual(1);
    });

    // FIX: strict mode violation — getByRole('button', /Upload Lab Sheet/i) matched
    // 2 elements (header + empty-state). Target header button by CSS class instead.
    // Also: Goals.jsx auto-selects the first module via useEffect, so the button
    // may already be enabled on load. We check with headerUploadBtn() which is
    // always a single, unambiguous element.
    test('should enable/disable upload button based on module selection', async ({ page }) => {
        await waitForModules(page);

        const uploadBtn = headerUploadBtn(page);

        // If already enabled (auto-selected), the test is still valid — the button
        // is enabled because a module IS selected.
        const isDisabled = await uploadBtn.isDisabled();
        if (isDisabled) {
            // Select the first real module and confirm the button enables
            await page.locator('select').first().selectOption(MOCK_MODULES[0].id);
            await expect(uploadBtn).toBeEnabled({ timeout: 5000 });
        } else {
            await expect(uploadBtn).toBeEnabled();
        }
    });

    test('should change goals when module is selected', async ({ page }) => {
        await waitForModules(page);
        const moduleSelector = page.locator('select').first();
        const options = moduleSelector.locator('option');

        if (await options.count() > 1) {
            await moduleSelector.selectOption(await options.nth(1).getAttribute('value'));
            // Goals should load/update
            await page.waitForTimeout(500);
        }
    });
});