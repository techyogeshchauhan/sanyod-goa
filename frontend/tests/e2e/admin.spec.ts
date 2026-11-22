/// <reference types="node" />
import { expect, test, type Page } from '@playwright/test';

// Admin panel through the real UI. Run against a throwaway database:
//   E2E_ADMIN_USER=<superadmin> E2E_ADMIN_PASSWORD=<pw> [E2E_PLAIN_USER=<admin> E2E_PLAIN_PASSWORD=<pw>]
//   npx playwright test admin --project=desktop
// It saves settings (test UPI IDs) and creates/deletes a book, so never point it at live data.

const ADMIN_USER = process.env.E2E_ADMIN_USER;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const PLAIN_USER = process.env.E2E_PLAIN_USER;
const PLAIN_PASSWORD = process.env.E2E_PLAIN_PASSWORD;

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test.skip(!ADMIN_USER || !ADMIN_PASSWORD, 'Set E2E_ADMIN_USER and E2E_ADMIN_PASSWORD');
test.skip(({ isMobile }) => isMobile, 'Desktop admin flows');
test.describe.configure({ mode: 'serial' });

/** Uncaught exceptions and console errors (the panel must not log any while working normally). */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return errors;
}

async function login(page: Page, username: string, password: string) {
  await page.goto('/admin/login');
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button:has-text("Login")');
  await expect(page.locator('.admin-page-title h1')).toHaveText(/Dashboard/);
}

const heading = (page: Page) => page.locator('.admin-page-title h1');
const field = (page: Page, label: string) => page.locator(`.modal label:has-text("${label}") + input`).first();

const ROUTES: [string, RegExp][] = [
  ['/admin', /Dashboard/],
  ['/admin/payments', /Payments/],
  ['/admin/orders', /Book Orders/],
  ['/admin/books', /Books/],
  ['/admin/courses', /Courses/],
  ['/admin/doctors', /Doctors/],
  ['/admin/events', /Programmes/],
  ['/admin/consultations', /Consultation Requests/],
  ['/admin/bookings', /Event Bookings/],
  ['/admin/users', /Users/],
  ['/admin/messages', /Messages/],
  ['/admin/newsletter', /Newsletter Subscribers/],
  ['/admin/settings', /Settings/],
  ['/admin/admins', /Admin Accounts/],
  ['/admin/activity', /Activity Log/],
  ['/admin/account', /My Password/],
];

test('every admin page loads without errors', async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, ADMIN_USER as string, ADMIN_PASSWORD as string);
  for (const [path, title] of ROUTES) {
    await page.goto(path);
    await expect(heading(page), path).toHaveText(title);
    await expect(page.locator('.spinner-border')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator('.alert-danger'), `${path} shows an error`).toHaveCount(0);
  }
  // Course videos (reached from the course list).
  await page.goto('/admin/courses');
  await page.locator('table a:has-text("Videos")').first().click();
  await expect(heading(page)).toHaveText(/Videos: /);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('settings: a super admin saves payment details', async ({ page }) => {
  await login(page, ADMIN_USER as string, ADMIN_PASSWORD as string);
  await page.goto('/admin/settings');
  const upi = page.locator('label:has-text("UPI ID for courses and events") + input');
  await upi.fill('e2e-audit@upi');
  await page.locator('label:has-text("UPI ID shown for book PDFs") + input').fill('e2e-audit@upi');
  await page.locator('label:has-text("UPI ID shown for hard copies") + input').fill('e2e-audit@upi');
  await expect(page.locator('label:has-text("Send new-order alerts to") + input')).toHaveAttribute('placeholder', 'empty = no email alerts');

  // A bad opening-hours row is reported (it has no inline slot).
  await page.click('button:has-text("Add row")');
  await page.click('button:has-text("Save settings")');
  await expect(page.locator('.alert-danger li').first()).toContainText('Opening hours, row');
  await page.locator('button:has-text("Remove")').last().click();

  await page.click('button:has-text("Save settings")');
  await expect(page.locator('.swal2-toast')).toContainText('Settings saved');
  await page.reload();
  await expect(upi).toHaveValue('e2e-audit@upi');
});

