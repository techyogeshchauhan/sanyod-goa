import { expect, test, type Page } from '@playwright/test';

// Every route renders real content (no placeholder), without script errors and without
// sideways scrolling, on desktop and mobile.

const PUBLIC = [
  '/',
  '/about',
  '/contact',
  '/peace-building',
  '/spirituality/indian-knowledge',
  '/spirituality/library',
  '/spirituality/community',
  '/spirituality/personal-guidance',
  '/personality-test',
  '/books',
  '/courses',
  '/courses/emotional-command',
  '/health',
  '/login',
  '/register',
  '/forgot-password',
  '/admin/login',
];

const LOGGED_IN = [
  '/programs',
  '/books/patience-in-life',
  '/my-books',
  '/my-orders',
  '/my-courses',
  '/courses/emotional-command/payment',
  '/health/doctors/manoranjan-shau',
];

async function checkPage(page: Page, path: string) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText('This page is being rebuilt');
  await expect(page.locator('.spinner-border')).toHaveCount(0, { timeout: 15_000 });
  // Can the page actually be scrolled sideways? (clipped decorations don't count)
  const overflow = await page.evaluate(() => {
    window.scrollTo(10_000, window.scrollY);
    const x = window.scrollX;
    window.scrollTo(0, window.scrollY);
    return x;
  });
  expect(overflow, `${path} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1);
  expect(errors, `${path} script errors`).toEqual([]);
}

for (const path of PUBLIC) {
  test(`public page ${path}`, async ({ page }) => {
    await checkPage(page, path);
  });
}

test('logged-in pages', async ({ page }) => {
  const email = `e2e-pages-${Date.now()}@example.com`;
  await page.goto('/register');
  await page.fill('#name', 'Page Checker');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Register")');
  await expect(page).toHaveURL(/\/$/);
  for (const path of LOGGED_IN) await checkPage(page, path);
});

test('legacy PHP links redirect to the new pages', async ({ page }) => {
  await page.goto('/books.php');
  await expect(page).toHaveURL(/\/books$/);
  await page.goto('/course_details.php?subject_id=7');
  await expect(page).toHaveURL(/\/courses\/emotional-command$/);
  // The template Blog page was removed (Q7): old links land on the home page.
  await page.goto('/blog');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/blog.php');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/health.php');
  await expect(page).toHaveURL(/\/health$/);
});
