# 13 · Verification Report

How the facts in this documentation were checked, what was found, what was corrected compared with the first draft (`../../documentation/`), and what remains unverified.

| | |
| --- | --- |
| Verification date | 12 October 2026 |
| Live site | <http://sanyod.in/> (also `https://sanyod.in/`, `http://www.sanyod.in/`) |
| PHP codebase | `D:\sanyod.in` (34 root PHP files + `includes/header.php`, assets) |
| Rules followed | Read-only: **no form submitted, no account created, no login attempted, no admin data read, no file in the PHP codebase changed** |

---

## 1. Method

| Step | How |
| --- | --- |
| 1. Capture live pages | `curl` at ≤ 15 requests/min, logged out; 37 URLs incl. query variants (`books=26`, `subject_id=7`, `doctor_id=11`); bot-check cookie `humans_21909=1` for `contact.php`. Saved in [`../reference/live-html/`](../reference/README.md) |
| 2. Render local pages | PHP 8.2.12 CLI (XAMPP) on a **scratch copy** of the codebase with a stub `admin/config` (DB not needed for GET output) |
| 3. Compare | Visible-text diff (scripts/styles stripped) and byte sizes, live vs local, per page |
| 4. Structure extraction | HTML outline script: sections, headings, forms, fields, buttons, links, media, per page |
| 5. Code reading | All PHP files; SQL statements, session keys, JS functions, inline CSS/JS line ranges |
| 6. Server behaviour | Status codes/redirects for protected pages, folders, missing files, HTTPS/www, robots/sitemap/favicon |
| 7. Doc consistency | Automated checks: internal links/anchors, route lists (03 vs 06), API base paths (10 vs 08), every PHP file mapped in 12; markdownlint |

---

## 2. Page-level results (logged out)

| Page | Live | Local vs live (visible text) | Reference for UI |
| --- | --- | --- | --- |
| `index.php` | 200 (101,172 B) | Same content, but **local renders the header twice** (local lines 864–935) | Live |
| `Personality_Test.php` | 200 | **Identical** | Live = local |
| `books.php` | 200 (30,628 B) | **Identical** (30,633 B; line endings) | Live = local |
| `courses.php` | 200 | Same content (formatting only) | Live |
| `course_details.php?subject_id=7` | 200 | Local is a capture of course 8 (same template) | Live |
| `health.php` | 200 | Same content (formatting only) | Live |
| `ind_know.php`, `lab.php`, `counity.php`, `presonal.php`, `about.php`, `contact.php`, `Peace_Building.php` | 200 | **Identical** | Live = local |
| `blog.php`, `service.php`, `team.php`, `testimonial.php` | 200 | **Identical** (car-rental template) | Live = local |
| `login.php`, `register.php`, `forget.php` | 200 | **Identical** | Live = local |
| `reset_password.php` | 200 | Live shows "❌ Invalid reset link parameters."; local shows all states at once (logic stripped) | Live + local (states) |
| `programes.php`, `books_details.php`, `doctor_detail.php`, `my_books.php`, `payment.php`, `view_book.php`, `read_pdf.php`, `view_pdf.php` | 302 → `login.php` | Live not visible logged out | **Local saved copies** (some placeholders) |
| `payment_success.php` | 302 → `courses.php` | — | Local |
| `my_courses.php` | 200 + PHP warning | — | None (design new) |
| `my_orders.php` | **500** | Missing locally | None (design new) |
| `get_videos.php?subject_id=7` | 200, 16 paid videos with YouTube links | Missing locally | Live |
| `admin/login.php` | 200 | Missing locally | Live |
| `Courses.php`, `Spirituality.php`, `download_cv.php`, `payment_status.php` | **404** | Missing locally | — |

---

## 3. Facts verified in this review (✅)

