# 11 · Third-Party Libraries, Services and Technologies

Everything the current site depends on, where it is used, and what the MERN + TSX rebuild should use instead.

Confidence marks: ✅ Live · 📄 Code · 🔎 Inferred · ❓ Unknown.

---

## 1. Current technology stack

| Layer | Technology | Evidence |
| --- | --- | --- |
| Server | **Apache** on shared Linux hosting (cPanel-style path `/home4/hawkswav/sanyod.in/`) | ✅ `Server: Apache` header; file paths in PHP warnings |
| Language | **PHP 8.x** (procedural, no framework, no Composer) | ✅ PHP 8 warning format ("Undefined variable $user_id") |
| Database | **MySQL / MariaDB** via `mysqli` (string-built SQL) | 📄 |
| Sessions | PHP native sessions (`PHPSESSID` cookie) | ✅ |
| Email | PHP `mail()` (server sendmail) | 📄 `books_details.php` |
| File storage | Local disk, public folders (`Books/`, `Books_pdf/`, `Courses/`, `uploads/`, `uploads/doctors/`, `uploads/payments/`, `assets/img/events/`) | ✅ |
| Front end | Server-rendered HTML + inline `<style>` per page + inline JS, jQuery, Bootstrap 5 | ✅ |
| Admin panel | **SB Admin 2** template (Bootstrap 3-era) + metisMenu + jQuery Validate | ✅ admin login page |
| Bot protection | Host-level JS challenge cookie `humans_21909` (HTTP 409 on first request) | ✅ seen on `/contact.php` |
| Version control / CI | None | 📄 |

---

## 2. Front-end libraries (public site)

| Library | Version / source | Used on | Purpose | Notes |
| --- | --- | --- | --- | --- |
| **Bootstrap CSS** | 5.1.3 from `cdn.jsdelivr.net` | All pages | Grid, utilities, components | Loaded **first** |
| **Custom Bootstrap CSS** | **5.0.0** local `css/bootstrap.min.css` (themed) | All pages | **Brand theme**: `--bs-primary #EA001E` (red), `--bs-secondary #1F2E4E` (navy), `--bs-light #F2F2F2`, `--bs-dark #000C21` | Loaded **after** the CDN copy, so it wins. **Must be kept for an identical UI.** |
| Template CSS | local `css/style.css` ("Cental" template: spinner, buttons, navbar, carousel, features, team, testimonial, contact, footer) | All pages | Base template styles | |
| **Bootstrap JS bundle** | 5.0.0 (`cdn.jsdelivr.net`) in the footer; 5.1.3 / 5.3.0 on some standalone pages | All pages | Navbar collapse, dropdown, modals, alerts | Several versions mixed |
| **jQuery** | 3.6.4 (`ajax.googleapis.com`); 3.6.0 (`code.jquery.com`) on `doctor_detail` | All pages | Back-to-top, footer animation, small handlers | |
| **Font Awesome** | 5.15.4 (`use.fontawesome.com`) on all pages; 6.0.0 on `health`; 6.4.0 on `doctor_detail` | All pages | Icons (`fas`, `fab`, `fa`) | Some pages use v4-style names (`fa-clock-o`) that FA5 doesn't render |
| **Bootstrap Icons** | 1.4.1 (`cdn.jsdelivr.net`) | All pages | Icons | Rarely used |
| **SweetAlert2** | `@11` (`cdn.jsdelivr.net`) | `courses`, `course_details` | "Login Required", "Purchase Required!", purchase confirmation dialogs | |
| **Google Fonts** | **Lato** (400/700/900 + italics), **Montserrat** (100–900 + italics) | All pages | Typography (navbar brand: Montserrat; body: Lato) | ⚠ `footer.php` sets `body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif }` **globally**, so most body text actually renders in Segoe UI |
| Fonts referenced but **not loaded** | 'Sanskrit', 'Philosopher', 'Times New Roman' | content pages | Fall back to the system serif | Reproduce the same fallback |
| animate.css | `lib/animate/animate.min.css` (local) | header (all pages) | Animation classes (`animate__fadeInUp`) | ❓ file not in the local copy |
| Owl Carousel | `lib/owlcarousel/assets/owl.carousel.min.css` | header (all pages) | Carousel styles | ❓ not in the local copy; no carousel JS loaded, effectively unused |
| WOW.js / counterUp / Owl JS | referenced in `js/main.js` | **none** (`main.js` is not loaded) | — | Not needed |

