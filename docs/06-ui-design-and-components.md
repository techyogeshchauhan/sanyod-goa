# 06 · UI Design System, Pages and Components

The goal is to reproduce the **live** UI in React + TSX: the same overall look, common components and user workflows. This document is the UI specification: the design tokens, the layout shell, reusable components, every page's structure, interactions, and where the original markup and CSS live.

**UI reference priority:**

1. The live page (<http://sanyod.in/…>). Captures from 12 Oct 2026 are in [`../reference/live-html/`](../reference/live-html/).
2. The local PHP file. For public pages it is the **same output** as live (verified 12 Oct 2026), except `index.php` (see § 6.1).
3. For login-only pages, the local saved copy, which is the only source.

Confidence marks: ✅ Live · 📄 Code · 🔎 Inferred · ❓ Unknown.

---

## 0. Replication rules (what must match and what may change)

### 0.1 Must match the live site

| Area | Rule |
| --- | --- |
| Layout shell | Topbar, navbar (logo, wordmark, menu order, dropdown, auth buttons), footer (4 columns, copyright bar), back-to-top: same structure, colours, sizes, breakpoints |
| Design tokens | Brand red #EA001E / navy #1F2E4E, footer palette, each page's own palette (§ 2) |
| Typography and icons | Same font stacks (effective body font Segoe UI), Font Awesome 5 glyphs, emoji in headings |
| Page structure | Same sections in the same order with the same headings and texts (Hindi and English verbatim) |
| Common components | Cards, buttons (`btn-colorful`, `btn-saffron`, …), modals, SweetAlert dialogs, forms: same markup, classes and wording |
| Workflows | Same steps, fields, validation rules and messages (see [04](04-workflows.md)) |
| Responsiveness | Same behaviour at 1440 / 1024 / 768 / 390 px |
| Animations | Same effects and approximate timings (typing, counters, particles, reveal, hover) |

### 0.2 Allowed adjustments (must keep the same look and feel)

| # | Adjustment | Reason |
| --- | --- | --- |
| A1 | Pages that are broken or missing on live (`my_orders`, `my_courses`, `payment_status`, `download_cv`, `view_pdf`) are **newly designed** using existing components and the same styles | No working reference exists |
| A2 | Dead or placeholder controls get real behaviour with the same visuals: contact form, newsletter, guidance modal (connected to the page's buttons), library search, social links | Currently do nothing |
| A3 | Broken links fixed (Quick Access "Courses"/"Spirituality", contact breadcrumb `index.html`, footer "Sprituality" → spirituality page) | 404s on live |
| A4 | Data/content fixes: "Dr. Dr." prefix, duplicate doctors, placeholder email/map (after owner confirmation) | Data quality |
| A5 | The navbar highlights the **current** page instead of always "Home" (pending owner decision, [14](14-open-questions-and-decisions.md)) | Bug on live |
| A6 | Native `alert()` validation messages may become inline messages or SweetAlert dialogs **with the same text** | Better UX, same wording |
| A7 | Forgot-password success shows "check your email" instead of the reset link (security) | Security fix |
| A8 | Video player and PDF reader may use a protected player/viewer that looks the same | Content protection |
| A9 | Invalid HTML (nested documents, duplicate header in local `index.php`, Markdown fences) is not reproduced | Correctness |
| A10 | Accessibility improvements that don't change the visuals (alt texts, labels, focus states, `aria-*`) | Quality |

Any other visual change needs an entry in the decisions log ([14](14-open-questions-and-decisions.md)).

---

## 1. How the current front end is built

| Aspect | Current implementation | Consequence for the rebuild |
| --- | --- | --- |
| Rendering | Each `.php` page = `include header.php` + page HTML with its **own inline `<style>` and `<script>`** + `include footer.php` | One React page component + one page stylesheet per page |
| CSS order | 1) Bootstrap 5.1.3 CDN → 2) themed `css/bootstrap.min.css` (5.0.0) → 3) `css/style.css` → 4) header inline style → 5) **page inline style** → 6) **footer inline style (last, global)** | Import order must be the same (see [12 § 5](12-migration-plan.md#5-keeping-the-ui-identical)) |
| Global overrides from the footer | `footer.php`'s `<style>` sets `body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; }` **after** page styles | Body font is **Segoe UI on every page**, even where pages ask for Lato/Poppins. Pages that set `background: linear-gradient(...)` keep the gradient (only `background-color` is overridden). |
| CSS variables | Every page defines its own `:root { … }`; names **collide** (`--primary` is `#6C63FF` on the quiz, `#3a6ea5` on About, `#4a6fa5` on Peace) | Scope each page's variables under a page root class in React (`.page-about { --primary: … }`) |
| Nested documents | `index.php`, `health.php`, `doctor_detail.php` output a second `<!DOCTYPE html><head>…<body>` inside the page; the footer outputs `</head><body>` | Browsers tolerate it; in React output **one** document but keep all the CSS |
| JavaScript | Inline per page; jQuery only in the footer | React hooks per page |
| Responsiveness | Bootstrap grid + media queries at **992 px, 768 px, 576 px** (header) and per-page breakpoints | Port the media queries unchanged |
| Languages | Hindi (Devanagari) + English content | UTF-8; fonts fall back to system Devanagari fonts |

---

## 2. Design tokens

### 2.1 Brand (themed Bootstrap, `css/bootstrap.min.css`)

| Token | Value | Used for |
| --- | --- | --- |
| `--bs-primary` | **#EA001E** (red) | "SANYOD" wordmark, `.btn-primary` (User Login), `.text-primary` icons, links |
| `--bs-secondary` | **#1F2E4E** (navy) | Topbar background (`.bg-secondary`), `.btn-secondary` |
| `--bs-light` | #F2F2F2 | `.btn-light` social circles |
| `--bs-dark` | #000C21 | Nav link colour (`var(--bs-dark)`), `.btn-dark` |

### 2.2 Footer and shared palette (defined in `footer.php`, present on every page)

| Variable | Value |
| --- | --- |
| `--primary-color` | #2E7D32 (deep green) |
| `--secondary-color` | #FF9800 (saffron) |
| `--accent-color` | #5C6BC0 (indigo) |
| `--light-bg` | #F5F5F5 |
| `--dark-bg` | #1A237E |
| `--text-light` / `--text-dark` | #FFFFFF / #333333 |
| `--gradient-primary` | `linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)` |
| `--gradient-secondary` | `linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)` |
| `--gradient-dark` | `linear-gradient(135deg, #1A237E 0%, #283593 100%)` (footer background) |

### 2.3 Page palettes (each page's own `:root`)

| Page | Theme name | Key tokens |
| --- | --- | --- |
| Home `index.php` | "Vibrant / Indian colours" | saffron #FF9933 (light #FFB366, dark #E68A00), indigo #4B0082, deep purple #6A0DAD, emerald #50C878, peacock blue #0047AB / green #00A693, mango #FFC324, lotus pink #FFB6C1, sandalwood #F5DEB3; gradients `saffron`, `indigo`, `emerald`, `peacock`, `sunset` (#FD5E53→#FF8A80), `rainbow`; radii 10/15/20 px |
| Indian Knowledge `ind_know.php` | "Divine" | saffron-sunrise #FF9933, golden-sunlight #FFD700, sacred-indigo #4B0082, holy-basil #006400, lotus-pink #E6A8D7, river-ganga #87CEEB, moonlight #E6E6FA; gradients `divine`, `moksha`, `sacred` (#4B0082→#800000), `sunrise`, `lotus`, `aura` |
| Spiritual Library `lab.php` | "Library" | indigo #4B0082, maroon #800000, saffron #FF9933, gold #FFD700, copper #B87333, moss #8A9A5B, parchment #F5F5DC, ivory #FFFFF0, teal #008080; gradients `scripture`, `wisdom`, `parchment`, `knowledge`, `text` |
| Community `counity.php` | "Satsang" | maroon #800000, saffron #FF9933, gold #FFD700, turmeric #FFC324, cream #FFFDD0, earth #8B4513, leaf #228B22, river #87CEEB, indigo #4B0082, lotus #FFB6C1; gradients `community`, `satsang`, `sadhana`, `bhajan` |
| Personal Guidance `presonal.php` | "Guidance" | saffron #FF9933, gold #FFD700, indigo #4B0082, deep #191970, growth #228B22, earth #8B4513, lotus #E6A8D7, peace #87CEEB, wisdom #2F4F4F, light #FFF8DC; gradients `guru`, `mentor`, `guidance`, `path`, `aura` |
| About `about.php` | "Classic" | primary #3a6ea5, secondary #9c6d38, accent #d4af37, nature #4a7c59, light #f8f5e6, dark #2c3e50 |
| Personality Test | "Quiz" | primary #6C63FF, secondary #4D44DB, sattva #4CAF50, rajas #FF9800, tamas #F44336, dark #343A40 |
| Peace Building | "Peace" | primary #4a6fa5 (dark #3a5784, light #6b8cbc), secondary #7b9acc, accent #ff9e6d, peace-blue #5bc0de, peace-green #5cb85c |
| Auth pages | — | Body `linear-gradient(135deg, #f5f7fa, #c3cfe2)`; card headers: **Login** #007bff→#00c6ff, **Register/Forgot** #28a745→#20c997, **Reset** #dc3545→#fd7e14 |
| Admin login | — | primary #d32f2f (dark #b71c1c, light #ff6659), accent #ffab00, Poppins font |

### 2.4 Typography

| Use | Font |
| --- | --- |
| Body (effective) | 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif (footer override) |
| Navbar brand "SANYOD" | Montserrat 800, 34 px (inline), `var(--bs-primary)` |
| Brand tagline | Lato 500, 0.7 rem, #666 |
| Nav links | 13 px, weight 900, letter-spacing 0.5 px, padding 25 px 0, colour `var(--bs-dark)` |
| Auth pages | Lato declared (overridden by Segoe UI) |
| Decorative headings | 'Sanskrit', 'Philosopher', 'Times New Roman', serif (not loaded → system serif) |
| Headings in sections | Mostly `<h2>` with a highlighted `<span>` word (gradient or colour text) |

### 2.5 Icons

Font Awesome 5.15.4 (`fas`/`fab`), plus FA 6.0.0 on Health and 6.4.0 on Doctor profile; Bootstrap Icons 1.4.1. Emoji are used in headings ("🎨 New Arrivals", "🔥 Most Popular", "📚", "📦").

---

## 3. Layout shell (every public page)

```text
┌──────────────────────────────────────────────────────────────────────┐
│ TopBar (bg-secondary navy, min-height 45px)                          │
│  📍 Mapusa, Goa   📞 8077641645   ✉ sanyod@sanyod.in    (f)(t)(ig)(in) │
├──────────────────────────────────────────────────────────────────────┤
│ NavBar (sticky-top, white)                                           │
│ [logo 50px] SANYOD           Home Programe Personality Test Books    │
│             Sankhya Yog…     Courses Spirituality▾ Health About      │
│                                         [User Login] | [name][My Books][Logout] │
├──────────────────────────────────────────────────────────────────────┤
│                         <page content>                               │
├──────────────────────────────────────────────────────────────────────┤
│ Footer (gradient-dark, 5px saffron top border, Om & lotus watermarks) │
│ About (Hindi) + newsletter │ Quick Links │ Still have questions │ Contact Info │
├──────────────────────────────────────────────────────────────────────┤
│ Copyright bar (rgba(0,0,0,.85))  © Copyrights 2025 …   Designed By Hawkswave, New Delhi │
└──────────────────────────────────────────────────────────────────────┘
                                                      [↑] BackToTop (50px, saffron)
```

### 3.1 `<TopBar />` (📄 `header.php` lines 196–217)

- Left: map marker "Mapusa, Goa" (`#`), phone `tel:8077641645`, `mailto:sanyod@sanyod.in`. Icons `text-primary` with inline `color:#fff`.
- Right: 4 round `btn-light btn-sm-square` social buttons (links `#`).
- Below 768 px both halves centre and stack.

### 3.2 `<NavBar />` (📄 `header.php` lines 220–286 + inline CSS lines 31–191)

- Logo `images/WhatsApp Image 2026-01-20 at 10.04.38 AM-Photoroom.png` (height 50 → 45 → 40 → 35 px at the breakpoints).
- Menu items and dropdown as listed in [02 § F1](02-features.md#f1--site-shell); Bootstrap `navbar-expand-lg`, toggler icon `fas fa-bars`.
- Auth area (`d-flex align-items-center`):
  - logged out: `btn btn-primary rounded-pill` "User Login" (icon only below `md`);
  - logged in: `<i class="fas fa-user">` + name (ellipsis, max 150/120 px), `btn-outline-primary btn-sm` "My Books", `btn-danger rounded-pill` "Logout".
- **Active state:** currently "Home" is always `.active` (bug). Rebuild: use `NavLink` so the current page is active (owner may prefer to keep exact behaviour; decision).
- Below 576 px: toggler absolutely positioned at the right; the auth area becomes full width with a top border.

### 3.3 `<Footer />` (📄 `footer.php`)

| Column | Content |
| --- | --- |
| 1 | Heading "San -sankhya (सांख्य), Yo - Yog (योग), d- darshan (दर्शन)"; Hindi paragraph about साधक **जामवंत** (`.name-highlight` gradient text) with `.highlight-text` phrase; newsletter input + "Subscribe" pill button |
| 2 | **Quick Links**: Home, Programe, Personality Test, Books, Courses, Sprituality (→ courses.php, sic), Health, About, Admin Login (new tab) |
| 3 | **Still have questions**: Mon–Friday 09.00 am to 07.00 pm · Saturday 10.00 am to 05.00 pm · Vacation: All Sunday is our vacation |
| 4 | **Contact Info**: Mapusa, Goa · sanyod@sanyod.in · 8077641645 (phone) · 8077641645 (print icon) · 4 social buttons |

- Link animation: each link fades up (`fadeInUp` 0.5 s, staggered 0.1 s). Hover: saffron colour + 10 px indent.
- Decorative icons `fa-om` and `fa-lotus` at 8 rem, 5 % opacity.
- Newsletter button click: spinner → "Subscribed!" + `bg-success` (rebuild: call the API, keep the same feedback).
- **BackToTop:** fixed bottom/right 30 px, 50 px, saffron gradient; visible after `scrollY > 300`; smooth scroll in 800 ms.

---

## 4. Reusable component inventory (proposed TSX components)

| Component | Variants / props | Used on | Original markup |
| --- | --- | --- | --- |
| `Layout` | `bodyClass`, `pageClass` | All | header.php + footer.php |
| `TopBar`, `NavBar`, `Footer`, `CopyrightBar`, `BackToTop` | auth state | All | header/footer |
| `HeroSection` | `theme` = `vibrant` \| `divine` \| `library` \| `satsang` \| `guidance` \| `peace`; title, subtitle, buttons, stats | index, ind_know, lab, counity, presonal, Peace | `.hero-vibrant`, `.hero-divine`, `.library-hero`, `.satsang-hero`, `.guidance-hero`, `.hero` |
| `SectionTitle` | text + highlighted span, theme | Most pages | `<h2>Why <span>SANYOD?</span></h2>` |
| `IconFeatureCard` | icon, title, text, colour | index (Why SANYOD, Why Study), ind_know, lab, counity, presonal | `.category-card-vibrant`, etc. |
| `QuickAccessTile` | icon, title, href | index | `.course-card-vibrant` (onclick navigation) |
| `StatCounter` / `StatsBar` | value ("10,000+", "4.8/5", "96%"), label, animate | index, lab, counity, presonal | `.stats-*` |
| `TypingBanner` | words list | index (×2) | `.typing-vibrant` |
| `ParticlesBackground` | `colors` \| `divine` \| `diyas` \| `books` \| `guidance` | index, ind_know, counity, lab, presonal | JS-generated elements |
| `RevealOnScroll` | | index, ind_know, lab, counity, presonal | IntersectionObserver adding classes |
| `TestimonialCard` | quote, name, image | counity, presonal | |
| `FaqAccordion` | items | presonal | `.faq-section` |
| `CtaSection` | title, text, buttons, stats | ind_know, lab, counity, presonal, Peace | |
| `BookGalleryCard` | cover, title, href | books | `.gallery-card`, `.gallery-image`, `.image-name`; section title `.otto` (3D text-shadow) |
| `CourseCardVibrant` | image, title, desc, price, button colour (saffron/emerald/indigo) | index | `.course-card-vibrant`, `.btn-colorful` |
| `CourseCard` | image, title, short desc, price, discount, video count, purchased, logged-in | courses | `.subject-card`, `.price-section`, `.action-buttons` |
| `CourseDetail` | course, purchased, logged-in | course_details | `.course-image-section`, `.course-detail-section` |
| `PriceBlock` | current, original, discount % | course_details, courses | `.current-price`, `.original-price`, `.discount-badge` |
| `VideoPlaylistModal` | course, videos, canAccess | courses, course_details | `#playlistModal`, `#mainVideoPlayer`, `#videoPlaylist` |
| `VideoListItem` | n, title, free/paid, locked | playlist, course content | `.video-item.paid`, `.locked-badge` |
| `DoctorCategoryTabs` | categories | health | `.category-tab`, `.category-content` |
| `DoctorCard` | photo, name, specialisations, qualification, experience, fee | health | `.doctor-card`, `.btn-detail` (whole card clickable) |
| `DoctorProfile` | doctor | doctor_detail | rating, Verified, Available Today, category, qualification, experience, fee, bio |
| `ConsultationForm` | doctorId | doctor_detail | `#consult-section` |
| `PurchaseOptionCard` | type pdf/hardbook, price, features, selected | books_details | `.purchase-option`, `.option-select-btn` |
| `ShippingAddressForm` | Address | books_details | `#hardbook-address`, `#address-form` |
| `OrderSummary` | item, type, amount | books_details | |
| `UpiPaymentPanel` | amount, upiId, qr, onSubmit | books_details, payment, programes | `.payment-section`, `.qr-container`, copy UPI button, transaction ID, screenshot |
| `EventTabs` + `EventCard` + `BookingModal` | events by category | programes | `.content-section`, `#bookingModal`, `.upi-section` |
| `AuthCard` | theme login/register/forgot/reset | auth pages | `.login-card`, `.register-card`, `.forget-card`, `.reset-card` |
| `PasswordStrengthMeter` + requirements list | | reset_password | `.password-meter`, `.requirement-list` |
| `FlashAlert` | success/error, dismissible | books_details, auth | Bootstrap `.alert` |
| `EmptyState` | icon, title, text, CTA | my_books | `.empty-state` |
| `StatCard` | icon, value, label | my_books | `.stat-card` |
| `PdfViewer` | url, title | read_pdf | `.pdf-viewer-container`, `.pdf-embed` |
| `PersonalityQuiz` | language, testType | Personality_Test | see § 6.4 |
| `KundliForm` / `KundliResult` | | Personality_Test | `#kundliForm` |
| `ContactInfoCards`, `ContactForm`, `MapEmbed`, `Breadcrumb` | | contact | `.bg-breadcrumb`, `.contact` |

---

## 5. Page inventory (routes)

| Legacy URL | New route (proposal) | Access | React page | UI source |
| --- | --- | --- | --- | --- |
| `/index.php` | `/` | Public | `HomePage` | Live (local has a duplicate header) |
| `/programes.php` | `/programs` | **User** | `ProgramsPage` | Local saved copy (live needs login) |
| `/Personality_Test.php` | `/personality-test` | Public | `PersonalityTestPage` | Live = local |
| `/books.php` | `/books` | Public | `BooksPage` | Live = local |
| `/books_details.php?books=:id` | `/books/:slug` | **User** | `BookDetailPage` | Local saved copy (book 26) |
| `/my_books.php` | `/my-books` | **User** | `MyBooksPage` | Local |
| `/view_book.php`, `/read_pdf.php`, `/view_pdf.php` | `/my-books/:slug/read` | **User + entitlement** | `ReadBookPage` | Local placeholder ❓ |
| `/my_orders.php` | `/my-orders` | **User** | `MyOrdersPage` | ❓ (live 500): design new in the same style |
| `/courses.php` | `/courses` | Public | `CoursesPage` | Live |
| `/course_details.php?subject_id=:id` | `/courses/:slug` | Public | `CourseDetailPage` | Live (course 7) |
| `/payment.php?subject_id=:id` | `/courses/:slug/payment` | **User** | `CoursePaymentPage` | Local placeholder ❓ |
| `/payment_success.php` | `/payment/success` | **User** (after submit) | `PaymentSuccessPage` | Local |
| `/my_courses.php` | `/my-courses` | **User** | `MyCoursesPage` | ❓ (live shows a warning): design new |
| `/health.php` | `/health` | Public | `HealthPage` | Live |
| `/doctor_detail.php?doctor_id=:id` | `/health/doctors/:slug` | **User** | `DoctorDetailPage` | Local saved copy (doctor 11) |
| `/ind_know.php` | `/spirituality/indian-knowledge` | Public | `IndianKnowledgePage` | Live = local |
| `/lab.php` | `/spirituality/library` | Public | `SpiritualLibraryPage` | Live = local |
| `/counity.php` | `/spirituality/community` | Public | `CommunityPage` | Live = local |
| `/presonal.php` | `/spirituality/personal-guidance` | Public | `PersonalGuidancePage` | Live = local |
| `/about.php` | `/about` | Public | `AboutPage` | Live = local |
| `/contact.php` | `/contact` | Public | `ContactPage` | Live = local |
| `/Peace_Building.php` | `/peace-building` | Public | `PeaceBuildingPage` | Live = local |
| `/blog.php`, `/service.php`, `/team.php`, `/testimonial.php` | decision | Public | — | Template leftovers |
| `/login.php`, `/register.php`, `/forget.php`, `/reset_password.php` | `/login`, `/register`, `/forgot-password`, `/reset-password` | Guest | Auth pages | Live = local |
| `/logout.php` | `POST /api/auth/logout` | User | — | |
| `/admin/login.php` | `/admin/login` | Guest | `AdminLoginPage` | Live |
| `/admin/*` | `/admin/*` | **Admin** | Admin pages | ❓ |

All legacy URLs must **301-redirect** to the new routes (see [12 § 4](12-migration-plan.md#4-url-and-route-mapping)).

---

## 6. Page-by-page UI specification

Section lists follow the live order. CSS and JS line numbers refer to the local files.

### 6.1 Home (`index.php`, CSS 11–861 / 942–1792 / 2595–2879, JS 2449, 2564, 2980)

> ⚠ Local lines **864–935** contain a **second copy of the topbar and navbar** that is **not on live**. Do not port them.

| # | Section (class) | Content |
| --- | --- | --- |
| 1 | `.hero-vibrant` | H1 "Learn Sanskrit & Indian Wisdom Online in Hindi", subtitle, 2 buttons `.btn-saffron` / `.btn-indigo` (`.btn-colorful`, href `#`), colour particles |
| 2 | `.features-vibrant` | H2 "Experience Wisdom in Color" + YouTube iframe `ey3lX6OpVps` |
| 3 | `.categories-vibrant` | H2 "Why SANYOD?" + 8 cards (Recorded Sessions, Affordable, Authentic Courses, Community, 1 Year Access, Notes & Quizzes, Certification, Live Q&A) |
| 4 | `.typing-vibrant` | "Thousands of <span id=typing1> have chosen wisdom!": words **Housewives, Students, Professionals, Seekers** (type 150 ms/char, delete 50 ms/char, pause 1000 ms at full word, 300 ms before the next word) |
| 5 | `.stats-vibrant` | 4 stats: **829K+** ENROLLED STUDENTS · **56K+** APP DOWNLOADS · **40+ hrs** CONTENT UPLOADED · **4.9/5** AVERAGE RATING (suffix in a 2rem `<span>`) |
| 6 | `.courses-vibrant` | H2 "Quick Access" + 8 tiles (Programs, Personality Test, Books, Courses, Spirituality, Health, Blog, Contact) |
| 7 | `.courses-vibrant` | H2 "Courses" → H3 "🎨 New Arrivals" (3 course cards) → H3 "🔥 Most Popular" (3 cards) → "Login to View All Courses" button. Cards: image `.course-img-vibrant`, title, "Enroll Now" (`btn-saffron` / `btn-emerald` / `btn-indigo` cycling) |
| 8 | `.why-study-vibrant` | H2 "Why Study in Sanyod?" + 4 items |
| 9 | `.courses-vibrant` | H2 "Free Masterclasses" + 3 cards (संस्कृत परिचय, गीता प्रथम अध्याय, योग सूत्र संवाद), buttons non-clickable (`pointer-events:none`) |
| 10 | `.typing-vibrant` (light blue→purple tint background) | "<span id=typing2> students learn with SANYOD!": words **American, Nepali, UAE, English, Australian** (200 ms/char) |
| 11 | `.features-vibrant` | Autoplay, muted, looping background video `images/videos/video.mp4` |

Behaviour: `createColorParticles()`, `createTypingAnimation()`/`type()`, IntersectionObserver reveal (cards start `opacity:0; translateY(30px)` and animate in over 0.6 s), hover effects.

### 6.2 Programmes (`programes.php`, CSS 21–450, JS 1511) (login required; local copy)

- Category tabs switching `.content-section` panels: `#retreat` "Retreat Programs", `#seminar` "Seminars & Workshops", `#online` "Online Classes".
- Event card: image, H5 title, date, time, location, price, button "Book Now" (retreat/seminar) or "Enroll Now" (online), with `data-event-*` attributes.
- `#bookingModal` "Book Your Event": read-only event fields, then `.upi-section` "Pay Using UPI" with QR and the fields from [04 § 7](04-workflows.md#7-programmes--event-booking--live-requires-login), submit "I Have Paid — Submit Booking".
- ⚠ The local file starts and ends with a Markdown fence and references missing images (`Books/retreat.jpg`, …). Ask for the live version.

### 6.3 Books (`books.php`, CSS 6–61)

- Section background `#f0f0f0`, `container py-5`. Title row: `<h2 class="otto"><i class="fa fa-tv"></i> <b>Latest Images</b></h2>` (3D grey text-shadow stack).
- Grid `col-md-6 col-lg-4` of `.gallery-card`: linked cover image `.gallery-image` + `.image-name` caption.

### 6.4 Personality Test (`Personality_Test.php`, CSS 8–774, JS 880)

- Top controls: language buttons **हिंदी / English**; test type buttons **Physical Test / Emotions Test / Karma Situation**.
- Header image + description change per test (`updateHeaderImage`, `updateTestContent`; Unsplash images).
- Quiz card (`#quizForm`): progress bar, "Question X of N", question text, 3 option tiles (one per dosha/guna), buttons **पिछला** (Previous), **अगला** (Next), **परिणाम देखें** (See result).
- Result (`आपका परिणाम`): dominant type + description; for Emotions, three `.guna-score` boxes (Sattva green / Rajas orange / Tamas red) with values; **"आपके लिए सुझाव"** (suggestions) list.
- Karma Situation (`#kundliForm`): Name, Date of birth (DD/MM/YYYY), Time (HH:MM), Place → "कुंडली बनाएँ" → generated analysis HTML.
- All labels switch language. Quiz data (verified): **21 physical + 21 emotions questions per language**, 3 options each (option → `vata`/`pitta`/`kapha` or `sattva`/`rajas`/`tamas`); per-language blocks: `testDescription`, `kundliLabels`, `images`, `imageTexts`, `physicalQuestions`, `emotionsQuestions`, `descriptions`, `suggestions`.

### 6.5 Book detail (`books_details.php`, CSS 106–115, 172–182, 537–921, JS 1224) (login required; local copy)

1. Flash alert (success panel with order timeline / error).
2. Book header: cover, H1 title, "By Sadhaka Jamwant", meta (pages, published year, rating), "Book Description".
3. "Choose Your Purchase Option": two `.purchase-option` cards:
   - **PDF Version** ₹price: Instant download after approval · Read on any device · Lifetime access · Searchable text · Environment friendly → "Select PDF Version";
   - **Hard Book (Physical Copy)** ₹price+200: Physical paperback/hardcover book · Free shipping across India · 3-5 business days delivery · 7-day return policy → "Select Hard Book".
4. `#hardbook-address` (shown for a hard copy): "Shipping Address" form + "Order Summary".
5. `#payment-section` "Pay via UPI / QR Code": "Pay **₹X** using any UPI app", important notice, QR image (PDF/hard-copy variants), UPI ID + **Copy** button, caption, form: transaction ID, screenshot, "Submit Payment & Place Order".
6. Purchased / pending states replace the purchase options (📄 PHP conditions).

### 6.6 Courses (`courses.php`, CSS 5–221, JS 389)

- Title row "COURSES PLAYLIST" (`.otto`, 30 px) + "Login to Access Courses" (logged out).
- `.subject-card` grid (`col-lg-4 col-md-6`): image (`.subject-image`), H3 `.subject-title`, `.subject-description` (truncated + "..."), `.price-section` (`.price` "₹499.00", `.discount` "40% OFF", `.video-count` "16 Videos"), `.action-buttons`: **View Playlist** (`btn-primary .view-playlist`) + **Login to Buy** (logged out) / Buy / Purchased (🔎).
- `#playlistModal`: dark modal, H5 "<Course> - Playlist", iframe `#mainVideoPlayer` (height 400), list `#videoPlaylist`.

### 6.7 Course detail (`course_details.php`, CSS 6–302, JS 443)

- Title row "COURSE DETAILS" + "Back to Courses".
- Two columns: `.course-image-section` (image) and `.course-detail-section`: H1 title, "Course Description", meta items (fa-video "N Videos", fa-clock "Lifetime Access", fa-certificate "Certificate", fa-level-up-alt "All Levels"), `.price-section` (current ₹499.00, struck original ₹831, "40% OFF", "One-time payment. No recurring charges."), action buttons (**Login to Purchase** / **Login to Preview** when logged out; Purchase / Preview when logged in), "What you'll get:" (Full lifetime access to all N videos · Downloadable resources and exercises · Certificate of completion · Q&A support from instructors · Mobile and TV access).
- `.videos-section` "Course Content (N Videos)" list + the same playlist modal.

### 6.8 Payment (course) (`payment.php`, CSS 4–296, JS 673) (login required; ❓ the local copy is a placeholder)

Local layout: "PAYMENT" title + Back to Course; left: course summary (title, price section, "Your Information", "What you'll get"); right `.payment-form-section` "Complete Your Purchase": payment method tiles (`data-method="upi"`), UPI details `6355034424@upi`, transaction ID, "Click to Upload Screenshot" drop area (max 5 MB, preview), submit "Submit Payment for Approval - ₹X". **Get the live version before building.**

### 6.9 Payment success (`payment_success.php`, CSS 10–36)

Centred card: pulsing clock icon, "Payment Submitted Successfully!", "Your payment has been submitted for admin approval.", warning alert "Approval Process … Usually within 24 hours", two cards (Payment ID #…, Status "Pending Approval"), buttons **Check My Courses** (`btn-warning`) / **View Payment Status**, footnote about email notification.

### 6.10 My Books (`my_books.php`, CSS 8–292, JS 360)

Welcome alert (name, email, buttons My Orders / Browse Books), `.books-stats` (3 `.stat-card`: Total Books Purchased, PDF Books, current month), book cards grid (`.book-card`, `.btn-download` with confirm) or `.empty-state` "No Books Purchased Yet".

### 6.11 Health (`health.php`, CSS 9–316, JS 555)

H1 "Health Consultation Portal", category tabs (`.category-tab[data-category]` → `#<category>-content`) with keys **`physical`** (default active), **`mental`**, **`chronical`**: Physical Health / Mental Health / Chronic Disease Specialists. `.doctor-card`: photo, "Dr. {name}", specialisations, qualification, "N years experience", "Fee: ₹X", **View** (`.btn-detail`); the whole card is clickable.

### 6.12 Doctor detail (`doctor_detail.php`, CSS 13–363, JS 537) (login required; local copy)

Profile header: photo, H1 "Dr. {name}", rating (4.7), "Verified", "Available Today", category, qualification, experience, "₹X Fee", bio; H5 "About Online Consultation" text; buttons **Download CV**, **Consult Doctor** (smooth-scroll to `#consult-section`). Consultation form (2-column rows) per [04 § 6](04-workflows.md#6-health-consultations). Footer note "🛡 Your information is secure and confidential. Doctor will contact you within 24 hours."

### 6.13 Spirituality pages

| Page | Sections (live order) | Behaviour |
| --- | --- | --- |
| **Indian Knowledge** `ind_know.php` (CSS 3–669, JS 1029) | `.hero-divine` (buttons → `#wisdom`, `#teachings`) · `#wisdom .path-divine` (4 yoga paths) · `#teachings .scriptures-divine` (4 scripture cards with images) · `.meditation-divine` (3) · `.teachers-divine` (2 teachers) · `.quotes-divine` (4 quotes) · `.path-divine` CTA | `createDivineParticles()`, `animateOnScroll()` |
| **Spiritual Library** `lab.php` (CSS 2–688, JS 1258) | `.library-hero` (stats 10,000+ / 5,000+ / 50+) · `#explore .categories-library` (8) · `.scriptures-library` (3 featured) · `.manuscripts-library` (3) · `.digital-library` (3) · `#search .search-library` (input "Search for scriptures, verses, or topics..." + category select: All Categories, Vedas, Upanishads, Puranas, Yoga Texts, Ayurveda, Philosophy + language select: All Languages, Sanskrit, Hindi, English, Tamil, Bengali + search button; Enter key works) · `.resources-library` (4) · `.stats-library` · CTA (100% / 24/7 / No Ads) | `createFloatingBooks()`, `setupLibrarySearch()` (simulated), `setupBookEffects()`, `animateLibraryCards()` |
| **Community** `counity.php` (CSS 2–662, JS 1188) | `.satsang-hero` (5,000+ / 100+ / 50+) · `.community-features` (4) · `#schedule .satsang-schedule` (3 events) · `.community-members` (3) · `.bhajan-section` (3) · `.forum-section` (3) · `.virtual-satsang` (2) · `.testimonial-satsang` (4) · `#join .join-cta-satsang` (24/7 / 100% / 50+) | `createFloatingDiyas()`, `animateSatsangCards()`, `animateStatistics()`, `updateLiveBadge()` |
| **Personal Guidance** `presonal.php` (CSS 2–631, JS 1114) | `.guidance-hero` (→ `#mentors`, `#process`) · `.mentorship-path` (4 steps) · `#mentors` (3 mentors) · `#process` (4 steps) · `.sessions-section` (3 plans: ₹999/session, ₹3,499/month, ₹499/session) · `.testimonial-guidance` (4) · `.faq-section` (5 Q&A) · CTA (500+ / 4.8/5 / 96%) | `createGuidanceElements()`, `animateGuidanceCards()`, `setupFAQ()`, `setupConsultationForm()` builds a `.consultation-modal` overlay ("Book Your Free Consultation": Your Name, Email Address, Select Preferred Mentor [Swami Devanand (Vedanta & Meditation) / Dr. Priya Sharma (Yoga & Ayurveda) / Acharya Rajan (Scripture & Rituals) / Any Available Mentor], "Briefly describe your spiritual goals...", close ×) **but ✅ no element on live matches its trigger selector, so it never opens.** Rebuild: open it from the session-plan and CTA buttons (allowed adjustment A2) |

### 6.14 About (`about.php`, CSS 8–176)

Six alternating `.content-section` rows (image left/right): SanYod About (`images/SanYod.jpg`), सांख्य और योग दर्शन (`images/IMG-20250921-WA0003.jpg`), SanYod का विजन (`…WA0004.jpg`), पंचमहाभूत और अंतःकरण का महत्व (`…WA0002.jpg`), SanYod के माध्यम से (`img/WhatsApp Image 2025-11-01 at 20.33.28_d2d0929a.jpg`), स्वयं के साथ जुड़ें (Unsplash).

### 6.15 Contact (`contact.php`, template styles in `css/style.css`)

`.bg-breadcrumb` header "Contact Us" (breadcrumb Home → `index.html`), H1 "Contact Us", info cards (Address, Mail Us, Telephone, `Yoursite@ex.com`), "Send Your Message" form (Your Name, Your Email, Phone, Project, Subject, message textarea, "Send Message" `btn-light`), "Our Branch 01/02/03", Google Map iframe. **Placeholder data must be replaced with SANYOD details (owner to confirm).**

### 6.16 Peace Building (`Peace_Building.php`, CSS 2–522)

`.hero` (H1 "Peace Building and Global Collaboration") · `#pillars` (3) · `#initiatives` (3) · `#network` · `#partners` · `#action` CTA "Join the Global Peace Movement". No JS.

### 6.17 Auth pages

| Page | Card | Fields / elements |
| --- | --- | --- |
| Login (`login.php`, CSS 10–67) | `.login-card`, header "User Login" (blue gradient), rounded-pill inputs, hover lift | Email, Password, **Login**; "Don't have an account? Register"; "forget" link |
| Register (`register.php`, CSS 7–69) | `.register-card`, header "User Registration" (green) | Full Name, Email, Password, **Register**; "Already have an account? Login" |
| Forgot (`forget.php`, CSS 61–155, JS 234) | `.forget-card`, header "🔑 Direct Password Reset" | Unlock icon, "Forgot Your Password?", email input with envelope addon, "Quick Reset Process" 3 numbered steps, **Generate Reset Link**, Back to Login, "Remember your password? Go to Login". Success state: link button + copy-to-clipboard input (rebuild: "Check your email" message in the same card) |
| Reset (`reset_password.php`, CSS 10–82, JS 184) | `.reset-card`, header "Set New Password" (red→orange) | Error alert; user-shield icon; "For: <email>"; New Password + Confirm with show/hide eye buttons; strength meter (red < 50 %, yellow < 75 %, green); requirement list (min 6, match); submit disabled until valid; **Set New Password & Login**; Get New Reset Link. Invalid-link state: warning icon, "Invalid Reset Link", Request New Reset Link / Back to Login |

### 6.18 Admin login (`/admin/login.php`)

SB Admin 2 layout, Poppins/Paytone One fonts, red palette; form: **Username**, **Password**, **Remember me** checkbox, **Login** → `authenticate.php`. Other admin screens ❓.

---

## 7. Front-end behaviour to port (jQuery / vanilla → React)

| Behaviour | Current | React approach |
| --- | --- | --- |
| Back-to-top visibility + smooth scroll | jQuery scroll handler, `$('html, body').animate` | `useScrollPosition` + `window.scrollTo({top:0, behavior:'smooth'})` |
| Footer link stagger | jQuery sets `animation-delay` | Inline style `animationDelay` from the index |
| Typing animation | `createTypingAnimation()`, `type()` | `useTypewriter(words, speeds)` |
| Counters | `animateStatistics()` / setInterval | `useCountUp(target, inView)` |
| Particles / floating elements | DOM creation with random positions | `<Particles variant>` rendering N absolutely positioned spans (memoised random values) |
| Scroll reveal | IntersectionObserver adding classes | `useInView` hook toggling the same class names |
| Tabs (health, programmes, quiz) | classList toggling | `useState(activeTab)` rendering the same classes |
| Modals (playlist, booking, consultation) | `new bootstrap.Modal(el).show()` | Bootstrap `Modal` via a ref, or react-bootstrap `Modal` with identical classes |
| SweetAlert dialogs | `Swal.fire({...})` | Same calls from the `sweetalert2` package |
| Copy UPI ID / reset link | `navigator.clipboard.writeText` + message | Same, with a toast/message |
| Password show/hide + strength | DOM handlers | Controlled inputs + derived state |
| Form validation alerts (`alert()`) | `alert('Please enter a valid 10-digit phone number')` | Keep `alert` text, or show the same text inline (decision) |
| Doctor card click | Reads the `href` and navigates | `onClick={() => navigate(...)}` (ignore clicks on buttons) |

---

## 8. Assets inventory (copy to `frontend/public/` or the storage bucket)

| Folder | Content | Count | Public? |
| --- | --- | --- | --- |
| `images/` | Logo (`WhatsApp Image 2026-01-20 at 10.04.38 AM-Photoroom.png`), About photos, `videos/video.mp4`, icons (`learn.png`, `live.png`, …), `certi.jpeg`, `Qr.png` | ~40 | Yes |
| `img/` | Template images (carousel, team, blog, testimonial) + About photo | ~30 | Yes (mostly unused) |
| `Books/` | Book covers `book_<uniqid>.*` + `QR.jpg` | 26 + QR | Covers yes |
| `Books_pdf/` | Book PDFs | 25 | **No: private storage** |
| `Courses/` | Course images | 16 | Yes |
| `uploads/doctors/` | Doctor photos | 15 | Yes |
| `uploads/payments/` | Customer payment screenshots | 14 | **No: private** |
| `uploads/*.jpg` | Misc uploads (posters, signature/stamp, QR) | 34 | Review |
| `assets/img/events/` | Event images | 11 | Yes |

Rename files with spaces (e.g. `WhatsApp Image …`) during migration and keep a mapping so database references are updated.

---

## 9. UI acceptance criteria

1. For every public page, a **Playwright screenshot** of the new page at 1440 px, 1024 px, 768 px and 390 px widths matches the live page within an agreed pixel-diff threshold (dynamic areas masked).
2. The same texts (Hindi and English), icons, colours, fonts, spacing and hover/animation effects.
3. The navbar, footer and back-to-top behave identically.
4. All forms show the same fields, placeholders, labels and validation messages.
5. Fixes listed in [02 § 4](02-features.md#4-existing-defects-the-rebuild-must-fix) are applied without changing the visual design.
