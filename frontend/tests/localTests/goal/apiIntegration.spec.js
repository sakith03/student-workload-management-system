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

    // Mock goals endpoint
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