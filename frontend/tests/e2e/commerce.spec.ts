/// <reference types="node" />
import { expect, test, type Browser, type Page } from '@playwright/test';

// Full purchase flows through the real UI: customer pays → admin approves in the admin panel
// → customer gets access. Needs an admin account:
//   E2E_ADMIN_USER=<username> E2E_ADMIN_PASSWORD=<password> npx playwright test commerce --project=desktop

const ADMIN_USER = process.env.E2E_ADMIN_USER;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
// UPI IDs come from the admin Settings of the database under test: give E2E_UPI_ID to check an exact
// value (when every route uses the same ID), otherwise any UPI ID is accepted.
const UPI_ID = process.env.E2E_UPI_ID;
const upiPattern = UPI_ID ? new RegExp(UPI_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) : /\S+@\S+/;

// 1x1 PNG used as the payment screenshot.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const screenshot = { name: 'payment.png', mimeType: 'image/png', buffer: PNG };
const utr = () => `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`;

test.skip(!ADMIN_USER || !ADMIN_PASSWORD, 'Set E2E_ADMIN_USER and E2E_ADMIN_PASSWORD');
test.describe.configure({ mode: 'serial' });

async function registerCustomer(page: Page) {
  const email = `e2e-buyer-${Date.now()}@example.com`;
  await page.goto('/register');
  await page.fill('#name', 'E2E Buyer');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Register")');
  // Registration does not sign in (SEC-04): it answers generically, then the customer signs in.
  await expect(page.locator('.alert-success')).toContainText('If this address was available');
  await page.click('.alert-success a:has-text("Sign in")');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL(/\/$/);
  return email;
}

async function adminPage(browser: Browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/admin/login');
  await page.fill('#username', ADMIN_USER as string);
  await page.fill('#password', ADMIN_PASSWORD as string);
  await page.click('button:has-text("Login")');
  await expect(page.locator('.admin-page-title h1')).toHaveText(/Dashboard/);
  return page;
}

async function approve(admin: Page, orderNumber: string) {
  await admin.goto('/admin/payments');
  await admin.locator('input[type=search]').fill(orderNumber);
  const row = admin.locator('tr', { hasText: orderNumber });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Review' }).click();
  await admin.getByRole('button', { name: 'Approve' }).first().click();
  await admin.locator('.swal2-confirm', { hasText: 'Approve' }).click();
  await expect(admin.locator('.swal2-toast')).toContainText('Payment approved');
}

test('book PDF: buy → admin approves → read online', async ({ page, browser }) => {
  await registerCustomer(page);
  await page.goto('/books/patience-in-life');
  await expect(page.locator('.book-title')).toHaveText('Patience in Life');
  await page.getByRole('button', { name: 'Select PDF Version' }).click();
  await expect(page.locator('#payment-section')).toBeVisible();
  await expect(page.locator('#upi-id')).toHaveText(upiPattern);
  await expect(page.locator('#payment-amount')).toHaveText('₹100');
  await page.fill('#transaction_id', utr());
  await page.setInputFiles('#screenshot', screenshot);
  await page.getByRole('button', { name: /Submit Payment/ }).click();
  const success = page.locator('.alert-success', { hasText: 'Order Successful!' });
  await expect(success).toBeVisible();
  const orderNumber = (await success.locator('strong').first().textContent()) as string;
  expect(orderNumber).toMatch(/^ORD\d{17}$/);
  await expect(page.getByRole('button', { name: /Payment Pending Approval/ })).toBeDisabled();

  const admin = await adminPage(browser);
  await approve(admin, orderNumber);

  await page.goto('/my-books');
  await expect(page.locator('.book-card .book-title')).toHaveText('Patience in Life');
  await page.getByRole('link', { name: 'Read Online' }).click();
  await expect(page).toHaveURL(/\/my-books\/patience-in-life\/read$/);
  await expect(page.locator('iframe.pdf-embed')).toBeVisible();
  const pdf = await page.request.get('/api/library/books/patience-in-life/pdf');
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toBe('application/pdf');
});

