# 14 · Open Questions and Decisions

The single place for blockers, questions for the site owner, and decisions that change behaviour or UI. Update the **Status** column as answers arrive; never change behaviour in code without an entry here.

Status values: **Open** · **Proposed** (recommendation waiting for approval) · **Decided** · **Closed** (answered/resolved).

---

## 1. Blockers (needed before the related phase)

| ID | Item | Needed for | Owner | Status |
| --- | --- | --- | --- | --- |
| B1 | Full server files `/home4/hawkswav/sanyod.in/` (incl. `admin/`, `my_courses.php`, `my_orders.php`, `get_videos.php`, `submit_consultation.php`, `view_pdf.php`) | Phases 3–7 (business rules, admin) | Site owner / Hawkswave | Open |
| B2 | phpMyAdmin SQL export (structure + data) | Models confirmation, migration (Phase 7) | Site owner / Hawkswave | Open |
| B3 | Test user account on live (or screenshots of logged-in pages) | UI of book details, programmes, doctor profile, payment, My Books/Courses/Orders | Site owner | Open |
| B4 | Admin panel walkthrough or screenshots | Admin UI (Phase 6) | Site owner | Open |
| B5 | Hosting decision for the Node stack | Deployment | Site owner | Open |

Phases 1–2 (foundation, layout, public pages) are **not blocked**.

---

## 2. Questions for the site owner

