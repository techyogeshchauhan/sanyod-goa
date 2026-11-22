# Admin Panel Audit: Findings, Fixes and Verification

Audit date: 2026-11-22
Scope: the whole admin panel. Frontend `frontend/src/admin/` (shell, auth, API client, UI kit, 9 page files) and API `backend/src/modules/admin/` (auth, sales, catalog, services, people routes), plus the services, schemas, middleware and tests they depend on.
Method: full source review of every admin file, then automated verification against a local MongoDB. That covers the backend API suite (supertest) and the admin UI in a real browser (Playwright) against a throwaway database. Atlas and production were never touched.

**Result:** 27 findings, all fixed. Admin API coverage went from 4 tests to 29. The new browser suite covers every admin page. Every check passes (see [Verification](#verification)).

## Findings

Severity: **High**, a security or money/access defect; **Medium**, a broken feature or data that cannot be corrected; **Low**, a UX or robustness issue.

### High

| ID | Finding | Where | Fix |
| --- | --- | --- | --- |
| A1 | **Any admin could change the UPI IDs and QR codes**, which decide where customers send money. [docs/03 §3.2](../docs/03-user-roles-and-permissions.md) restricts settings to super admins. | `people.routes.ts` `PUT /settings` | `requireSuperAdmin` on the write. Settings nav item and page are super-admin only (`AdminLayout.tsx`, `SettingsPage`). Admins can still read settings. |
| A2 | **An expired or revoked admin session was not handled.** API calls returned 401 while the cached `/me` said "logged in" for up to 5 minutes. Pages rendered empty tables or spun forever, with no way back to login. | `admin/api.ts`, `AdminAuth.tsx` | Every admin API call reports `401 ADMIN_UNAUTHENTICATED` to `AdminAuthProvider`. That clears the session state, so `RequireAdmin` redirects to the login page and returns to the same page after login. |
| A3 | **Removing a user's access left the approved payment in place.** The user saw "purchased" with no access and was refused a new purchase (`ALREADY_PURCHASED`). | `people.routes.ts` `DELETE /entitlements/:id` | A manual grant's ₹0 payment is deleted. A paid purchase of the same item is marked `rejected` ("Access revoked by admin"), with no email. An approved hard copy that also unlocked the PDF is left alone. Recorded as [D-29](../docs/14-open-questions-and-decisions.md#3-decisions-log); the confirmation dialog explains the effect. |
| A4 | **A hard-copy order could be set to processing, shipped or delivered while its payment was pending or rejected.** The UI only showed a warning. | `services/purchases.ts` `updateOrderStatus` | 409 `PAYMENT_NOT_APPROVED` for those statuses unless the payment is approved. The order modal disables them and words the warning correctly (A16). |

### Medium

| ID | Finding | Where | Fix |
| --- | --- | --- | --- |
| A5 | **Optional fields could not be cleared on edit.** Emptying an input sent `null`, the mappers turned it into "unchanged", and the old value stayed. Affected: book pages, year, rating, review count and sort; course level, discount and sort; doctor experience, rating and sort; event capacity, rating, enrolled count and sort; video duration. | `catalog.routes.ts`, `services.routes.ts` field mappers | Nullable fields pass `null` (cleared). Counters fall back to `0` and course level to `''`. Video duration: empty or null clears it. |
| A6 | **Order courier and tracking number, and consultation internal notes, could not be cleared.** `''` was treated as "no change". | `shared/schemas/admin.ts` | `clearableText`: `''` clears, an omitted field stays unchanged. |
| A7 | **An uploaded QR image could never be removed**, although the page said "leave an ID or QR image empty to disable that payment route". | `people.routes.ts`, `SettingsPage` | `removeQrImageBooks` and `removeQrImageCourses` flags, with a "Remove this QR code" checkbox. The stored file is deleted after the save. |
| A8 | **Load errors were never shown.** Lists rendered as empty tables. Dashboard, User detail (for example an unknown id) and Settings showed a spinner forever. | all admin pages | New `QueryError` component (message plus Retry) on every list and detail page. |
| A9 | **Database conflicts returned 500 "Something went wrong".** Examples: re-confirming a booking or re-approving a payment whose UPI transaction ID was used again in the meantime, and Mongoose validation or cast errors. | `middleware/error.ts` | Duplicate key returns 409 `CONFLICT`. Mongoose `ValidationError` and `CastError` return 400 `VALIDATION_ERROR` with fields. |
| A10 | **The test suite was red: 20 of 54 backend tests failed.** The tests predated the 2026-11-21 changes: registration no longer signs in (SEC-04), MD5 logins were removed (SEC-01), reset tokens moved to a POST body (SEC-03), hard-copy prices are explicit, and payments and notifications need configured settings. The e2e `commerce.spec.ts` had the same staleness, plus a hard-coded UPI ID. | `backend/tests/*`, `frontend/tests/e2e/commerce.spec.ts` | Tests updated to the documented behaviour, with no product change. The e2e UPI check reads `E2E_UPI_ID` (exact value) or accepts any UPI ID. |
| O1 | **The test harness could drop a database on Atlas and send real email.** `.env` points `MONGODB_URI` at Atlas and `MONGODB_URI_TEST` is commented out, so the test URI was derived as `…/sanyod_replica_test` on Atlas, which the tests drop. `SMTP_HOST` was taken from `.env` as well. | `tests/helpers.ts`, `tests/setup.ts` | Tests refuse a non-local URI unless `MONGODB_URI_TEST` names it explicitly (the error no longer prints the URI and its credentials). `setup.ts` forces `SMTP_HOST=''`. |

### Low

| ID | Finding | Fix |
| --- | --- | --- |
| A11 | Many fields never displayed their server error. The toast said "check the highlighted fields" and nothing was highlighted. Affected: sort order, review count, discount, popular rank, level, capacity, enrolled count, rating, experience, social URLs, opening-hours rows. | Inline errors added. New `FormErrors` summary lists any other field error by name (for example "Opening hours, row 2 (day)"). |
| A12 | The Payments page loaded "all" and then "pending" (a double request and a flash of the wrong list). | `useAdminList` takes the initial status, so the first request is already the pending queue. |
| A13 | On Messages, switching tabs kept the other tab's page and search, so the new tab could look empty. | Switching tabs resets page and search. |
| A14 | Deleting the last row on the last page left an empty page. | The list steps back to the new last page. |
| A15 | Rejecting an *approved* payment gave no warning that access is removed and a hard-copy order cancelled. | The confirmation spells it out. |
| A16 | The order modal could say "The payment for this order is null". | Correct wording. Statuses that need payment are disabled. |
| A17 | The alert-email placeholder said "default from server config", but an empty value turns alerts off. | Placeholder and help text corrected. |
| A18 | Creating a doctor left orphan uploaded files when the save failed (books and courses already cleaned up). | Same cleanup as books. |
| A19 | An event's enrolled count could go below 0 (for example after being edited by hand). | The decrement only applies while the count is above 0. |
| A20 | Admin Accounts called `/admins` for plain admins (403), and the top-bar name stayed stale after editing your own account. | Query enabled for super admins only. `/me` refreshed after editing yourself. |
| A21 | The payment review modal had no Escape-to-close and duplicated `AdminModal`. | Uses `AdminModal` (xl). |
| A22 | The Activity log hid what changed. Newsletter CSV export ignored the current search. | Audit entries return and show `details`. The CSV link carries the search. |
| A23 | Books list: a hard copy marked available with no price showed "—". | Shows "not set" in red. |

## Observations (not changed)

- **`.env` SMTP variable names did not match the code.** Fixed in the follow-up: see [E1](#e1-development-email-configuration).
- `UPI_ID_DEFAULT`, `UPI_ID_HARDCOPY`, `HARDCOPY_SURCHARGE_PAISE` and `COURSE_DISCOUNT_DEFAULT` in `.env` are no longer read by the code (payment details come from admin Settings). They are harmless; `.env` was not edited.
- **`getSettings()` writes on every read.** It uses `findOneAndUpdate(…, { upsert: true })` on a schema with timestamps, and Mongoose adds `updatedAt` to such updates. So the settings `updatedAt` most likely moves on plain reads, and it can't show who last changed settings; use the Activity log (`settings.update`) for that. A possible fix is to read with `findOne` and only upsert when the document is missing. Not changed here, because the file is part of another session's uncommitted work.
- **Running backend tests on Windows:** run from an uppercase `D:\` path. From `d:\`, Vitest loads twice and every file fails with "failed to find the runner". In Windows PowerShell, `$env:X=''` deletes the variable instead of setting it empty, so it cannot be used to blank `.env` values. `tests/setup.ts` now handles `SMTP_HOST` itself.
- **During this audit, Gmail SMTP was contacted.** Before the `setup.ts` guard existed, some test runs and the first local audit server read `SMTP_HOST` from `.env` (see the PowerShell point above). Gmail refused every message at `MAIL FROM` (530, no auth), and the recipients were `example.com` test addresses. No email was delivered.
- Event capacity is not enforced when bookings are confirmed. It is display data, as on the PHP site; left as is.

## Files changed

Backend:

- `modules/admin/catalog.routes.ts`, `services.routes.ts`, `people.routes.ts`
- `services/purchases.ts`
- `middleware/error.ts`
- `shared/schemas/admin.ts`, `shared/types/admin.ts`
- tests: `admin.test.ts` (new), `auth`, `commerce`, `migrate`, `public-api`, `helpers`, `setup`
- follow-up E1: `config/env.ts`, `services/email/mailer.ts`, `.env.example`, `tests/env.test.ts` (new)

Frontend:

- `admin/api.ts`, `AdminAuth.tsx`, `AdminLayout.tsx` (one line), `ui.tsx`
- `admin/pages/`: Dashboard, Payments, Orders, Books, Courses, Events, Health, People
- tests: `tests/e2e/admin.spec.ts` (new), `commerce.spec.ts`

Docs:

- [04 §9](../docs/04-workflows.md) (order rule, revoke, settings)
- [14 D-29](../docs/14-open-questions-and-decisions.md#3-decisions-log)

Another session's uncommitted work in the same files (public-read cache, `PasswordInput`, sidebar backdrop) was kept as it was. Admin writes still clear that cache through `invalidateOnWrite`.

## Verification

Run on 2026-11-22 against the working tree above. All tests used a local MongoDB (`127.0.0.1:27017`).

| Check | Before | After |
| --- | --- | --- |
| Backend typecheck (`tsc --noEmit`) | pass | pass |
| Backend tests (`vitest run`) | 34 pass, **20 fail** / 54 | **79 pass** / 79 (6 files) |
| Frontend typecheck (`tsc -b --noEmit`) | pass | pass |
| Frontend unit tests | 5 pass / 5 | 5 pass / 5 |
| Frontend production build | pass | pass |
| E2E `admin.spec.ts` (new, desktop) | n/a | **7 pass** / 7 |
| E2E `commerce.spec.ts` (desktop) | fail (stale) | **5 pass** / 5 |

#### New backend tests (`tests/admin.test.ts`, 25 tests)

- A regression test for each backend finding: A1, A3, A4, A5, A6, A7, A9, A19, A22. A18 (cleanup after a failed doctor save) was checked by review only.
- Calls to every admin endpoint:
  - Session: auth `me`, login, logout; dashboard.
  - Sales: payments list, detail, screenshot, approve and reject; orders.
  - Catalog: books, courses and videos (create, read, update, delete; reorder); doctors and CV download.
  - Services: consultations; events and bookings.
  - People: users; access grants and revokes; messages; newsletter JSON and CSV; settings.
  - Accounts: admin accounts, including revoking a deactivated admin's session; own password, including revoking other sessions; audit log.

#### New browser tests (`tests/e2e/admin.spec.ts`)

- All 16 admin routes plus course videos load with no console errors, no error banners and no stuck spinners.
- Settings: saving works, and a bad opening-hours row is reported.
- Book form: validation, create, clear rating, delete.
- Messages: switching tabs resets the search.
- An unknown user id shows an error with Retry.
- Session expiry: redirect to login, then back to the same page.
- A plain admin gets no Settings or Admin Accounts.

The browser tests ran against an isolated API (port 4100) and Vite (5180) using a throwaway database `sanyod_admin_audit`, temporary admin accounts and scratch storage, with mail disabled. All of it was removed afterwards. The developer servers on 4000/5173 were not touched.

#### How to rerun

- Backend, from `D:\sanyod\replica-website\backend`: set `MONGODB_URI_TEST=mongodb://127.0.0.1:27017/sanyod_replica_test`, then `npx vitest run`.
- E2E: against servers connected to a **disposable** database, with `REPLICA_URL`, `E2E_ADMIN_USER` and `E2E_ADMIN_PASSWORD` (super admin), optionally `E2E_PLAIN_USER`/`E2E_PLAIN_PASSWORD` and `E2E_UPI_ID`. Then `npx playwright test admin commerce --project=desktop`. The admin spec saves settings and creates and deletes a book, so it must never be pointed at live data.

## Deployment notes

- After deploying, a plain `admin` account can no longer save Settings. Make sure whoever manages UPI IDs and QR codes has the `superadmin` role. Change it in Admin Accounts while signed in as a super admin. `npm run create-admin -- --username <name> --password <pw> --role superadmin` also works, but it **resets that account's password** too.
- No data migration is needed. Existing records keep their values; fields simply become clearable.

## Follow-up (2026-11-22): email configuration and super admin access

### E1: Development email configuration

**Problem.** `.env` uses `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM` and `SMTP_SECURITY`. The code read only `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`, and ignored `SMTP_SECURITY`. So the mailer connected to `smtp.gmail.com` without credentials and sent from the default `noreply@sanyod.in`. Gmail refused every message with `530 5.7.0 Authentication Required`, and the mailer only logged a warning after 3 attempts.

**Fix (code only; `.env` was not read into any output and not changed):**

- `src/config/env.ts`: `SMTP_USERNAME`, `SMTP_PASSWORD` and `SMTP_FROM` are accepted as aliases of `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`. The canonical name wins when both are set, and an empty value counts as unset (`withAliases`).
- New `SMTP_SECURITY` setting: `starttls`, `ssl`, `tls` or `none`. Unset keeps the old behaviour (TLS on 465, otherwise STARTTLS when offered).
- `src/services/email/mailer.ts`: `SMTP_SECURITY=starttls` sets `requireTLS`, so the password is never sent over an unencrypted connection; `ssl`/`tls` sets `secure`; `none` sets `ignoreTLS`.
- `.env.example` documents the setting, the aliases and the Gmail requirements (app password, sender = the Gmail address).
- `tests/env.test.ts` (new, 3 tests): alias mapping, precedence and empty values, and that `process.env` is not modified.

**Verification (2026-11-22):**

| Step | Result |
| --- | --- |
| Resolved config, printed without secrets | host `smtp.gmail.com`, port 587, security `starttls`, user set, app password set (19 characters), sender address equals the login address |
| `verify()`: connect, STARTTLS, AUTH, no message sent | **OK**, authenticated |
| One message through the app's own `sendMail()` | **Accepted by Gmail on the first attempt** (`sendMail` returned `true`, no retry warnings). Recipient: the sending mailbox itself, so no third party received anything. Subject `[SANYOD] SMTP test SANYOD-SMTP-TEST-MWS4C42Q` |
| Backend tests | 82 / 82 pass; the suite made no SMTP attempts (`tests/setup.ts` forces `SMTP_HOST=''`) |

Inbox arrival was not checked: the sending mailbox is not the Gmail account connected to this session. To confirm, search that mailbox for `SANYOD-SMTP-TEST-MWS4C42Q`, then delete the message.

**Effect on the running dev server.** `npm run dev` (`tsx watch`) restarted when `env.ts` changed, at 23:06:40. From then on, development actions (orders, approvals, password resets, contact forms) **send real email through Gmail** to the addresses in the development database, which is on Atlas. To keep development mail in the log instead, set `SMTP_HOST=` (empty) in `.env`.

### E2: Super admin access to Payment Settings

Read-only check of the development database (`sanyod_replica`) on 2026-11-22. Only usernames, roles, status and audit actions were read; no password hashes or emails.

| Username | Name | Role | Active | Last login (UTC) |
| --- | --- | --- | --- | --- |
| `admin` | Site Admin | `superadmin` | yes | 2026-11-22 17:09 |

- It is the **only** admin account, so it is the account that manages Payment Settings. It already has the super admin role. **No role was changed and no account was created.**
- All UPI IDs (courses/events, PDFs, hard copies) and both QR images are configured.
- The Activity log has no `settings.update` entry yet: the current values were saved before audit logging or by a seed or migration script. The `admin` account has 4 recorded writes, the last at 16:12 UTC.
- Role enforcement itself is covered by tests: `admin.test.ts` (a plain admin gets 403 on `PUT /settings`; a super admin can save) and `admin.spec.ts` (a plain admin sees no Settings or Admin Accounts).
- **Re-check before going live.** This was the development database; the production database will need the same check after migration. If more admins are added later, give `superadmin` only to the person responsible for payment details.
