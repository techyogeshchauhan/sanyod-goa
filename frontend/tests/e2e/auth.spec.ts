import { expect, test, type Page } from '@playwright/test';

const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function openMenuIfCollapsed(page: Page) {
  const toggler = page.locator('.navbar-toggler');
  if (await toggler.isVisible()) {
    await toggler.click();
    await expect(page.locator('#navbarCollapse')).toHaveClass(/show/);
  }
}

test('register → navbar shows the user → logout → login again', async ({ page }) => {
  const email = unique();
  await page.goto('/register');
  await expect(page.locator('.register-card .card-header')).toHaveText('User Registration');
  await page.fill('#name', 'E2E Seeker');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Register")');

  await expect(page).toHaveURL(/\/$/);
  await openMenuIfCollapsed(page);
  await expect(page.locator('.navbar')).toContainText('E2E Seeker');
  await expect(page.locator('.navbar a[href="/my-books"]')).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await openMenuIfCollapsed(page);
  await expect(page.locator('.navbar a[href="/login"]')).toBeVisible();

  await page.fill('#email', email);
  await page.fill('#password', 'wrong-pass');
  await page.click('button:has-text("Login")');
  await expect(page.locator('.login-card .alert-danger')).toHaveText('Invalid email or password');

  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL(/\/$/);
});

test('protected page redirects to login and returns after login', async ({ page }) => {
  const email = unique();
  // Create the account through the API first.
  await page.goto('/register');
  await page.fill('#name', 'Return Tester');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Register")');
  await expect(page).toHaveURL(/\/$/);
  await openMenuIfCollapsed(page);
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/my-books');
  await expect(page).toHaveURL(/\/login$/);
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL(/\/my-books$/);
});

test('duplicate email shows the server message under the field', async ({ page }) => {
  const email = unique();
  await page.goto('/register');
  await page.fill('#name', 'First');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Register")');
  await expect(page).toHaveURL(/\/$/);
  await openMenuIfCollapsed(page);
  await page.getByRole('button', { name: 'Logout' }).click();

  await page.goto('/register');
  await page.fill('#name', 'Second');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Register")');
  await expect(page.locator('.register-card .alert-danger')).toHaveText('This email is already registered');
  await expect(page.locator('.invalid-feedback')).toHaveText('This email is already registered');
});

test('forgot password confirms without revealing whether the email exists', async ({ page }) => {
  await page.goto('/forgot-password');
  await page.fill('#email', 'nobody-here@example.com');
  await page.click('button:has-text("Generate Reset Link")');
  await expect(page.locator('.forget-card .alert-success')).toContainText('Check Your Email');
});

test('reset link without a token shows the invalid state', async ({ page }) => {
  await page.goto('/reset-password');
  await expect(page.locator('.reset-card')).toContainText('Invalid reset link parameters.');
  await expect(page.locator('.reset-card h3')).toHaveText('Invalid Reset Link');
});

test('legacy PHP URLs redirect to the new routes', async ({ page }) => {
  await page.goto('/forget.php');
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.goto('/Courses.php');
  await expect(page).toHaveURL(/\/courses$/);
});