| # | Fact | Where documented |
| --- | --- | --- |
| V1 | Navbar always marks **Home** as active on every page | [02](02-features.md), [06 § 0.2 A5](06-ui-design-and-components.md#0-replication-rules-what-must-match-and-what-may-change) |
| V2 | Home stats: 829K+ Enrolled Students · 56K+ App Downloads · 40+ hrs Content Uploaded · 4.9/5 Average Rating | [02](02-features.md), [06 § 6.1](06-ui-design-and-components.md#61-home-indexphp-css-11861--9421792--25952879-js-2449-2564-2980) |
| V3 | Typing words: (1) Housewives, Students, Professionals, Seekers (150 ms); (2) American, Nepali, UAE, English, Australian (200 ms); delete 50 ms, hold 1000 ms, gap 300 ms | [06 § 6.1](06-ui-design-and-components.md#61-home-indexphp-css-11861--9421792--25952879-js-2449-2564-2980), [07 § 10](07-frontend-architecture.md#10-behaviour-hooks-jqueryvanilla--react) |
| V4 | Personality Test: 21 physical + 21 emotions questions per language, 3 options each | [02](02-features.md), [06 § 6.4](06-ui-design-and-components.md#64-personality-test-personality_testphp-css-8774-js-880) |
| V5 | Health tabs keys `physical` (default), `mental`, `chronical` | [06 § 6.11](06-ui-design-and-components.md#611-health-healthphp-css-9316-js-555), [09](09-database-models.md) |
| V6 | Personal Guidance "Book Your Free Consultation" modal (Name, Email, Preferred Mentor, goals) **is never opened**: its trigger selector matches no element | [02](02-features.md), [04](04-workflows.md), [06](06-ui-design-and-components.md) |
| V7 | Library search filters (6 categories, 5 languages); search is simulated (alert) | [02](02-features.md), [06](06-ui-design-and-components.md) |
| V8 | HTTPS works with a valid certificate but HTTP is not redirected; `www` not canonicalised | [04 § 2](04-workflows.md#2-access-control-verified-on-live), [12 § 9](12-migration-plan.md#9-security-fixes-built-into-the-rebuild) |
| V9 | `robots.txt`, `sitemap.xml`, `favicon.ico` → 404 | same |
| V10 | Directory listing disabled (403) for `/Books_pdf/`, `/uploads/`, `/uploads/payments/`; individual files still downloadable | same |
| V11 | `admin/authenticate.php` GET → "Method Not allowed" | [05 Part A](05-authentication.md#part-a--current-behaviour-reference) |
| V12 | `get_videos.php` without an ID → PHP warning (server path) + "No videos available for this course yet." | [04 § 2](04-workflows.md#2-access-control-verified-on-live) |
| V13 | Footer CSS sets the body font to Segoe UI on all pages (overrides page fonts) | [06 § 1](06-ui-design-and-components.md#1-how-the-current-front-end-is-built) |
| V14 | Brand colours come from the themed local Bootstrap (`#EA001E` / `#1F2E4E`), loaded after the CDN Bootstrap 5.1.3 | [06 § 2](06-ui-design-and-components.md#2-design-tokens), [11](11-third-party-integrations.md) |
| V15 | Admin login = Username + Password + Remember me → POST `authenticate.php`; SB Admin 2 assets; Poppins/Paytone One; red palette | [05](05-authentication.md), [07 § 14](07-frontend-architecture.md#14-admin-frontend) |

Earlier verified facts (access rules, seed data, doctor/course/book data, paid video exposure, PDF exposure, admin HTML leak) were re-checked and still hold.

---

## 4. Corrections compared with the first draft (`../../documentation/`)

| # | First draft said | Corrected to |
| --- | --- | --- |
| C1 | Personal Guidance has a working consultation request modal (front-end only) | The modal exists in code but **cannot be opened on live** (dead code); rebuild wires it to the buttons (allowed adjustment A2) |
| C2 | Guidance request fields "plan/type, message" (API `sessionType`) | `name, email, preferredMentor ('swami'\|'priya'\|'rajan'\|'any'), goals` |
| C3 | Doctor category enum `chronic` | `chronical` (same key as the live tabs) |
| C4 | Quiz "~21 questions" | Exactly 21 + 21 per language, 3 options each |
| C5 | "HTTPS not enforced ❓" | ✅ HTTPS valid, not enforced; `www` duplicate host; missing robots/sitemap/favicon |
| C6 | Auth: JWT access/refresh cookies (or sessions) | **Decided:** server-side sessions (`express-session` + `connect-mongo`); `/auth/refresh` removed, `/auth/csrf` added ([05](05-authentication.md)) |
| C7 | Separate `shared/` workspace and `client/` / `server/` folders | Only `frontend/` and `backend/` (as requested); shared code in `backend/src/shared` via `@shared/*` |
| C8 | "Same UI" meant pixel-identical everywhere | Replication rules with an explicit list of allowed adjustments ([06 § 0](06-ui-design-and-components.md#0-replication-rules-what-must-match-and-what-may-change)) |
| C9 | No user-roles, authentication, frontend or backend architecture documents | Added [03](03-user-roles-and-permissions.md), [05](05-authentication.md), [07](07-frontend-architecture.md), [08](08-backend-architecture.md) |
| C10 | Doctors: one `legacyId` | `legacyIds[]` to support merged duplicates; `settings`, `sessions` collections and legacy password fields added ([09](09-database-models.md)) |

---

## 5. Not verifiable (coverage gaps)

| Gap | Reason | Impact | How to close |
| --- | --- | --- | --- |
| G1 Logged-in UI: programmes, book details, doctor profile, course payment, My Books/Courses/Orders, PDF reader | Live redirects to login; account creation not allowed in this phase | Some screens rely on local copies or placeholders | Owner provides a test account or screenshots (Q2) |
| G2 Admin panel screens and permissions | Requires admin credentials | Admin spec is inferred | Server `admin/` source or a walkthrough (Q3) |
| G3 Database schema and data | No dump | Column names and types partly guessed | phpMyAdmin export (Q1) |
| G4 Server-side logic of register/login/reset, course payments, consultations, bookings | Source stripped locally; no POSTs allowed | Business rules partly inferred | Server source (Q1) |
| G5 Email delivery and content in production | Not testable without a purchase | Templates based on code | Server source / sample emails |
| G6 Live content of events (`programes.php`) | Login required | Event data from the local copy may be outdated | Test account (Q2) |

---

## 6. Documentation quality checks

| Check | Result |
| --- | --- |
| Internal links and anchors | ✅ all resolve |
| Routes: roles doc (03) vs UI doc (06) | ✅ identical sets |
| API base paths (10) mounted in backend (08) | ✅ all present |
| Every local PHP file mapped in the migration plan (12) | ✅ |
| Markdown lint (markdownlint) | ✅ formatting normalised |
| Confidence marks present on uncertain facts | ✅ |

---

## 7. Sign-off

| Role | Checks | Status |
| --- | --- | --- |
| Site owner | Features (02), workflows (04), replication rules (06 § 0), decisions/questions (14) | ☐ Pending |
| Tech lead | Architecture (07, 08), models (09), API (10), auth (05), migration (12) | ☐ Pending |
| Designer / QA | UI spec (06), visual parity method (12 § 5.4) | ☐ Pending |

Development starts after sign-off. Phase 1 (foundation) and Phase 2 (layout + public pages) can start before G1–G6 are closed.
