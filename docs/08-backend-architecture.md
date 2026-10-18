# 08 · Backend Architecture (Node.js + Express + TypeScript + MongoDB)

Specification for `replica-website/backend`: the REST API, data models, file storage, email, scripts and configuration. Endpoints are in [10](10-api-specification.md); models in [09](09-database-models.md); auth in [05](05-authentication.md).

---

## 1. Responsibilities

| # | Responsibility |
| --- | --- |
| 1 | Serve the JSON API under `/api` for the public site, logged-in users and admins |
| 2 | Authenticate users/admins with server-side sessions; enforce roles, ownership and entitlements ([03](03-user-roles-and-permissions.md)) |
| 3 | Own all business rules: prices, hard-copy surcharge, order numbers, payment states, video access, PDF access |
| 4 | Store and serve files: public images and private PDFs/screenshots/CVs |
| 5 | Send transactional emails |
| 6 | Redirect legacy `.php` URLs (301) |
| 7 | Provide migration, seeding and admin-creation scripts |

---

## 2. Stack and versions

| Package | Purpose |
| --- | --- |
| Node.js 20 LTS, TypeScript 5 (`strict`) | Runtime / language |
| `express` 4.x | HTTP framework |
| `mongoose` 8.x | MongoDB ODM |
| `zod` 3.x | Validation (schemas shared with the frontend) |
| `express-session` + `connect-mongo` | Sessions ([05](05-authentication.md)); the stores connect with `MONGODB_URI` (connect-mongo bundles its own MongoDB driver) |
| `cookie-parser` | CSRF double-submit cookie |
| `bcryptjs` | Password hashing (pure JS bcrypt: no native build; reads PHP `$2y$` hashes) |
| `multer` + `file-type` | Uploads + magic-byte checks |
| `@aws-sdk/client-s3` (optional) | S3/R2 storage driver |
| `nodemailer` | Email |
| `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `hpp`, `compression` | Security / performance |
| `pino`, `pino-http` | Logging |
| `slugify` + `transliteration` | Slugs for Hindi titles |
| Dev: `tsx`, `vitest`, `supertest`, `mongodb-memory-server`, `eslint`, `prettier` | Tooling |

---

## 3. Folder structure

```text
backend/
├─ package.json  tsconfig.json  .env.example  nodemon.json
├─ src/
│  ├─ server.ts                 # starts HTTP server, connects DB, graceful shutdown
│  ├─ app.ts                    # builds the Express app (middleware + routes); exported for tests
│  ├─ config/
│  │  ├─ env.ts                 # zod-validated process.env → typed config
│  │  ├─ db.ts                  # mongoose connection
│  │  └─ session.ts             # express-session + connect-mongo options (user + admin)
│  ├─ shared/                   # ⚠ pure TS only: imported by the frontend via @shared/*
│  │  ├─ types/                 # common.ts, auth.ts, book.ts, course.ts, payment.ts, …
│  │  ├─ schemas/               # zod: auth, address, payment, consultation, event, forms, admin
│  │  └─ constants.ts           # enums, HARDCOPY_SURCHARGE, ORDER_PREFIX, DISCOUNT_DEFAULT …
│  ├─ models/                   # User, Admin, Book, Course, CourseVideo, Payment, Order,
│  │                            # Entitlement, Doctor, Consultation, Event, EventBooking,
│  │                            # ContactMessage, GuidanceRequest, NewsletterSubscriber,
│  │                            # Setting, AuditLog (+ shared sub-schemas: storedFile, address)
│  ├─ modules/                  # feature modules: routes + controller + service
│  │  ├─ auth/  books/  courses/  payments/  orders/  library/  doctors/
│  │  ├─ consultations/  events/  forms/  settings/  legacy/
│  │  └─ admin/  (auth, dashboard, payments, orders, books, courses, videos, doctors,
│  │              consultations, events, users, entitlements, messages, settings, admins)
│  ├─ middleware/
│  │  ├─ auth.ts                # requireUser, requireAdmin, requireSuperAdmin, optionalUser
│  │  ├─ access.ts              # requireOwner, requireEntitlement
│  │  ├─ validate.ts            # validate({ body, query, params }) with zod
│  │  ├─ upload.ts              # multer configs per field (image ≤ 5 MB, pdf ≤ 50 MB)
│  │  ├─ csrf.ts  rateLimit.ts  error.ts  notFound.ts  requestId.ts
│  ├─ services/
│  │  ├─ storage/               # StorageDriver interface + local + s3 implementations
│  │  ├─ email/                 # mailer.ts + templates/*.ts (HTML + text)
│  │  ├─ payments.service.ts    # amount calc, order numbers, approve/reject, entitlements
│  │  ├─ access.service.ts      # canAccessVideo, canReadPdf
│  │  └─ audit.service.ts
│  ├─ utils/                    # money.ts, orderNumber.ts, slug.ts, dates.ts (Asia/Kolkata), errors.ts
│  ├─ scripts/                  # seed.ts, create-admin.ts, migrate-mysql.ts, migrate-files.ts
│  └─ types/express.d.ts        # req.user, req.admin augmentation
└─ tests/  (unit + integration with supertest + mongodb-memory-server)
```

---

## 4. Request lifecycle

```mermaid
flowchart LR
    R[Request] --> MW[Global middleware<br/>requestId · helmet · cors · compression · json/urlencoded · mongoSanitize · hpp · session · csrf · pino-http]
    MW --> RT[Module router]
    RT --> RL[rateLimit?]
    RL --> AU[auth guard<br/>requireUser / requireAdmin]
    AU --> VA[validate zod<br/>body · query · params]
    VA --> UP[upload multer?]
    UP --> C[Controller<br/>HTTP in/out only]
    C --> S[Service<br/>business rules]
    S --> M[(Mongoose models)]
    S --> ST[(Storage)]
    S --> EM[Email]
    C --> RES[JSON response]
    S -. throws AppError .-> E[error middleware → {error:{code,message,fields}}]
