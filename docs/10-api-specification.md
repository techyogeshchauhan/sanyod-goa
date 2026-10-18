# 10 · REST API Specification (Express + TypeScript)

The API that replaces the PHP form handlers. Base path: `/api`. JSON in and out, except multipart uploads and file streams. Request bodies are validated with the zod schemas in `backend/src/shared/schemas` (also imported by the frontend through the `@shared/*` path alias; see [07-frontend-architecture.md](07-frontend-architecture.md)). Roles and permissions: [03-user-roles-and-permissions.md](03-user-roles-and-permissions.md). Authentication: [05-authentication.md](05-authentication.md).

### Auth levels

- **Public:** anyone.
- **Guest:** only when not logged in.
- **User:** logged-in customer.
- **Owner:** the user who owns the resource.
- **Entitled:** has an approved purchase of the item.
- **Admin:** admin session.

### Conventions

- Success: `200 { data }` or `201 { data }`. Lists: `{ data: T[], page, pageSize, total }`.
- Error: `{ error: { code: string, message: string, fields?: Record<string, string> } }` with 400 (validation), 401 (not logged in), 403 (forbidden / not entitled), 404, 409 (conflict, e.g. email exists / duplicate UPI ID), 413 (file too large), 429 (rate limit), 500.
- Money is in **paise** (integer); the client formats it as `₹1,234.00`.
- IDs are Mongo ObjectIds; `legacyId` is included where useful for redirects.

---

## 1. Auth (users)

| Method | Path | Auth | Body | Response | Replaces |
| --- | --- | --- | --- | --- | --- |
| GET | `/auth/csrf` | Public | — | `{ csrfToken }` (send as `X-CSRF-Token` on writes) | — |
| POST | `/auth/register` | Guest | `{ name, email, password }` | `201 { user }` + session cookie (auto-login) | `register.php` |
| POST | `/auth/login` | Guest | `{ email, password }` | `{ user }` + session cookie (`sanyod.sid`) | `login.php` |
| POST | `/auth/logout` | User | — | `204` | `logout.php` |
| GET | `/auth/me` | Public | — | `{ user \| null }` | header session check |
| POST | `/auth/forgot-password` | Guest | `{ email }` | `200 { message }` (**always the same**) + email with link | `forget.php` |
| GET | `/auth/reset-password/validate?token=` | Guest | — | `{ valid, email? }` | `reset_password.php` (GET) |
| POST | `/auth/reset-password` | Guest | `{ token, password, confirmPassword }` | `200` + logged in ("Set New Password & Login") | `reset_password.php` (POST) |

Validation: `name` 2–100; `email` valid; `password` ≥ 6 (UI rule); `confirmPassword === password`.

## 2. Books

| Method | Path | Auth | Response | Notes |
| --- | --- | --- | --- | --- |
| GET | `/books` | Public | `[{ id, legacyId, slug, title, cover }]` | Published, sorted |
| GET | `/books/:slug` | User | `{ id, slug, title, author, description, pages, publishedYear, rating, reviewCount, cover, pricePdf, priceHardcopy, hardcopyAvailable }` | Live requires login |
| GET | `/books/:id/purchase-status` | User | `{ pdf: 'not_purchased'\|'pending'\|'approved'\|'rejected', hardcopy: …, order?: { orderNumber, status } }` | Latest payment per type |

