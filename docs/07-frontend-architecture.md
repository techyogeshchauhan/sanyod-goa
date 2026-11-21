# 07 · Frontend Architecture (React 18 + TypeScript/TSX)

Specification for `replica-website/frontend`: the public site **and** the admin panel in one Vite app. UI rules are in [06](06-ui-design-and-components.md); API contracts in [10](10-api-specification.md).

---

## 1. Goals

1. Reproduce the live UI by reusing its markup, classes and CSS ([06 § 0](06-ui-design-and-components.md#0-replication-rules-what-must-match-and-what-may-change)).
2. Type-safe end to end: shared types and zod schemas from `backend/src/shared` via `@shared/*`.
3. Clear separation: pages (route-level) → sections → reusable components → hooks → API layer.
4. Fast, accessible, SEO-friendly (per-page `<title>`/meta, lazy routes, optional prerender).

---

## 2. Stack and pinned versions

| Package | Version | Purpose |
| --- | --- | --- |
| `react`, `react-dom` | 18.x | UI |
| `typescript` | 5.x (`strict: true`) | Types |
| `vite`, `@vitejs/plugin-react` | 8.x / 6.x | Build/dev server (upgraded from the planned 5.x: 5.x had open security advisories) |
| `react-router-dom` | 7.x | Routing (v6 API, React 18 compatible; 6.x had open advisories) |
| `@tanstack/react-query` | 5.x | Server state |
| `axios` | 1.x | HTTP client (`withCredentials`) |
| `react-hook-form`, `@hookform/resolvers`, `zod` | latest 7.x / 3.x / 3.x | Forms + validation |
| `react-helmet-async` | 2.x | Title/meta per page |
| `bootstrap` | **5.1.3** (CSS + JS bundle) | Same as live CDN |
| `@fortawesome/fontawesome-free` | **5.15.4** | Same icons |
| `bootstrap-icons` | **1.4.1** | Same icons |
| `sweetalert2` | 11.x | Same dialogs |
| `postcss` + `scripts/postcss-page-scope.js` | — | Page CSS scoping (custom plugin, § 6.2) |
| `@popperjs/core` | 2.x | Bootstrap dropdown positioning |
| Dev: `vitest` 5, `@testing-library/react`, `@playwright/test`, `pixelmatch` + `pngjs`, `eslint`, `prettier` | latest | Quality |

Exact versions are fixed in `package.json` (no `^` for bootstrap / FA / BI).

---

## 3. Folder structure

```text
frontend/
├─ index.html                     # <title>, meta, Google Fonts (Lato, Montserrat), #root
├─ package.json  tsconfig.json  vite.config.ts  postcss.config.cjs  .env.example
├─ public/                        # served as-is (same paths as live where possible)
│  ├─ images/  img/  Courses/  Books/ (covers + QR only)  uploads/doctors/  assets/img/events/
│  ├─ robots.txt  favicon.ico  (new)
├─ src/
│  ├─ main.tsx                    # global CSS import order (see § 6), providers, router
│  ├─ App.tsx  router.tsx
│  ├─ styles/
│  │  ├─ legacy/bootstrap.theme.min.css   # copy of D:\sanyod.in\css\bootstrap.min.css (unchanged)
│  │  ├─ legacy/style.css                 # copy of D:\sanyod.in\css\style.css (unchanged)
│  │  ├─ layout/header.css                # header.php inline <style>
│  │  ├─ layout/footer.css                # footer.php inline <style> (global, imported last)
│  │  └─ pages/*.page.css                 # one per page, auto-scoped (see § 6)
│  ├─ layouts/
│  │  ├─ PublicLayout.tsx                 # TopBar + NavBar + <Outlet/> + Footer + CopyrightBar + BackToTop
│  │  └─ AdminLayout.tsx                  # admin sidebar/topbar
│  ├─ components/
│  │  ├─ layout/   TopBar, NavBar, Footer, CopyrightBar, BackToTop
│  │  ├─ common/   SectionTitle, HeroSection, IconFeatureCard, StatCounter, CtaSection,
│  │  │            TestimonialCard, FaqAccordion, FlashAlert, EmptyState, Spinner, Modal
│  │  ├─ effects/  TypingText, Particles, RevealOnScroll
│  │  ├─ books/    BookGalleryCard, PurchaseOptionCard, ShippingAddressForm, OrderSummary
│  │  ├─ payments/ UpiPaymentPanel, ScreenshotUpload
│  │  ├─ courses/  CourseCard, CourseCardVibrant, PriceBlock, VideoPlaylistModal, VideoListItem
│  │  ├─ health/   DoctorCategoryTabs, DoctorCard, DoctorProfile, ConsultationForm
│  │  ├─ events/   EventTabs, EventCard, BookingModal
│  │  ├─ auth/     AuthCard, PasswordInput, PasswordStrengthMeter
│  │  └─ quiz/     PersonalityQuiz, QuizProgress, ResultCard, GunaScores, KundliForm
│  ├─ pages/                      # one folder per route: Page.tsx + sections/ + page.css
│  │  ├─ home/ HomePage.tsx, sections/{Hero,WhySanyod,Typing,Stats,QuickAccess,Courses,WhyStudy,Masterclasses,VideoBanner}.tsx, home.page.css
│  │  ├─ books/ BooksPage.tsx, BookDetailPage.tsx
│  │  ├─ courses/ CoursesPage.tsx, CourseDetailPage.tsx, CoursePaymentPage.tsx, PaymentSuccessPage.tsx
│  │  ├─ library/ MyBooksPage.tsx, ReadBookPage.tsx, MyCoursesPage.tsx, MyOrdersPage.tsx
│  │  ├─ health/ HealthPage.tsx, DoctorDetailPage.tsx
│  │  ├─ programs/ ProgramsPage.tsx
│  │  ├─ spirituality/ IndianKnowledgePage.tsx, SpiritualLibraryPage.tsx, CommunityPage.tsx, PersonalGuidancePage.tsx
│  │  ├─ static/ AboutPage.tsx, ContactPage.tsx, PeaceBuildingPage.tsx, NotFoundPage.tsx
│  │  ├─ personality/ PersonalityTestPage.tsx
│  │  ├─ auth/ LoginPage.tsx, RegisterPage.tsx, ForgotPasswordPage.tsx, ResetPasswordPage.tsx
│  │  └─ admin/ LoginPage.tsx, DashboardPage.tsx, payments/, orders/, books/, courses/, doctors/,
│  │            consultations/, events/, users/, messages/, settings/
│  ├─ routes/   guards.tsx (RequireAuth, GuestOnly, RequireAdmin), LegacyPhpRedirect.tsx
│  ├─ providers/ AuthProvider.tsx, AdminAuthProvider.tsx, QueryProvider.tsx, SettingsProvider.tsx
│  ├─ hooks/    useAuth, useAdminAuth, useBodyClass, useInView, useTypewriter, useCountUp,
│  │            useScrollPosition, useBootstrapModal, useSwal, useCopyToClipboard
│  ├─ api/      client.ts (axios), auth.ts, books.ts, courses.ts, payments.ts, library.ts,
│  │            orders.ts, doctors.ts, consultations.ts, events.ts, forms.ts, settings.ts, admin/*.ts
│  ├─ data/     personalityQuiz.ts (hi + en), staticContent/*.ts (long Hindi/English texts)
│  ├─ utils/    money.ts (paise → "₹1,234.00"), youtube.ts, dates.ts (Asia/Kolkata), cn.ts
│  └─ types/    ui.ts (frontend-only types)
└─ tests/
   ├─ unit/  (Vitest + RTL)
   └─ e2e/   (Playwright: flows + visual comparison with ../reference and live)
```

`tsconfig.json` paths: `"@/*": ["src/*"]`, `"@shared/*": ["../backend/src/shared/*"]` (also mirrored in `vite.config.ts` `resolve.alias`). Shared code must be **pure TypeScript** (types + zod, no Node APIs).

---

## 4. Routing

- The route table, legacy URLs and access are in [06 § 5](06-ui-design-and-components.md#5-page-inventory-routes) and [03 § 2](03-user-roles-and-permissions.md#2-page-access-frontend-routes).
- All pages are **lazy-loaded** (`React.lazy`) except the layout and the home page.
- `PublicLayout` wraps all public and user pages; `AdminLayout` wraps `/admin/*` (except `/admin/login`).
- **Legacy `.php` URLs** are redirected by the server (301, [12 § 4](12-migration-plan.md#4-url-and-route-mapping)). `LegacyPhpRedirect` is a client fallback for dev and static hosting.
- Scroll to top on route change; keep hash links (`#wisdom`, `#mentors`, …) working with a smooth scroll.
- `*` → `NotFoundPage` (styled like the site; live returns the Apache 404).

```tsx
// src/router.tsx (shape)
const router = createBrowserRouter([
  { element: <PublicLayout />, errorElement: <ErrorPage />, children: [
    { index: true, element: <HomePage /> },
    { path: 'books', element: <BooksPage /> },
    { path: 'books/:slug', element: <RequireAuth><BookDetailPage /></RequireAuth> },
    // … see 06 § 5
  ]},
  { path: 'admin/login', element: <AdminLoginPage /> },
  { path: 'admin', element: <RequireAdmin><AdminLayout /></RequireAdmin>, children: [/* … */] },
  { path: '*', element: <NotFoundPage /> },
]);
```

---

## 5. Page composition pattern

```tsx
// src/pages/spirituality/IndianKnowledgePage.tsx
import '@/styles/pages/ind-know.page.css';     // auto-scoped to body.page-ind-know
export default function IndianKnowledgePage() {
  useBodyClass('page-ind-know');                  // activates the page CSS
  return (
    <>
      <Helmet><title>Sankhya Yog Darshan - Yoga, Spirituality & Personal Growth</title></Helmet>
      <HeroDivine />  <PathsOfWisdom />  <SacredScriptures />  <Meditation />
      <Teachers />    <Quotes />         <JourneyCta />
    </>
  );
}
```

Rules:

- One section component per live `<section>`; markup copied from the live HTML and converted to JSX (`class` → `className`, etc.; see [12 § 5.1](12-migration-plan.md#51-markup-convert-dont-redesign)).
- Static texts stay in JSX or `data/staticContent/*.ts`, **verbatim**.
- Dynamic lists (`books`, `courses`, `doctors`, `events`, `videos`) are rendered with `.map()` producing the **same markup** as live per item.

---

## 6. CSS pipeline (key to an identical UI)

> **Changed by [D-27](14-open-questions-and-decisions.md#3-decisions-log) (21 Nov 2026):** `src/main.tsx` now loads Font Awesome → Bootstrap Icons → Bootstrap 5 → `styles/theme.css` (the SANYOD design system). The legacy files (`styles/legacy/*`, `styles/layout/*`) are no longer imported. Page-scoped `*.page.css` files that remain still go through the body-class scoping below (D-17). The rest of this section describes the original replica pipeline.

### 6.1 Global import order (`src/main.tsx`)

```ts
import 'bootstrap/dist/css/bootstrap.min.css';            // 1. Bootstrap 5.1.3
import './styles/legacy/bootstrap.theme.min.css';         // 2. themed 5.0.0 (brand red/navy)
import '@fortawesome/fontawesome-free/css/all.min.css';   // 3. FA 5.15.4
import 'bootstrap-icons/font/bootstrap-icons.css';        // 4. BI 1.4.1
import './styles/legacy/style.css';                       // 5. template CSS
import './styles/layout/header.css';                      // 6. header inline CSS
import './styles/layout/footer.css';                      // 7. footer CSS: global
// 8. page CSS (*.page.css): imported by each lazy page, scoped to body.page-<name>
```

Lazy pages inject their CSS after `footer.css`, while on live the footer's `<style>` came last. Two measures restore the live cascade:

1. The footer's `body { font-family: 'Segoe UI'…; background-color: #f9f9f9 }` is written as `:root body.sanyod` (`index.html` sets `<body class="sanyod">`), specificity (0,2,1) > scoped page rules (0,1,1).
2. Page `:root` variables that `footer.css` also defines (e.g. `--text-dark`) are removed from page CSS, because the footer's values always won on live.

### 6.2 Page CSS scoping

`scripts/postcss-page-scope.js` (registered in `postcss.config.js`) transforms only `*.page.css` files. Every rule is scoped to a **body class**, so the page's original CSS applies to the whole document (header and footer included) only while that page is shown, exactly like the PHP page's inline `<style>`:

| Original | Becomes (file `login.page.css`) |
| --- | --- |
| `.login-card .btn {…}` | `body.page-login .login-card .btn {…}` |
| `:root { --primary: … }` | `body.page-login { --primary: … }` (footer-defined variables dropped) |
| `body {…}` / `body .x {…}` | `body.page-login {…}` / `body.page-login .x {…}` |
| `html {…}` | `:root:has(> body.page-login) {…}` |
| `@keyframes pulse` + `animation: pulse …` | `@keyframes pulse--page-login` + `animation: pulse--page-login …` |
| `@media (…) { … }` | Kept; inner rules scoped |

The page component calls `useBodyClass('page-login')`. Header and footer CSS are **not** scoped (global, as on live). Unit tests: `tests/unit/postcss-page-scope.test.ts`.

### 6.3 Fonts and assets

- `index.html` keeps the live Google Fonts link (Lato + Montserrat). Admin adds Poppins + Paytone One.
- Images keep their live paths under `public/` (e.g. `/Courses/1769870100_109497.png`) so copied markup works; files with spaces are renamed and mapped ([06 § 8](06-ui-design-and-components.md#8-assets-inventory-copy-to-frontendpublic-or-the-storage-bucket)).

---

## 7. State management and data fetching

| Kind | Tool | Examples |
| --- | --- | --- |
| Server state | TanStack Query | `['books']`, `['book', slug]`, `['courses', {home}]`, `['course-videos', id]`, `['me']`, `['library','books']`, `['orders']` |
| Auth state | `AuthProvider` (wraps `['me']` query) | navbar, guards |
| Site settings | `SettingsProvider` (`GET /api/settings/public`, cached 1 h) | phone, email, hours, UPI IDs |
| Local UI state | `useState` / `useReducer` | tabs, modals, quiz progress, selected purchase option |
| Forms | react-hook-form + zod | all forms |

API client (`src/api/client.ts`): base URL `import.meta.env.VITE_API_URL`, `withCredentials: true`, fetches and attaches the CSRF token to writes, maps errors to `{ code, message, fields }`, and on `401` triggers the login redirect with `from`.

Mutations invalidate the related queries (e.g. a payment submit invalidates `['book-status', id]` and `['library','books']`).

---

## 8. Forms and validation

| Form | Schema (shared) | Live messages to keep |
| --- | --- | --- |
| Register / Login | `registerSchema`, `loginSchema` | Same labels/placeholders ("Enter your full name", "Enter your email", "Enter your password") |
| Forgot / Reset | `forgotSchema`, `resetSchema` | "Minimum 6 characters", "Passwords must match", strength colours |
| Shipping address | `addressSchema` | "10 digit phone number", "6 digit pincode", "Please fill all required fields: …" |
| Payment proof | `createPaymentSchema` + file check (≤ 5 MB, image) | "Please enter your Transaction ID.", "Please upload your payment screenshot.", "File size must be less than 5MB." |
| Consultation | `consultationSchema` | "Please enter a valid 10-digit phone number", "Please enter a valid age (1-120)" |
| Event booking | `eventBookingSchema` | placeholders "Enter your UPI transaction ID", "10-digit phone number" |
| Contact / newsletter / guidance | `contactSchema`, `newsletterSchema`, `guidanceSchema` | Same field placeholders |

Server errors (`fields`) are mapped back with `setError`.

---

## 9. Configuration and environment variables

`frontend/.env.example`

```dotenv
VITE_API_URL=/api                       # same-origin behind Nginx; http://localhost:4000/api in dev
VITE_SITE_URL=http://localhost:5173
VITE_DEFAULT_TITLE=Sankhya Yog Darshan - Yoga, Spirituality & Personal Growth
VITE_ENABLE_PRERENDER=false
```

Dev proxy (`vite.config.ts`): `/api` → `http://localhost:4000`. No secrets in frontend env vars.

---

## 10. Behaviour hooks (jQuery/vanilla → React)

| Hook | Replaces | Notes |
| --- | --- | --- |
| `useTypewriter(words, speed)` | `createTypingAnimation` | 150 ms type (200 ms for typing2), 50 ms delete, 1000 ms hold, 300 ms gap |
| `useCountUp(target, inView)` | counters | |
| `useInView(ref, opts)` | IntersectionObserver reveal | Adds the same classes |
| `useScrollPosition()` | jQuery scroll | Back-to-top visible when `scrollY > 300` |
| `useBootstrapModal(ref)` | `new bootstrap.Modal()` | show/hide/dispose |
| `useSwal()` | `Swal.fire` | Same texts/buttons |
| `useBodyClass(cls)` | page `body {}` styles | Adds/removes `body.page-*` |
| `useCopyToClipboard()` | copy UPI ID / links | |

---

## 11. Conventions

| Topic | Rule |
| --- | --- |
| Files | Components `PascalCase.tsx`; hooks `useX.ts`; page CSS `kebab-name.page.css` |
| Exports | Pages: default export (lazy); components: named exports |
| Types | No `any`; props interfaces `XProps`; API types from `@shared/types` |
| Styling | Reuse legacy classes; new styles only in page CSS or `components/*.css` with the same tokens; no inline styles except where copied from live |
| Text | Never paraphrase live texts; Hindi stays in Devanagari |
| Lint/format | ESLint (react, react-hooks, jsx-a11y, @typescript-eslint) + Prettier; CI fails on errors |
| Commits | Conventional commits (`feat(books): …`) |

---

## 12. Testing

| Level | Tool | What |
| --- | --- | --- |
| Unit | Vitest + RTL | Hooks (typewriter, count-up), utils (money), components (PriceBlock original-price formula, PasswordStrengthMeter) |
| Integration | Vitest + MSW | Pages with mocked API (books, courses, auth) |
| E2E | Playwright | Register → login → buy PDF (pending) → admin approve → read PDF; course playlist access; consultation; booking |
| Visual parity | Playwright + pixelmatch | Each public route vs `reference/live-html` or the live URL at 1440/1024/768/390 px, dynamic regions masked |

---

## 13. Performance, SEO and accessibility

- Lazy routes, code splitting per page; images with `loading="lazy"` below the fold (same visuals).
- `react-helmet-async`: default title same as live; optional per-page titles (decision D-08).
- Optional prerender of public routes (decision D-07) for SEO without changing the UI.
- Accessibility improvements without visual change: `alt` texts, form `label`s/`aria-*`, focus outlines, modal focus trap (allowed adjustment A10).

---

## 14. Admin frontend

- Routes under `/admin`; separate `AdminAuthProvider`; layout with sidebar + topbar.
- Look: the live admin uses SB Admin 2 with a red palette (`#d32f2f`) and Poppins. Release 1 reproduces that look with Bootstrap 5 components (decision D-09).
- Screens: Dashboard, Payments (queue with screenshot viewer, approve/reject), Orders, Books, Courses + Videos (drag-sort), Doctors, Consultations, Events + Bookings, Users, Messages (contact / guidance / newsletter), Settings, Admins (superadmin).
- Tables with server-side pagination, filters and search; forms with the same zod schemas as the API.
