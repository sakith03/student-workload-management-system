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

// ── Helper: wait for modules then select mod-001 ──────────────────────────────
// WHY: Goals.jsx shows an empty-state panel when no module is selected or goals=[].
// That panel contains a SECOND "✦ Upload Lab Sheet" button. Without a module
// selected, getByRole('button', /Upload Lab Sheet/i) resolves to 2 elements and
// Playwright throws a strict-mode violation. Selecting a module + loading goals
// collapses the empty state so only the single header button remains.

async function selectFirstModule(page) {
    await page.waitForFunction(
        () => {
            const select = document.querySelector('select');
            return select && select.querySelectorAll('option').length > 1;
        },
        { timeout: 10000 }
    );
    await page.locator('select').first().selectOption(MOCK_MODULES[0].id);
    // Wait for the mocked goals response so the empty-state panel disappears
    await page.waitForResponse('**/api/goals*', { timeout: 5000 }).catch(() => { });
    await page.waitForTimeout(300);
}

// ── Scope to the header button by CSS class to avoid strict-mode violation ────
// goals-btn--ai appears on the header button (always rendered) and on the
// empty-state button (only rendered when goals=[]).  After selectFirstModule()
// the empty-state is gone, so .first() is the unique header button.

function headerUploadBtn(page) {
    return page.locator('button.goals-btn.goals-btn--ai').first();
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Goals - Upload Lab Sheet (AI)', () => {

    test.beforeEach(async ({ page, context }) => {
        await setupPage(page, context);
        // Select module so empty-state (and its duplicate upload button) never renders
        await selectFirstModule(page);
    });

    test('should show upload zone when upload button clicked', async ({ page }) => {
        const uploadBtn = headerUploadBtn(page);
        await expect(uploadBtn).toBeEnabled({ timeout: 5000 });
        await uploadBtn.click();
        await expect(page.getByText(/AI Goal Extraction/i)).toBeVisible();
    });

    test('should display upload zone with drag & drop area', async ({ page }) => {
        const uploadBtn = headerUploadBtn(page);
        await expect(uploadBtn).toBeEnabled({ timeout: 5000 });
        await uploadBtn.click();

        const uploadZone = page.locator('[class*="upload-zone"]').first();
        await expect(uploadZone).toBeVisible();
        await expect(page.getByText(/Drag & drop/i)).toBeVisible();
    });

    test('should show file type badges (PDF, DOCX, DOC)', async ({ page }) => {
        const uploadBtn = headerUploadBtn(page);
        await expect(uploadBtn).toBeEnabled({ timeout: 5000 });
        await uploadBtn.click();

        await expect(page.getByText('PDF')).toBeVisible();
        await expect(page.getByText('DOCX')).toBeVisible();
        // await expect(page.getByText('DOC')).toBeVisible();
    });

    test('should show max file size (10 MB)', async ({ page }) => {
        const uploadBtn = headerUploadBtn(page);
        await expect(uploadBtn).toBeEnabled({ timeout: 5000 });
        await uploadBtn.click();

        await expect(page.getByText(/Max 10 MB/i)).toBeVisible();
    });

    test('should close upload zone with cancel button', async ({ page }) => {
        const uploadBtn = headerUploadBtn(page);
        await expect(uploadBtn).toBeEnabled({ timeout: 5000 });
        await uploadBtn.click();

        await expect(page.getByText(/AI Goal Extraction/i)).toBeVisible();
        const cancelBtn = page.getByRole('button', { name: /Cancel/i }).last();
        await cancelBtn.click();

        await expect(page.getByText(/AI Goal Extraction/i)).not.toBeVisible({ timeout: 3000 });
    });

    test('should close upload zone with close button', async ({ page }) => {
        const uploadBtn = headerUploadBtn(page);
        await expect(uploadBtn).toBeEnabled({ timeout: 5000 });
        await uploadBtn.click();

        await expect(page.getByText(/AI Goal Extraction/i)).toBeVisible();
        const closeBtn = page.locator('button').filter({ hasText: '✕' }).first();
        if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await expect(page.getByText(/AI Goal Extraction/i)).not.toBeVisible({ timeout: 3000 });
        }
    });
});