test('books: create, clear an optional field, delete', async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, ADMIN_USER as string, ADMIN_PASSWORD as string);
  await page.goto('/admin/books');
  const title = `E2E Audit Book ${Date.now()}`;
  await page.click('button:has-text("Add Book")');
  await field(page, 'Title *').fill(title);
  await field(page, 'PDF price').fill('99');
  await field(page, 'Rating (0-5)').fill('9'); // out of range: shown under the field
  await page.locator('.modal label:has-text("Cover image") + div input[type=file]').setInputFiles({ name: 'c.png', mimeType: 'image/png', buffer: PNG });
  await page.locator('.modal button:has-text("Save")').click();
  await expect(page.locator('.modal .invalid-feedback')).toContainText('between 0 and 5');
  await field(page, 'Rating (0-5)').fill('4.5');
  await page.locator('.modal button:has-text("Save")').click();
  await expect(page.locator('.swal2-toast')).toContainText('Book added');

  await page.locator('input[type=search]').fill(title);
  const row = page.locator('tr', { hasText: title });
  await expect(row).toHaveCount(1);
  await row.locator('button:has-text("Edit")').click();
  await expect(field(page, 'Rating (0-5)')).toHaveValue('4.5');
  await field(page, 'Rating (0-5)').fill('');
  await page.locator('.modal button:has-text("Save")').click();
  await expect(page.locator('.swal2-toast')).toContainText('Book saved');
  await row.locator('button:has-text("Edit")').click();
  await expect(field(page, 'Rating (0-5)')).toHaveValue(''); // cleared, not kept
  await page.locator('.modal button:has-text("Cancel")').click();

  await row.locator('button[title=Delete]').click();
  await page.locator('.swal2-confirm').click();
  await expect(page.locator('.swal2-toast')).toContainText('Book deleted');
  await expect(row).toHaveCount(0);
  // The one 400 is the out-of-range rating above (the browser logs every failed request).
  expect(errors.filter((e) => !e.includes('status of 400'))).toEqual([]);
  expect(errors.filter((e) => e.includes('status of 400'))).toHaveLength(1);
});

test('messages: switching tabs clears the search', async ({ page }) => {
  await login(page, ADMIN_USER as string, ADMIN_PASSWORD as string);
  await page.goto('/admin/messages');
  const searched = page.waitForResponse((r) => r.url().includes('/admin/messages') && r.url().includes('q=nothing-matches-this'));
  await page.locator('input[type=search]').fill('nothing-matches-this');
  await searched; // the search box applies its text after a short pause
  await expect(page.locator('td', { hasText: 'No messages.' })).toBeVisible();
  await page.click('button:has-text("Free consultation requests")');
  await expect(page.locator('input[type=search]')).toHaveValue('');
});

test('a missing record shows an error instead of spinning', async ({ page }) => {
  await login(page, ADMIN_USER as string, ADMIN_PASSWORD as string);
  await page.goto('/admin/users/000000000000000000000000');
  await expect(page.locator('.alert-danger')).toContainText('User not found');
  await expect(page.locator('.alert-danger button:has-text("Retry")')).toBeVisible();
});

test('an expired session returns to the login page, then back', async ({ page, context }) => {
  await login(page, ADMIN_USER as string, ADMIN_PASSWORD as string);
  await page.goto('/admin/users');
  await expect(heading(page)).toHaveText(/Users/);
  // The server forgets the session (expiry, revocation): drop the cookie.
  const cookies = await context.cookies();
  await context.clearCookies();
  await context.addCookies(cookies.filter((c) => c.name !== 'sanyod.admin.sid'));
  await page.locator('.admin-sidebar a:has-text("Books")').click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.fill('#username', ADMIN_USER as string);
  await page.fill('#password', ADMIN_PASSWORD as string);
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL(/\/admin\/books$/);
  await expect(heading(page)).toHaveText(/Books/);
});

test('a plain admin cannot reach settings or admin accounts', async ({ page }) => {
  test.skip(!PLAIN_USER || !PLAIN_PASSWORD, 'Set E2E_PLAIN_USER and E2E_PLAIN_PASSWORD');
  await login(page, PLAIN_USER as string, PLAIN_PASSWORD as string);
  await expect(page.locator('.admin-sidebar a:has-text("Settings")')).toHaveCount(0);
  await expect(page.locator('.admin-sidebar a:has-text("Admin Accounts")')).toHaveCount(0);
  await page.goto('/admin/settings');
  await expect(page.locator('.alert-warning')).toContainText('Only a super admin');
  await page.goto('/admin/admins');
  await expect(page.locator('.alert-warning')).toContainText('Only a super admin');
});
