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