## 3. Payments (books, courses, events)

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/payments` | User | **multipart**: `itemType` (`book_pdf`\|`book_hardcopy`\|`course`\|`event`), `itemId`, `upiTransactionId`, `screenshot` (file, ≤ 5 MB, jpg/png/webp/gif), `shippingAddress` (JSON, required for `book_hardcopy`), `eventBooking` (JSON `{name,email,phone}` for `event`) | `201 { id, orderNumber, status: 'pending', amount }` |
| GET | `/payments/:id` | Owner | — | `{ id, orderNumber, itemType, item, amount, status, createdAt }` (payment success page) |
| GET | `/payments` | User | — | own payments (payment status page) |

Server rules:

- `amount` is calculated from the item: PDF = `pricePdf`, hard copy = `priceHardcopy`, course = `price`, event = `price`.
- Reject with 409 if the user already has an approved entitlement or a pending payment for the same item.
- Reject with 409 on a duplicate `upiTransactionId`.
- Generate `orderNumber` (`ORD` + `YYYYMMDDHHMMSS` + 3 digits).
- For hard copies, create the `Order`; for events, create the `EventBooking`.
- Emails: customer confirmation (PDF / hard-copy / course / event template) + admin notification.

## 4. Library (purchased content)

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/library/books` | User | purchased books + stats `{ total, pdfCount }` (My Books) |
| GET | `/library/books/:bookId/pdf` | Entitled | **PDF stream** (`Content-Type: application/pdf`, `Content-Disposition: inline`; `?download=1` → attachment) |
| GET | `/library/courses` | User | purchased courses with progress placeholder (My Courses) |

## 5. Orders (hard copies)

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/orders` | User | `[{ orderNumber, book: {title, cover}, amount, status, shippingAddress, createdAt, statusHistory }]` |
| GET | `/orders/:orderNumber` | Owner | single order |

## 6. Courses and videos

| Method | Path | Auth | Response | Notes |
| --- | --- | --- | --- | --- |
| GET | `/courses` | Public | `[{ id, legacyId, slug, title, shortDescription, image, price, discountPercent, originalPrice, videoCount, isPurchased?, isNewArrival, isPopular }]` | `?home=1` returns `{ newArrivals, popular }`; `isPurchased` only when logged in |
| GET | `/courses/:slug` | Public | full course + `whatYouGet` list | |
| GET | `/courses/:id/videos` | Public | `[{ id, order, title, isFree, canAccess, youtubeId? }]` | **`youtubeId` only when `isFree` or the user is entitled** (fixes the leak) |

## 7. Doctors and consultations

| Method | Path | Auth | Body / Response |
| --- | --- | --- | --- |
| GET | `/doctors` | Public | `[{ id, legacyIds, slug, name, categories, specialisations, qualification, experienceYears, fee, photo }]` |
| GET | `/doctors/:slug` | User | full profile (`bio`, `rating`, `isVerified`, `availabilityText`, `hasCv`) |
| GET | `/doctors/:id/cv` | User | CV file stream (404 if none) |
| POST | `/consultations` | User | `{ doctorId, patientName, patientEmail, patientPhone, patientAge, medicalIssue, appointmentDate, preferredTime, symptoms, additionalNotes?, consentAccepted: true }` → `201 { id, status: 'pending' }` + emails |
| GET | `/consultations` | User | own requests |

Validation: phone `^[0-9]{10}$`; age 1–120; `appointmentDate` ≥ today (Asia/Kolkata); `preferredTime ∈ {morning, afternoon, evening, any}`.

## 8. Events (programmes)

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/events` | User (live requires login) | `{ retreat: Event[], seminar: Event[], online: Event[] }` |
| GET | `/events/:slug` | User | event |
| — | booking | User | via `POST /payments` with `itemType=event` + `eventBooking` |
| GET | `/event-bookings` | User | own bookings |

## 9. Forms (new: currently nothing is saved)

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| POST | `/contact` | Public | `{ name, email, phone?, project?, subject, message }` |
| POST | `/guidance-requests` | Public | `{ name, email, preferredMentor: 'swami'\|'priya'\|'rajan'\|'any', goals?, plan? }` (fields of the "Book Your Free Consultation" modal) |
| POST | `/newsletter` | Public | `{ email }` → 200 even if already subscribed |

All three: rate-limited, spam check (honeypot field / Turnstile), admin email notification.

