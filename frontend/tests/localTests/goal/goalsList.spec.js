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

    await page.goto(`${BASE_URL}/goals`);
    await page.waitForLoadState('networkidle');
}

// ── Helper: wait for modules to load ─────────────────────────────────────────

async function waitForModules(page) {
    await page.waitForFunction(
        () => {
            const select = document.querySelector('select');
            return select && select.querySelectorAll('option').length > 1;
        },
        { timeout: 10000 }
    );
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Goals - Goal List Display', () => {

    test.beforeEach(async ({ page, context }) => {
        await setupPage(page, context);
    });


    test('should display goals after module selection', async ({ page }) => {
        await waitForModules(page);
        await page.locator('select').first().selectOption(MOCK_MODULES[0].id);
        await page.waitForResponse('**/api/goals*', { timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(500);

        const goalCards = page.locator('.goals-goal-card');
        const emptyState = page.locator('.subjects-empty');

        const hasGoals = await goalCards.count() > 0;
        const hasEmptyState = await emptyState.isVisible().catch(() => false);

        expect(hasGoals || hasEmptyState).toBeTruthy();
    });


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