## 3. Admin panel libraries (✅ `/admin/login.php`)

| Library | Source |
| --- | --- |
| Bootstrap (v3-era) | `admin/assets/css/bootstrap.min.css`, `assets/js/bootstrap.min.js` |
| SB Admin 2 | `assets/css/sb-admin-2.css`, `assets/js/sb-admin-2.js` |
| metisMenu | `assets/js/metisMenu/metisMenu.min.{css,js}` |
| Font Awesome 4 | `assets/fonts/font-awesome/css/font-awesome.min.css` |
| jQuery + jQuery Validate | `assets/js/jquery.min.js`, `assets/js/jquery.validate.min.js` |
| Google Fonts | **Poppins** (300–700), **Paytone One** |
| Custom CSS | `../assets/css/style3.css`, `style4.css`; palette `--primary-color #d32f2f`, `--accent-color #ffab00` |

---

## 4. External services and embeds

| Service | How it's used | Where | Notes / risks |
| --- | --- | --- | --- |
| **YouTube** | `<iframe>` embeds `https://www.youtube.com/embed/<id>` (+ `autoplay=1` on select) | Home (intro video `ey3lX6OpVps`), course playlists | Course videos are **unlisted/public YouTube videos**: anyone with the link can watch them. Paid links are currently exposed by `get_videos.php`. |
| **UPI (manual)** | Static QR image `Books/QR.jpg`, UPI IDs `6355034424@upi`, `hardbook.6355034424@upi` | Book purchase, course payment, event booking | No gateway, no automatic verification; the admin checks the screenshot and transaction ID by hand |
| **PHP `mail()`** | HTML order confirmation + admin notification | Book purchase | Sender is a placeholder `noreply@bookstore.com`; admin address placeholder `admin@bookstore.com` (likely undelivered/spam) |
| **Google Maps embed** | `<iframe src="https://www.google.com/maps/embed?pb=…">` | Contact page | Shows a **New York placeholder** location, not Goa |
| **Unsplash** | Hot-linked photos `images.unsplash.com/photo-…` (6 different images) | ind_know, lab, counity, presonal, about | External dependency; consider downloading (licence allows) and self-hosting |
| Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | Web fonts | All pages | |
| `tel:` / `mailto:` links | 8077641645, sanyod@sanyod.in | Topbar, footer | |
| Social links | Facebook, Twitter, Instagram, LinkedIn | Topbar, footer | **All placeholders** (`#` or empty) |

There is **no** analytics, payment gateway, SMS, OAuth/social login, CAPTCHA or third-party API integration.

---

## 5. Recommended stack for the MERN + TSX rebuild

### 5.1 Front end (`replica-website/frontend/`)

