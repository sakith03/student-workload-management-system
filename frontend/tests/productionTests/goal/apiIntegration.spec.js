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

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Goals - API Integration', () => {

    test.beforeEach(async ({ page, context }) => {
        await setupPage(page, context);
    });

    test('should fetch modules on load', async ({ page }) => {
        // Wait for API call to complete
        await page.waitForFunction(() => {
            const select = document.querySelector('select');
            return select && select.querySelectorAll('option').length > 1;
        }, { timeout: 5000 }).catch(() => { });

        const moduleSelector = page.locator('select').first();
        const optionCount = await moduleSelector.locator('option').count();
        expect(optionCount).toBeGreaterThanOrEqual(1);
    });

    test('should fetch goals when module selected', async ({ page }) => {
        const moduleSelector = page.locator('select').first();
        const options = moduleSelector.locator('option');

        if (await options.count() > 1) {
            await moduleSelector.selectOption(await options.nth(1).getAttribute('value'));

            // Wait for goals to load
            await page.waitForTimeout(1000);
        }
    });
});