test('hard copy: address → admin approves and ships → My Orders shows tracking', async ({ page, browser }) => {
  await registerCustomer(page);
  await page.goto('/books/patience-in-life');
  await page.getByRole('button', { name: 'Select Hard Book' }).click();
  await expect(page.locator('#hardbook-address')).toBeVisible();
  await page.fill('#phone', '9876543210');
  await page.fill('#address', '12 MG Road, Near Temple');
  await page.fill('#city', 'Pune');
  await page.selectOption('#state', 'Maharashtra');
  await page.fill('#pincode', '411001');
  await page.fill('#transaction_id', utr());
  await page.setInputFiles('#screenshot', screenshot);
  await page.getByRole('button', { name: /Submit Payment/ }).click();
  const success = page.locator('.alert-success', { hasText: 'Order Successful!' });
  await expect(success).toBeVisible();
  const orderNumber = (await success.locator('strong').first().textContent()) as string;

  const admin = await adminPage(browser);
  await approve(admin, orderNumber);
  await admin.goto('/admin/orders');
  const row = admin.locator('tr', { hasText: orderNumber });
  await row.getByRole('button', { name: 'Update' }).click();
  await admin.locator('.modal select').selectOption('shipped');
  await admin.getByPlaceholder('e.g. India Post, Delhivery').fill('India Post');
  await admin.locator('.modal input').nth(1).fill('EE123456789IN');
  await admin.getByRole('button', { name: 'Save' }).click();
  await expect(admin.locator('.swal2-toast')).toContainText('Order updated');

  await page.goto('/my-orders');
  const card = page.locator('.book-card', { hasText: orderNumber });
  await expect(card).toContainText('EE123456789IN');
  await expect(card).toContainText('Approved');
});

test('course: buy → admin approves → videos play', async ({ page, browser }) => {
  await registerCustomer(page);
  await page.goto('/courses/emotional-command');
  await page.getByRole('button', { name: 'Buy Now' }).click();
  await page.locator('.swal2-confirm', { hasText: 'Proceed to Payment' }).click();
  await expect(page).toHaveURL(/\/courses\/emotional-command\/payment$/);
  await page.locator('.payment-method[data-method="upi"]').click();
  await expect(page.locator('#paymentInstructions')).toContainText(upiPattern);
  await page.fill('#transaction_id', utr());
  await page.setInputFiles('#screenshot', screenshot);
  await page.getByRole('button', { name: /Submit Payment for Approval/ }).click();
  await expect(page).toHaveURL(/\/payment\/success\?id=/);
  await expect(page.locator('h2')).toHaveText('Payment Submitted Successfully!');
  const orderNumber = ((await page.locator('.card-body .h5').first().textContent()) as string).replace('#', '');

  const admin = await adminPage(browser);
  await approve(admin, orderNumber);

  await page.goto('/courses/emotional-command');
  await page.getByRole('button', { name: 'Start Learning' }).click();
  await expect(page.locator('#mainVideoPlayer')).toHaveAttribute('src', /youtube\.com\/embed\/Aye-26h2v4s/);
  await page.locator('#playlistModal .btn-close').click();
  await page.goto('/my-courses');
  await expect(page.locator('.subject-title')).toHaveText('Emotional Command');
});

test('consultation request and event booking', async ({ page }) => {
  await registerCustomer(page);
  await page.goto('/health/doctors/manoranjan-shau');
  await page.fill('#patientPhone', '9876543210');
  await page.fill('#patientAge', '35');
  await page.fill('#medicalIssue', 'Migraine');
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.fill('#appointmentDate', tomorrow);
  await page.selectOption('#preferredTime', 'morning');
  await page.fill('#symptoms', 'Headache every morning for two weeks');
  await page.check('#terms');
  await page.getByRole('button', { name: 'Submit Consultation Request' }).click();
  await expect(page.locator('.alert-success')).toContainText('Consultation request submitted successfully');

  await page.goto('/programs');
  await page.locator('.btn-booking', { hasText: 'Book Now' }).first().click();
  await expect(page.locator('#bookingModal')).toBeVisible();
  await expect(page.locator('#event_name')).toHaveValue('3-Day Meditation Retreat');
  await page.fill('#transaction_id', utr());
  await page.fill('#user_phone', '9876543210');
  await page.getByRole('button', { name: /I Have Paid/ }).click();
  await expect(page.locator('#bookingModal .alert-success')).toContainText('Booking details submitted successfully!');
});

test('personality test gives a result', async ({ page }) => {
  await page.goto('/personality-test');
  await page.locator('#englishBtn').click();
  for (let i = 0; i < 40; i++) {
    await page.locator('.question-container.active .option-item').first().click();
    if (await page.locator('#submitBtn').isVisible()) break;
    await page.locator('#nextBtn').click();
  }
  await page.locator('#submitBtn').click();
  await expect(page.locator('#resultContainer')).toBeVisible();
  await expect(page.locator('#gunaResult')).not.toBeEmpty();
});
