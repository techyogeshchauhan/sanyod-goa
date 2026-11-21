# frontend/ (React 18 + TypeScript/TSX, Vite)

The replica's web client: the public SANYOD website and (later) the `/admin` panel. Specification: [`../docs/07-frontend-architecture.md`](../docs/07-frontend-architecture.md).

## Status

| Phase | Done |
| --- | --- |
| 1 · Foundation | ✅ Vite + React + TS, legacy CSS pipeline with page scoping, layout shell (topbar, navbar, footer, back-to-top), auth pages (login, register, forgot, reset), auth provider + guards, API client with CSRF, all routes registered |
| 2 · Static pages | ✅ Home, About, Contact, Peace Building, the four Spirituality pages, Personality Test (quiz script ported). The template Blog page was removed (Q7) |
| 3–5 · Commerce | ✅ Books + purchase (PDF / hard copy with address), My Books, book view, PDF reader, My Orders; courses, course details, playlist (free/locked videos), course payment, success page, My Courses; Health + doctor profile + consultation form; Programmes + booking modal |
| 6 · Admin | ✅ `/admin`: login, dashboard, payment review (screenshot, approve/reject), orders + tracking, books, courses + videos, doctors, consultations, programmes, bookings, users (+ manual access), messages, newsletter (CSV), settings (UPI IDs, QR codes), admin accounts, activity log |

## Run locally

Requires Node 20+ and the backend running on port 4000 (see [`../backend/README.md`](../backend/README.md)).

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api and legacy *.php URLs to :4000)
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `preview` | Dev server / production build / preview the build |
| `npm run typecheck` | TypeScript (app + config) |
| `npm test` | Vitest unit tests (`tests/unit`) |
| `npm run e2e` | Playwright end-to-end tests (`tests/e2e`), desktop + mobile; needs both dev servers running. Start the API with `DISABLE_RATE_LIMITS=true` for repeated runs. `pages.spec` checks every route (content, script errors, sideways scrolling); `commerce.spec` runs the purchase flows through the admin panel and needs `E2E_ADMIN_USER` / `E2E_ADMIN_PASSWORD` |
| `npm run visual -- ref:login.html /login login 1440` | Screenshot a live capture (`../reference/live-html`) and the replica route into `tests/visual/__screens__` |
| `node scripts/pixel-diff.mjs a.png b.png diff.png` | Count differing pixels between two screenshots |
| `npm run assets -- images img` | Copy public asset folders from the PHP site (read-only) into `public/`, renaming files with spaces (`public/asset-map.json`) |

> In Git Bash, prefix commands that take `/paths` with `MSYS_NO_PATHCONV=1`.

## Design system

The public site uses its own design ([D-27](../docs/14-open-questions-and-decisions.md#3-decisions-log)); it is no longer a pixel replica of the live site.

- `src/main.tsx` imports Font Awesome 5.15.4 → Bootstrap Icons 1.4.1 → Bootstrap 5 → `src/styles/theme.css` (tokens, typography, components).
- Shared building blocks live in `src/components/ui` (`PageHero`, `Section`, `FeatureCard`, `StatRow`, `CtaBand`, `EmptyState`, `StatusChip`, `useReveal`, …), plus `components/auth/AuthShell` and `components/courses/CourseCard`.
- Fonts: Fraunces (headings), Inter (text), Noto Sans/Serif Devanagari (Hindi), loaded in `index.html`.
- Every public page is on the design system. Only three page stylesheets remain, still scoped by `body.page-<name>`: `home.page.css` (hero), `personality-test.page.css` (quiz) and `admin.page.css` (admin panel, D-09).
- The Personality Test logic stays in `pages/personality/personalityTest.legacy.ts` (verbatim port of the live script). It drives the markup in `PersonalityTestContent.tsx` by element id and by the classes `.active`, `.progress-container`, `.question-counter`, `.navigation-buttons`, `.question-container`, `.option-item`; keep them when changing the markup.

## How the UI stayed identical (before D-27, kept for history)

- `src/main.tsx` imported the CSS in the live cascade order: Bootstrap 5.1.3 → themed Bootstrap (`styles/legacy/bootstrap.theme.min.css`) → Font Awesome 5.15.4 → Bootstrap Icons 1.4.1 → `styles/legacy/style.css` → `styles/layout/header.css` → `styles/layout/footer.css`.
- Each page's original inline `<style>` is copied unchanged into `src/styles/pages/<name>.page.css`. `scripts/postcss-page-scope.js` scopes it to `body.page-<name>`, and the page activates it with `useBodyClass('page-<name>')`. So it applies to the whole document only while that page is shown, as in PHP.
- Markup is converted from the live HTML keeping elements, classes and texts.

## Visual parity (Phase 1)

| Page | Width | Differing pixels vs live capture |
| --- | --- | --- |
| Login | 1440 / 768 / 390 | 0.006% / 0% / 0% (only the "Home" highlight, adjustment A5) |
| Register | 1440 | 0.006% |
| Forgot password | 1440 | 0.064% (two wording changes for the emailed link, A7) |
| Reset password (invalid link) | 1440 | 0.005% |