## 10. Settings (public site configuration)

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/settings/public` | Public | `{ phone, email, address, workingHours, socialLinks, upi: { default, hardcopy, qrImage } }` |

---

## 11. Admin API (`/api/admin/*`, Admin only)

| Area | Endpoints |
| --- | --- |
| Auth | `POST /admin/auth/login { username, password, remember }` · `POST /admin/auth/logout` · `GET /admin/auth/me` |
| Dashboard | `GET /admin/dashboard` → counts (users, pending payments by type, orders by status, consultations, bookings, revenue this month) |
| Payments | `GET /admin/payments?status=&itemType=&q=` · `GET /admin/payments/:id` · `GET /admin/payments/:id/screenshot` (stream) · `POST /admin/payments/:id/approve` (creates entitlement / confirms booking / sets order processing, emails the user) · `POST /admin/payments/:id/reject { reason }` |
| Orders | `GET /admin/orders?status=` · `PATCH /admin/orders/:id { status, trackingNumber?, courier? }` |
| Books | `GET/POST /admin/books` · `GET/PATCH/DELETE /admin/books/:id` · multipart `cover`, `pdf` |
| Courses | `GET/POST /admin/courses` · `GET/PATCH/DELETE /admin/courses/:id` (multipart `image`) |
| Videos | `GET/POST /admin/courses/:id/videos` · `PATCH/DELETE /admin/videos/:id` · `POST /admin/courses/:id/videos/reorder { ids[] }` |
| Doctors | `GET/POST /admin/doctors` · `PATCH/DELETE /admin/doctors/:id` (multipart `photo`, `cv`) |
| Consultations | `GET /admin/consultations?status=` · `PATCH /admin/consultations/:id { status, adminNotes }` |
| Events | `GET/POST /admin/events` · `PATCH/DELETE /admin/events/:id` (multipart `image`) · `GET /admin/event-bookings?eventId=` |
| Users | `GET /admin/users?q=` · `GET /admin/users/:id` (purchases, orders) · `PATCH /admin/users/:id { isActive }` |
| Entitlements | `POST /admin/entitlements { userId, itemType, itemId }` (manual grant) · `DELETE /admin/entitlements/:id` |
| Messages | `GET /admin/contact-messages` · `GET /admin/guidance-requests` · `GET /admin/newsletter-subscribers` (CSV export) · `PATCH …/:id { status }` |
| Settings | `GET/PUT /admin/settings` (contact info, UPI IDs, QR image, working hours, social links) |
| Admins | `GET/POST /admin/admins` · `PATCH /admin/admins/:id` (superadmin only) |

Every admin write is recorded in `auditLogs`.

---

## 12. Legacy redirect endpoint

`GET /*.php` (case-insensitive) → **301** to the new route, using `legacyId` look-ups for `books`, `subject_id` and `doctor_id` parameters. See [12 § 4](12-migration-plan.md#4-url-and-route-mapping).

---

## 13. Example shared schema

```ts
// backend/src/shared/schemas/payment.ts
import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().regex(/^[0-9]{10}$/, '10 digit phone number'),
  address: z.string().trim().min(5),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  pincode: z.string().regex(/^[0-9]{6}$/, '6 digit pincode'),
  landmark: z.string().trim().optional(),
});

export const createPaymentSchema = z.discriminatedUnion('itemType', [
  z.object({ itemType: z.literal('book_pdf'), itemId: z.string(), upiTransactionId: z.string().trim().min(6) }),
  z.object({ itemType: z.literal('book_hardcopy'), itemId: z.string(), upiTransactionId: z.string().trim().min(6), shippingAddress: addressSchema }),
  z.object({ itemType: z.literal('course'), itemId: z.string(), upiTransactionId: z.string().trim().min(6) }),
  z.object({
    itemType: z.literal('event'), itemId: z.string(), upiTransactionId: z.string().trim().min(6),
    eventBooking: z.object({ name: z.string().min(2), email: z.string().email(), phone: z.string().regex(/^[0-9]{10}$/) }),
  }),
]);
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
```
