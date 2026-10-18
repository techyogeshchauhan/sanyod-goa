# backend/ (Node.js 20 + Express + TypeScript + MongoDB)

The replica's REST API. Specification: [`../docs/08-backend-architecture.md`](../docs/08-backend-architecture.md), endpoints in [`../docs/10-api-specification.md`](../docs/10-api-specification.md).

## Status

| Phase | Done |
| --- | --- |
| 1 · Foundation | ✅ Config validation, MongoDB, separate user/admin sessions, CSRF, rate limits, security headers, errors, logging, auth API, admin auth, email service, legacy `.php` 301 redirects |
| 3–6 · Features | ✅ Books (PDF + hard copy), UPI payments with screenshot upload, orders and shipping, user library (private PDF streaming), courses with videos (paid YouTube IDs only for buyers), doctors + consultations (CV download), programmes + bookings, site settings, purchase/approval/shipping emails, full admin API (dashboard, payment review, orders, books, courses, videos, doctors, consultations, events, bookings, users, manual access, messages, newsletter CSV, settings, admin accounts, activity log) |
| 7 · Migration | ✅ `migrate:mysql` script (reads the phpMyAdmin export directly) · ⏳ waiting for the live database export and server files |

## Run locally

Requires Node 20+ and MongoDB (default `mongodb://127.0.0.1:27017/sanyod_replica`).

```bash
npm install
cp .env.example .env          # set SESSION_SECRET (≥ 32 chars); LEGACY_SITE_DIR=D:/sanyod.in to copy book PDFs
npm run seed                  # creates collections + the data visible on the live site
npm run create-admin -- --username admin --password "a-strong-password" --role superadmin
npm run dev                   # http://localhost:4000/api/health
```

Without `SMTP_HOST`, emails (order confirmations, approvals, reset links) are written to the API log instead of being sent.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | API with reload (port 4000) |
| `npm run build` / `start` | Compile to `dist/` / run the build |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest + Supertest tests against `sanyod_replica_test` (dropped before and after; uploads go to a temp folder) |
| `npm run db:init` | Create every collection and index (safe to re-run) |
| `npm run seed` | Data from the live site: 4 books, 4 courses with 96 videos, 3 doctors, 6 programmes, settings. Copies book PDFs from `LEGACY_SITE_DIR/Books_pdf` |
| `npm run migrate:mysql -- --file <export.sql> [--legacy-dir D:/sanyod.in] [--dry-run]` | Import the live MySQL data and uploads (see below) |
| `npm run create-admin` | Create or reset an admin (`--username`, `--password` ≥ 10 chars, `--role admin\|superadmin`, `--name`) |

## Files and uploads

`STORAGE_DIR` (default `backend/storage`, git-ignored) has two areas:

| Area | Contents | Served |
| --- | --- | --- |
| `public/` | covers, course images, doctor photos, event images, QR codes uploaded in the admin | at `/media/*` |
| `private/` | book PDFs, payment screenshots, doctor CVs | never directly: streamed by routes that check access (owner / admin) |

Back up `storage/` together with the database. In production, proxy `/api` and `/media` to the API.

## Migrating the live data

1. Export the live database from phpMyAdmin (SQL, structure + data) and download the server folders (`Books/`, `Books_pdf/`, `Courses/`, `uploads/`, `assets/img/events/`).
2. Dry run: `npm run migrate:mysql -- --file export.sql --legacy-dir D:/sanyod.in --dry-run`. The report lists rows read/written/skipped per table, password formats, missing files and tables it did not understand.
3. Run it for real (same command without `--dry-run`). It is safe to re-run: records are matched by their old ids, and users who changed their password on the new site keep it.
4. Spot-check users, payments and orders in the admin panel.

Old passwords: bcrypt hashes are kept as they are; MD5/SHA1/plain ones are upgraded to bcrypt at the user's next login.

## Layout

```text
src/
├─ app.ts, server.ts           # app factory (used by tests) and bootstrap
├─ config/                     # env (zod), db, sessions
├─ shared/                     # types, zod schemas, constants: also used by the frontend (@shared/*)
├─ models/                     # User, Admin, Book, Course, CourseVideo, Payment, Order, Entitlement,
│                              # Doctor, Consultation, Event, EventBooking, Settings, AuditLog, forms
├─ modules/                    # auth, books, payments (+ orders), library, courses, health, events,
│                              # settings, forms, legacy redirects, admin/* (sales, catalog, services, people)
├─ middleware/                 # auth guards, csrf, validate, upload, rate limits, errors, request id
├─ services/                   # purchases (create/approve/reject/ship), storage, email (+ templates)
├─ utils/                      # errors, passwords (bcrypt + legacy PHP hashes), sessions, logger
└─ scripts/                    # init-db, seed (+ seed-data), migrate-mysql (+ mysql-dump reader), create-admin
```

## Rules

- The server decides prices, amounts, identity and access. Never trust form values for these.
- Paid PDFs, payment screenshots and CVs are stored privately and streamed only to authorised users.
- Never connect to or modify the live database. Migration reads a **copy** of the SQL export.
- `DISABLE_RATE_LIMITS=true` is for local end-to-end runs only and is ignored in production.