```

Layer rules:

- **Controllers**: parse the validated input, call one service function, shape the response. No DB access.
- **Services**: all business logic and transactions; take plain inputs and the acting user/admin.
- **Models**: schema, indexes, small instance helpers only.
- Errors: throw `AppError(status, code, message, fields?)`; unknown errors → 500 with a generic message (details only in logs).

---

## 5. Global middleware order (`app.ts`)

1. `requestId` (UUID → `X-Request-Id`)
2. `helmet` (CSP allowing YouTube, Google Fonts, Google Maps, jsDelivr if used)
3. `cors` (only `APP_URL`; credentials)
4. `compression`
5. `express.json({ limit: '1mb' })`, `express.urlencoded({ extended: false })`
6. `express-mongo-sanitize`, `hpp`
7. `session` (user cookie on `/api`; admin cookie on `/api/admin`)
8. `csrf` (skip for GET/HEAD/OPTIONS)
9. `pino-http`
10. Routes: `/api/auth`, `/api/books`, `/api/courses`, `/api/payments`, `/api/library`, `/api/orders`, `/api/doctors`, `/api/consultations`, `/api/events`, `/api/event-bookings`, `/api/contact`, `/api/guidance-requests`, `/api/newsletter`, `/api/settings`, `/api/admin/*`, legacy `*.php` redirects
11. `notFound` → `error`

---

## 6. Key business services

| Service | Rules |
| --- | --- |
| `payments.createPayment(user, input, file)` | Load the item; reject unpublished items; **amount from the item** (PDF `pricePdf`, hard copy `priceHardcopy`, course `price`, event `price`); reject if already entitled (409) or a pending payment exists (409); reject a duplicate `upiTransactionId` (409); store the screenshot privately; create `Payment(pending)` + `Order` (hard copy) / `EventBooking` (event) in **one MongoDB transaction**; generate `orderNumber`; send the customer + admin emails after commit |
| `payments.approve(admin, id)` | `pending` → `approved`; create `Entitlement` (book_pdf / course; plus book_pdf for an approved hard copy if decision D-06 = yes); order → `processing`; booking → `confirmed`; email the user; audit |
| `payments.reject(admin, id, reason)` | `pending` → `rejected`; order → `cancelled`; booking → `cancelled`; email with the reason; audit |
| `access.canAccessVideo(user, video)` | `video.isFree` or the user has a course entitlement (not expired) |
| `access.canReadPdf(user, book)` | Book entitlement exists |
| `orders.updateStatus(admin, id, status)` | Allowed transitions: pending → processing → shipped → delivered; any → cancelled (before shipped); history appended |
| `courses.list({ home })` | `home=1` → `{ newArrivals: 3, popular: 3 }` by flags/sort order |
| `orderNumber()` | `ORD` + `YYYYMMDDHHmmss` (Asia/Kolkata) + random 100–999; retry on a unique-index collision |
| `money` | Paise integers; `originalPrice = floor(price / (1 - discount/100))` (display) |

---

## 7. File storage

| Bucket / folder | Content | Access | Max size / types |
| --- | --- | --- | --- |
| `public/books/covers` | Book covers | Static (`/Books/…` path kept) | 5 MB · jpg/png/webp |
| `public/courses` | Course images | Static | 5 MB · images |
| `public/doctors` | Doctor photos | Static | 5 MB · images |
| `public/events` | Event images | Static | 5 MB · images |
| `private/books/pdf` | Book PDFs | `GET /api/library/books/:id/pdf` (entitled) | 50 MB · pdf |
| `private/payments` | Payment screenshots | `GET /api/admin/payments/:id/screenshot` | 5 MB · jpg/png/webp/gif |
| `private/doctors/cv` | Doctor CVs | `GET /api/doctors/:id/cv` (user) | 10 MB · pdf/doc/docx |

`StorageDriver` interface: `put(key, stream, meta)`, `getStream(key, range?)`, `delete(key)`, `exists(key)`, `publicUrl(key)`. File names are random (`<uuid>.<ext>`); original names are kept in metadata. PDF streaming supports `Range` requests (for the in-browser viewer) and sets `Cache-Control: private, no-store`.

---

## 8. Email

| Template | Trigger | To |
| --- | --- | --- |
| `order-pdf` | Book PDF payment submitted | Customer (texts based on the live HTML email: order details, "within 24 hours", how to access) |
| `order-hardcopy` | Hard-copy payment submitted | Customer (processing notice, shipping 3–5 days, what happens next) |
| `course-payment-received` / `event-booking-received` | Payment submitted | Customer |
| `admin-new-payment` | Any payment submitted | `ADMIN_NOTIFY_EMAIL` |
| `payment-approved` / `payment-rejected` | Admin action | Customer |
| `order-status-changed` | Order shipped/delivered/cancelled | Customer |
| `reset-password` | Forgot password | User |
| `consultation-received` (+ admin copy) | Consultation request | Patient + admin |
| `contact-received`, `guidance-received`, `newsletter-welcome` | Forms | Admin / user |

Transport: SMTP via Nodemailer; sender `MAIL_FROM` on the sanyod.in domain (SPF/DKIM configured). Sending happens after the DB commit; failures are logged and retried 3× with backoff (in-process queue in release 1). A failed email never fails the user's request (the success message mentions the email status like live).

---

## 9. Configuration and environment variables

`backend/.env.example`

```dotenv
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:5173          # frontend origin (CORS, email links)
TRUST_PROXY=1                           # behind Nginx

MONGODB_URI=mongodb://localhost:27017/sanyod
SESSION_SECRET=change-me-long-random
SESSION_USER_MAX_AGE_DAYS=7
SESSION_ADMIN_REMEMBER_DAYS=30
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false                     # true in production

STORAGE_DRIVER=local                    # local | s3
STORAGE_LOCAL_PUBLIC=./storage/public
STORAGE_LOCAL_PRIVATE=./storage/private
S3_ENDPOINT=
S3_REGION=
S3_BUCKET_PUBLIC=
S3_BUCKET_PRIVATE=
S3_ACCESS_KEY=
S3_SECRET_KEY=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM="SANYOD <noreply@sanyod.in>"
ADMIN_NOTIFY_EMAIL=sanyod@sanyod.in

UPI_ID_DEFAULT=6355034424@upi           # seed values for the Settings document
UPI_ID_HARDCOPY=hardbook.6355034424@upi
HARDCOPY_SURCHARGE_PAISE=20000
COURSE_DISCOUNT_DEFAULT=40
MAX_IMAGE_UPLOAD_MB=5
MAX_PDF_UPLOAD_MB=50

DISABLE_RATE_LIMITS=false                # local E2E runs only; ignored in production

LEGACY_MYSQL_URL=mysql://user:pass@localhost:3306/sanyod   # migration scripts only
LOG_LEVEL=info
```

`config/env.ts` validates all variables at start-up and exits with a clear message if any are invalid.

---

## 10. Error handling and logging

| Case | Response |
| --- | --- |
| zod validation | `400 { error: { code: 'VALIDATION_ERROR', message, fields } }` |
| Not logged in / not admin | `401 UNAUTHENTICATED` / `401 ADMIN_UNAUTHENTICATED` |
| Not owner / not entitled | `403 FORBIDDEN` / `403 NOT_ENTITLED` |
| Missing resource | `404 NOT_FOUND` |
| Duplicate (email, UPI ID, pending payment) | `409 CONFLICT` with a specific `code` |
| Upload too large / wrong type | `413 FILE_TOO_LARGE` / `415 UNSUPPORTED_FILE` |
| Rate limit | `429 TOO_MANY_REQUESTS` |
| Unexpected | `500 INTERNAL_ERROR` (generic message; stack only in logs) |

Logs: pino JSON with `requestId`, user/admin id, route, status and duration; no passwords, tokens or file contents. Production logs go to file + log service.

---

## 11. Security controls

See [05 § B.6](05-authentication.md#b6-security-checklist) and [12 § 9](12-migration-plan.md#9-security-fixes-built-into-the-rebuild). Backend-specific:

- Every admin route behind `requireAdmin`; superadmin-only routes behind `requireSuperAdmin`.
- User-owned queries are always filtered by `req.user.id`.
- Locked video IDs never leave the server.
- Private files are never placed under a static path.
- Mongo injection protection (`express-mongo-sanitize`, zod types) and ObjectId validation for params.
- `helmet` CSP; HSTS at Nginx.
- Dependencies scanned (`npm audit` in CI).

---

## 12. Scripts

| Command | Script | Purpose |
| --- | --- | --- |
| `npm run dev` | `tsx watch src/server.ts` | Development |
| `npm run build` / `start` | `tsc` / `node dist/server.js` | Production |
| `npm run seed` | `scripts/seed.ts` | Seed data visible on live ([09 Part C](09-database-models.md#part-c--seed-data-visible-on-the-live-site-12-oct-2026)) + settings + a dev admin |
| `npm run create-admin` | `scripts/create-admin.ts` | Create an admin/superadmin |
| `npm run migrate:mysql` | `scripts/migrate-mysql.ts` | MySQL dump → MongoDB ([12 § 7](12-migration-plan.md#7-data-and-file-migration)) |
| `npm run migrate:files` | `scripts/migrate-files.ts` | Copy/rename legacy files → storage, update references |
| `npm test` | vitest | Unit + integration tests |

---

## 13. Testing

| Level | What |
| --- | --- |
| Unit | Services: amount calculation, order numbers, approval → entitlement, video access, order status transitions |
| Integration | Supertest + mongodb-memory-server: auth flows, payment submit (multipart), admin approve, PDF stream access (200 entitled / 403 not), legacy redirects |
| Contract | Responses validated against the shared zod response schemas |
| Security | Tests for 401/403 on every protected route, CSRF required, rate limits |
