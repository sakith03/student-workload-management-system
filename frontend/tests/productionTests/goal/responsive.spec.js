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

// ── Viewport-aware setup ──────────────────────────────────────────────────────
// WHY: setViewportSize() called AFTER page.goto() can trigger a React re-render
// or route re-evaluation in some SPA routers, occasionally causing the heading
// to unmount momentarily. Setting the viewport BEFORE goto() guarantees the
// page's first render already uses the target dimensions.

async function setupPageAtViewport(page, context, width, height) {
    await page.setViewportSize({ width, height });
    await setupPage(page, context);
}

// ── Heading locator helper ────────────────────────────────────────────────────
// Goals.jsx passes title="My Goals" to MainLayout. We don't have MainLayout
// source, so we check both a semantic heading role AND a fallback text match
// to be resilient to whatever element MainLayout uses.

async function expectHeadingVisible(page) {
    // Try role=heading first (h1/h2/h3…)
    const byRole = page.getByRole('heading', { name: /My Goals/i });
    const byText = page.getByText('My Goals', { exact: true });

    const roleCount = await byRole.count();
    if (roleCount > 0) {
        await expect(byRole.first()).toBeVisible({ timeout: 5000 });
    } else {
        // Fallback: any element whose text is exactly "My Goals"
        await expect(byText.first()).toBeVisible({ timeout: 5000 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Goals - Responsive UI', () => {

    // Note: mobile and tablet tests set their own viewport BEFORE navigation,
    // so they do NOT use the shared beforeEach. The remaining tests use a
    // standard desktop setup via beforeEach.

    test.beforeEach(async ({ page, context }) => {
        await setupPage(page, context);
    });

    // FIX: viewport is set BEFORE goto() so the page renders at mobile size
    // from the very first paint — avoids post-load re-render issues.
    test('should be responsive on mobile', async ({ page, context }) => {
        // Override: set up fresh at mobile viewport (beforeEach already ran at
        // default size, so we reload at mobile size here)
        await setupPageAtViewport(page, context, 375, 667);
        await expectHeadingVisible(page);
    });

    test('should be responsive on tablet', async ({ page, context }) => {
        await setupPageAtViewport(page, context, 768, 1024);
        await expectHeadingVisible(page);
    });

    test('should show page heading', async ({ page }) => {
        await expectHeadingVisible(page);
    });

    test('should show page description', async ({ page }) => {
        await expect(page.getByText(/Track and manage/i)).toBeVisible();
    });
});