| Need | Recommendation | Why |
| --- | --- | --- |
| Build tool | **Vite** + React 18 + **TypeScript** (`.tsx`) | Fast, simple SPA build |
| Routing | **React Router v6** | Matches the multi-page structure; supports legacy `.php` URL redirects |
| Styling | **Same CSS files as today**: Bootstrap 5.1.3 CSS + the custom `bootstrap.min.css` (5.0.0 theme) + `style.css` + per-page CSS ported from the inline `<style>` blocks | The only reliable way to keep the UI **pixel-identical** (see [12 § 5](12-migration-plan.md#5-keeping-the-ui-identical)) |
| Bootstrap behaviour | `bootstrap` npm package **5.1.3** JS (Modal, Collapse, Dropdown) called from React hooks, **or** `react-bootstrap` rendering the same markup/classes | Keep the same DOM/classes |
| Icons | `@fortawesome/fontawesome-free@5.15.4` CSS (same class names) + `bootstrap-icons@1.4.1` | Same glyphs |
| Fonts | Google Fonts `<link>` in `index.html` (Lato, Montserrat) or `@fontsource/lato`, `@fontsource/montserrat` | Same typography |
| Dialogs | **sweetalert2** (npm) + `sweetalert2-react-content` | Same dialogs as today |
| Data fetching | **TanStack Query** + **axios** (or fetch) | Caching, loading/error states |
| Forms | **react-hook-form** + **zod** (schemas shared with the server) | Same validation on both sides |
| Head / SEO | **react-helmet-async** | Per-page `<title>`/meta |
| Animations | Plain CSS + small hooks (`useInView` via IntersectionObserver, typing effect, counters) | Replace jQuery/inline scripts 1:1 |
| PDF reader | Browser built-in viewer in an `<iframe>` of a **protected streaming URL**, or **react-pdf** (pdf.js) to discourage downloads | Protect paid PDFs |
| YouTube | Plain `<iframe>` (same as today) or `react-youtube` | |
| Testing | **Vitest** + React Testing Library; **Playwright** for end-to-end and **visual comparison against the live site** | Proves the UI is identical |

### 5.2 Back end (`replica-website/backend/`)

| Need | Recommendation |
| --- | --- |
| Runtime / framework | **Node.js 20 LTS** + **Express 4** in TypeScript (`tsx`/`ts-node-dev` for dev, `tsc` build) |
| Database | **MongoDB 7** (Atlas or self-hosted) + **Mongoose 8** |
| Validation | **zod** (shared package with the client) |
| Auth | **bcrypt** password hashes + **server-side sessions** (`express-session` + `connect-mongo`, httpOnly/Secure/SameSite=Lax cookies) + CSRF token (see [05](05-authentication.md)) |
| Uploads | **multer** (memory or disk) + type/size validation (`file-type` magic-byte check) |
| File storage | Local private folder **or** S3-compatible storage (AWS S3, Cloudflare R2, DigitalOcean Spaces) with signed URLs |
| Email | **Nodemailer** with SMTP (Zoho / Google Workspace / Brevo / Amazon SES) + HTML templates (e.g. `mjml` or React Email) |
| Security | `helmet`, `cors` (exact origin), `express-rate-limit` (login, reset, forms), `csurf`-style CSRF token or SameSite=strict cookies, `express-mongo-sanitize`, `hpp` |
| Logging | `pino` + `pino-http` |
| Config | `dotenv` + zod-validated env schema |
| Admin UI | Part of the same React app (`/admin/*` routes) using the same libraries; reproduce the SB Admin 2 look only if the owner wants (decision) |
| Testing | Vitest/Jest + Supertest; `mongodb-memory-server` |
| Process / hosting | PM2 or Docker on a VPS (shared PHP hosting can't run Node), Nginx reverse proxy, Let's Encrypt HTTPS |

### 5.3 Optional upgrades (owner decisions)

| Area | Option | Benefit |
| --- | --- | --- |
| Payments | **Razorpay** / **Cashfree** / **PhonePe PG** UPI checkout with webhooks | Automatic confirmation, no manual screenshot checks. **Changes the UI flow**, so keep manual UPI for an identical first release. |
| Video protection | Move paid videos from YouTube to **Bunny Stream / Vimeo / Mux** with signed URLs | Paid videos can't be shared |
| Email marketing | Brevo / Mailchimp for newsletter subscribers | Real newsletter |
| Spam protection | Cloudflare **Turnstile** / hCaptcha on register, contact and forms | Fewer bots |
| Analytics | Google Analytics 4 / Plausible | Traffic insight |

---

## 6. Library replacement map (PHP site → MERN)

| Current | Replacement |
| --- | --- |
| jQuery (`$(window).scroll`, `.animate`, `.click`) | React `useEffect` + `window.scrollTo({ behavior: 'smooth' })` |
| Inline `<script>` per page | Typed hooks/components per page (`useTypingAnimation`, `useCountUp`, `useParticles`, `useRevealOnScroll`) |
| `fetch('get_videos.php')` returning HTML | `GET /api/courses/:id/videos` returning JSON, rendered by `<VideoPlaylist>` |
| PHP sessions | express-session + connect-mongo (server-side sessions) |
| `mysqli` string SQL | Mongoose models + zod validation |
| PHP `mail()` | Nodemailer + SMTP provider |
| `move_uploaded_file` into public folders | multer → private storage + authorised download endpoints |
| SweetAlert2 via CDN | `sweetalert2` npm package |
| Bootstrap/Font Awesome via CDN | npm packages pinned to the **same versions** (5.1.3 CSS, theme 5.0.0, FA 5.15.4) |
| SB Admin 2 (admin) | React admin pages (same app), optionally with SB Admin 2 styling |

---

## 7. Version pinning for an identical UI

Pin these exact versions so spacing, colours and icons don't change:

```json
{
  "bootstrap": "5.1.3",
  "@fortawesome/fontawesome-free": "5.15.4",
  "bootstrap-icons": "1.4.1",
  "sweetalert2": "^11"
}
```

Plus the **local themed `css/bootstrap.min.css` (5.0.0)** and **`css/style.css`**, copied unchanged into `frontend/src/styles/legacy/` and imported **after** Bootstrap 5.1.3, in the same order as today.