| ID | Question | Why it matters | Default if unanswered | Status |
| --- | --- | --- | --- | --- |
| Q1 | Can we get the server files and DB export (B1, B2)? | Resolves most ❓ | — | Open |
| Q2 | Can you provide a test account / screenshots of logged-in pages (B3)? | Exact UI of those pages | Use local copies | Open |
| Q3 | What does the admin panel contain today (B4)? | Admin scope | Inferred list in [04 § 9](04-workflows.md#9-admin-workflows-inferred) | Open |
| Q4 | Keep manual UPI + screenshot approval, or add a payment gateway? | Payment flow and UI | Keep manual UPI (release 1) | Open |
| Q5 | Course access: "Lifetime Access" (course pages) or "1 Year Access" (home page)? | Entitlement expiry | Lifetime | Open |
| Q6 | Does an approved hard-copy purchase also unlock the PDF? | Entitlements | Yes | Open |
| Q7 | Keep, rewrite or drop `blog`, `service`, `team`, `testimonial` (car-rental template)? Link `Peace_Building` in the menu? | Routes/content | Drop template pages (301 → home); Peace page kept, not linked | Decided (remove the Blog page; see D-21a) |
| Q8 | Real contact-page details (email instead of `Yoursite@ex.com`, map location, branches)? | Content | Use sanyod@sanyod.in, Mapusa Goa map | Open |
| Q9 | Should the navbar highlight the current page (live always highlights Home)? | UI behaviour | Highlight the current page (A5) | Proposed |
| Q10 | Should the Personal Guidance "Book Your Free Consultation" modal open from the plan/CTA buttons (it never opens on live)? | Feature | Yes (A2) | Proposed |
| Q11 | Is SEO important (needs prerendering)? | Architecture | Prerender public pages | Open |
| Q12 | Email provider and sender/admin addresses? | Notifications | SMTP on sanyod.in; admin = sanyod@sanyod.in | Open |
| Q13 | Where are doctor CVs stored, and should they be public? | Storage/access | Logged-in users only | Open |
| Q14 | Certificates: automatic or manual? Which courses? | Feature scope | Out of release 1 | Open |
| Q15 | Are doctor rating (4.7), "Verified", "Available Today", book pages/rating ("4.5 (1,234 reviews)") real data or decoration? | Data model | Admin-editable fields | Open |
| Q16 | Home stats (829K+ students, 56K+ app downloads, 4.9/5): keep the fixed numbers, or make them editable? | Content | Keep as static text | Open |
| Q17 | Real social media links (all `#` today)? | Content | Hide links until provided | Open |
| Q18 | Should event listings stay login-only (live behaviour) or become public? | Access | Keep login-only | Open |
| Q19 | Merge duplicate doctor records (9/10, 12/13) into one profile with two categories? | Data | Merge | Proposed |
| Q20 | Book a domain/staging URL for testing (e.g. `new.sanyod.in`)? | Deployment | — | Open |

---

## 3. Decisions log

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| D-01 | Auth uses **server-side sessions** (`express-session` + `connect-mongo`), separate user/admin cookies, CSRF token | Closest to PHP sessions, revocable ([05](05-authentication.md)) | Decided (tech) | 2026-10-12 |
| D-02 | Only `frontend/` and `backend/`; shared types/zod in `backend/src/shared`, imported via `@shared/*` | Requested structure | Decided | 2026-10-12 |
| D-03 | User session: rolling 7 days (live: browser session) | Convenience for readers/learners | Proposed | 2026-10-12 |
| D-04 | Auto-login after registration, then redirect to the requested page | Live behaviour unknown; fewer steps | Proposed | 2026-10-12 |
| D-05 | Password minimum stays **6** (as live UI); strength meter unchanged | Keep the same rules | Proposed | 2026-10-12 |
| D-06 | Approved hard copy also grants PDF access | Matches the current "purchased" check | Proposed (see Q6) | 2026-10-12 |
| D-07 | Prerender public routes for SEO | Live is server-rendered | Proposed (see Q11) | 2026-10-12 |
| D-08 | Keep the live default `<title>` on all pages; add per-page titles only if approved | "Same UI"; SEO improvement optional | Proposed | 2026-10-12 |
| D-09 | Admin panel reproduces the current admin look (red palette, Poppins) with Bootstrap 5 | Familiar to the admin | Proposed | 2026-10-12 |
| D-10 | Release 1 keeps manual UPI + screenshot + admin approval | Same workflow as live | Proposed (see Q4) | 2026-10-12 |
| D-11 | Money stored as integer paise | Avoid floating-point errors | Decided (tech) | 2026-10-12 |
| D-12 | Paid video IDs and PDFs are never sent to non-entitled users | Fixes live leaks | Decided (security) | 2026-10-12 |
| D-13 | Forgot-password emails the link (no on-screen link) | Fixes account takeover risk | Decided (security) | 2026-10-12 |
| D-14 | Every legacy `.php` URL 301-redirects to its new route | Keep links/SEO | Decided | 2026-10-12 |
| D-15 | `replica-website/docs` is the source of truth; `documentation/` is the frozen first draft | Single source | Decided | 2026-10-12 |
| D-16 | Allowed UI adjustments limited to [06 § 0.2](06-ui-design-and-components.md#02-allowed-adjustments-must-keep-the-same-look-and-feel) (A1–A10) | Controlled deviation | Decided | 2026-10-12 |
| D-17 | Page CSS scoped to a **body class** (`body.page-<name>`) by a custom PostCSS plugin, not a wrapper element; footer body rule raised; footer-defined variables dropped from page CSS | Reproduces the PHP cascade exactly (verified by pixel diffs) | Decided (tech) | 2026-10-12 |
| D-18 | Frontend on Vite 8, React Router 7, Vitest 5 (planned Vite 5 / RR 6 had open security advisories); backend on bcryptjs | 0 known vulnerabilities; no native builds | Decided (tech) | 2026-10-12 |
| D-19 | Visual checks use the captured live HTML (`reference/live-html`) rendered with the PHP site's local assets, because this network's filter blocks sanyod.in | Reproducible without live access | Decided (tech) | 2026-10-12 |

When a decision changes, add a new row (e.g. D-03a) instead of editing history, and update the affected documents.
| D-20 | Phases 3–6 built on the documented defaults while B1–B4 stay open: manual UPI + screenshot + admin approval (Q4), lifetime course access (Q5), approved hard copy unlocks the PDF (Q6), logged-in-only CV download (Q13), programmes stay login-only (Q18), duplicate doctors merged (Q19) | Owner answers pending; every default is a setting or data change, not code | Decided (defaults) | 2026-10-19 |
| D-21 | Blog route shows the live template page as it is (Q7 still open) | "Same as live" until the owner decides | Proposed | 2026-10-19 |
| D-22 | Pages whose live version was a demo or broken (`view_book.php`, `read_pdf.php`, `payment.php`, `my_orders.php`, `my_courses.php`) keep their design but show real data | The PHP copies contained placeholder books/courses or failed | Decided | 2026-10-19 |
| D-23 | Ratings/review counts (books, doctors) show only when set in the admin; no invented "4.5 (1,234 reviews)" | Q15: likely decoration | Proposed | 2026-10-19 |
| D-24 | Course video IDs seeded from the captured `course_details.php` pages; paid IDs are only returned to buyers (D-12) | Real data available without the DB export | Decided | 2026-10-19 |
| D-25 | Responsive fixes: home page no longer scrolls sideways (decorative blob clipped), section titles shrink on phones; universal `*` resets keep zero specificity when scoped (health page) | Live layout bugs / scoping fidelity | Decided | 2026-10-19 |
| D-26 | `migrate-mysql` reads the phpMyAdmin `.sql` file directly (no local MySQL needed); unknown tables/columns are reported, not guessed silently | Simpler hand-over; B2 still needed | Decided (tech) | 2026-10-19 |
| D-21a | Blog page removed at the owner's request (Q7). The home Quick Access "Blog" tile is removed too; /blog and /blog.php redirect to the home page | Owner decision (replaces D-21) | Decided | 2026-10-19 |
