# 02 · Features

This document lists every feature of sanyod.in, its current status, and what the MERN rebuild must deliver. Workflow details are in [04-workflows.md](04-workflows.md); UI details are in [06-ui-design-and-components.md](06-ui-design-and-components.md).

Confidence marks: ✅ Live · 📄 Code · 🔎 Inferred · ❓ Unknown (see [README](README.md#confidence-legend-used-throughout)).

**Rebuild priority:**

- **P1:** core, must work at launch.
- **P2:** must exist at launch; currently static or fake.
- **P3:** decision needed (leftover or placeholder content).

---

## 1. Feature summary

| # | Module | Purpose | Current live status | Rebuild priority |
| --- | --- | --- | --- | --- |
| F1 | Site shell (topbar, navbar, footer) | Branding, navigation, login state | ✅ Working | P1 |
| F2 | Home page | Marketing landing, course highlights, quick access | ✅ Working (partly dynamic) | P1 |
| F3 | User accounts | Register, login, logout, forgot/reset password | ✅ Pages load; 🔎 logic exists on server | P1 |
| F4 | Books store | Catalogue, book details, buy PDF or hard copy via UPI | ✅ Catalogue public; details need login | P1 |
| F5 | Digital library (My Books, PDF reader) | Read purchased PDFs | 🔎 Needs login; local copies are placeholders | P1 |
| F6 | Orders (My Orders) | Track hard-copy book orders | ✅ **Broken on live (HTTP 500)** | P1 (fix) |
| F7 | Video courses | Course catalogue, details, YouTube playlists, purchase, locked/free videos | ✅ Working (public catalogue) | P1 |
| F8 | My Courses | List purchased courses | ✅ Page loads but shows a PHP warning when logged out | P1 (fix) |
| F9 | Health consultations | Doctor directory by category, doctor profile, consultation booking, CV download | ✅ Directory public; profile needs login; CV link 404 | P1 |
| F10 | Programmes / events | Retreats, seminars/workshops, online classes, booking with UPI payment | ✅ Needs login (redirects) | P1 |
| F11 | Personality Test | Prakriti (Vata/Pitta/Kapha) test, Emotions/Guna (Sattva/Rajas/Tamas) test, "Karma Situation" (kundli) generator; Hindi/English | ✅ Works in the browser, no backend | P1 |
| F12 | Spirituality section | 4 content pages: Indian Knowledge Wisdom, Spiritual Library, Community & Satsanga, Personal Guidance | ✅ Static content | P2 |
| F13 | About page | Story, Sankhya & Yoga philosophy, vision | ✅ Static | P2 |
| F14 | Personal guidance request | "Book Your Free Consultation" modal (Name, Email, Preferred Mentor, goals). Session plans ₹999 / ₹3,499 / ₹499 are display-only | ✅ **Modal exists in the page code but nothing on live opens it**; nothing is saved | P2 (owner: connect the plan/CTA buttons to it) |
| F15 | Contact page | Contact info, message form, map | ✅ Form **does nothing**; template placeholders | P2 |
| F16 | Newsletter subscribe (footer) | Collect emails | ✅ Animation only, **nothing is saved** | P2 |
| F17 | Admin panel | Approve payments, manage books/courses/videos/doctors/events/orders/users | ✅ Login page exists; 🔎 features inferred | P1 |
| F18 | Email notifications | Order confirmation emails (PDF / hard copy) | 📄 Code uses PHP `mail()` | P1 |
| F19 | Peace Building page | Peace programmes content | ✅ Static, **not linked from any menu** | P3 |
| F20 | Template leftover pages | `blog.php`, `service.php`, `team.php`, `testimonial.php` (car-rental "Cental" template text) | ✅ Live and public | P3 |

---

## 2. Detailed feature list

### F1 · Site shell

| Feature | Status | Notes |
| --- | --- | --- |
| Topbar: location "Mapusa, Goa", phone `8077641645` (tel link), email `sanyod@sanyod.in` (mailto) | ✅ | Navy background |
| Topbar social icons (Facebook, Twitter, Instagram, LinkedIn) | ✅ | All link to `#` (placeholders) |
| Sticky navbar with logo + "SANYOD" wordmark + tagline "Sankhya Yog Darshan" | ✅ | Tagline hidden below 768 px |
| Menu: Home · Programe · Personality Test · Books · Courses · Spirituality ▾ (Indian Knowledge Wisdom, Spiritual Library, Community & Satsanga, Personal Guidance) · Health · About | ✅ | "Home" always shows as active (bug) |
| Logged out: "User Login" button | ✅ | |
| Logged in: user's name, "My Books" button, "Logout" button | 📄 | Name from session: `name` → `user_name` → `email` → "User" |
| Admin Login button in header | 📄 | Commented out; the footer has the "Admin Login" link |
| Footer: about blurb (Hindi), newsletter field, Quick Links, working hours, contact info, social icons | ✅ | |
| Copyright bar: "Copyrights 2025 San-sankhya Yog Darshan All rights reserved." · "Designed By Hawkswave, New Delhi" | ✅ | |
| Back-to-top button (appears after 300 px of scrolling, smooth scroll) | ✅ | |

### F2 · Home page

| Feature | Status |
| --- | --- |
| Hero: "Learn Sanskrit & Indian Wisdom Online in Hindi" + 2 call-to-action buttons (both link to `#`) | ✅ |
| "Experience Wisdom in Color" with an embedded YouTube video (`ey3lX6OpVps`) | ✅ |
| "Why SANYOD?": 8 benefit tiles (Recorded Sessions, Affordable, Authentic Courses, Community, 1 Year Access, Notes & Quizzes, Certification, Live Q&A) | ✅ |
| Typing-animation banner "Thousands of [Housewives / Students / Professionals / Seekers] have chosen wisdom!" + stats: **829K+** Enrolled Students · **56K+** App Downloads · **40+ hrs** Content Uploaded · **4.9/5** Average Rating | ✅ |
| Quick Access: 8 tiles (Programs, Personality Test, Books, Courses, Spirituality, Health, Blog, Contact) | ✅ **Courses → `Courses.php` (404 on live), Spirituality → `Spirituality.php` (404 on live)** |
| Courses: "🎨 New Arrivals" (3) and "🔥 Most Popular" (3) cards from the database, "Enroll Now" → course details | ✅ |
| "Login to View All Courses" button | ✅ |
| "Why Study in Sanyod?" (4 points) | ✅ |
| "Free Masterclasses" (3: संस्कृत परिचय, गीता प्रथम अध्याय, योग सूत्र संवाद) | ✅ |
| Second typing banner "… students learn with SANYOD!" | ✅ |
| Background video section (`images/videos/video.mp4`) | ✅ |
| Animated colour particles, scroll-reveal animations | ✅ |

### F3 · User accounts

| Feature | Status | Notes |
| --- | --- | --- |
| Register (Full Name, Email, Password) | ✅ page · 🔎 logic | Sign-up code missing from the local copy |
| Login (Email, Password) | ✅ page · 🔎 logic | Redirects back to `redirect_url` stored in the session (📄 `books_details.php`) |
| Logout | 📄 | Destroys the session → `login.php` |
| Forgot password ("Direct Password Reset") | 📄 | Creates a 64-hex-character token valid for 1 hour and **shows the link on screen** (no email) |
| Reset password (new + confirm, min 6 chars, strength meter, show/hide toggle) | ✅ page | Without a valid token, live shows "❌ Invalid reset link parameters." |
| Protected pages redirect to `login.php` | ✅ | See [04 § 2](04-workflows.md#2-access-control-verified-on-live) |

### F4 · Books store

| Feature | Status | Notes |
| --- | --- | --- |
| Book catalogue grid ("Latest Images"): cover + title, click → details | ✅ | 4 books on live (IDs 26, 27, 28, 30) |
| Book details: cover, title, author, pages, year, rating, description | 📄 | Login required |
| Purchase options: **PDF version** (book price) or **Hard Book** (price **+ ₹200**) | 📄 | e.g. *Patience in Life*: PDF ₹100 / Hard Book ₹300 |
| Shipping address form for hard copies (name, phone, address, city, state, pincode, landmark) | 📄 | Validated in the browser (10-digit phone, 6-digit pincode) |
| UPI payment panel: QR image, UPI ID with copy button, amount, transaction ID, screenshot upload (jpg/jpeg/png/gif) | 📄 | UPI IDs `6355034424@upi` (PDF) and `hardbook.6355034424@upi` (hard copy) |
| Creates a `pending` payment (+ order for hard copies) and an order number `ORD<YYYYMMDDHHMMSS><3 digits>` | 📄 | |
| Success message with a timeline (admin review within 24 h; PDF within 24 h; shipping 3–5 business days) | 📄 | |
| Confirmation email (HTML) | 📄 | |
| Already-purchased state (PDF approved / hard copy approved) | 📄 | |

### F5 · Digital library

| Feature | Status | Notes |
| --- | --- | --- |
| My Books: welcome bar, stats (total purchased, PDF count, current month), purchased book cards, empty state | 📄 | Only the empty, logged-out state was saved |
| Read PDF online (embedded viewer, toolbar hidden) | 📄 / ❓ | Local `read_pdf.php` is a placeholder; `view_pdf.php` is empty locally |
| Download PDF | 📄 | Confirmation dialog before download |
| View book page (`view_book.php`) | ❓ | Local copy is a placeholder ("Web Development Complete Guide") |

### F6 · Orders

| Feature | Status |
| --- | --- |
| My Orders list (order number, book, amount, status, shipping) | ✅ **HTTP 500 on live**; ❓ UI unknown |
| Payment status page | ✅ **404** (linked from `payment_success.php`) |

### F7 · Video courses

| Feature | Status | Notes |
| --- | --- | --- |
| Course catalogue "COURSES PLAYLIST": image, title, short description, price, "40% OFF" badge, video count | ✅ | 4 courses (IDs 5–8) |
| "View Playlist" → login prompt (SweetAlert) if logged out; otherwise a modal with a YouTube player and video list | ✅ | |
| Videos marked **Free** or **Premium 🔒**; locked videos show a "Purchase Required!" dialog | ✅ | |
| Course details: image, title, description, meta (N Videos · Lifetime Access · Certificate · All Levels), price, original price, discount, "What you'll get" list, course content list | ✅ | Original price = price ÷ 0.6, rounded down |
| Login to Purchase / Login to Preview | ✅ | |
| Purchase confirmation dialog → `payment.php?subject_id=` | 📄 | |
| Course payment page (UPI/QR, transaction ID, screenshot) → admin approval | 🔎 | Local `payment.php` is a front-end placeholder |
| Payment submitted page → links to My Courses | 📄 | Live redirects to `courses.php` when opened directly |
| Certificate of completion | 🔎 | Advertised; `images/certi.jpeg` and principal signature/stamp images exist; mechanism ❓ |

### F8 · My Courses

| Feature | Status |
| --- | --- |
| Purchased courses list | ❓ UI unknown; ✅ live shows "Cannot modify header information" warning when logged out |

### F9 · Health consultations

| Feature | Status | Notes |
| --- | --- | --- |
| "Health Consultation Portal" with 3 categories: Physical Health, Mental Health, Chronic Disease Specialists | ✅ | |
| Doctor cards (photo, name, details, "View") → profile | ✅ | 5 doctors (IDs 9–13), including duplicates |
| Doctor profile: photo, name, bio, "About Online Consultation", Download CV, "Consult Doctor" | 📄 | Login required; **CV link is 404 on live** |
| Consultation form: name, email, phone (10 digits), age (1–120), medical issue, date (today or later), preferred time slot, symptoms, notes, consent checkbox | 📄 | Handler not in the local copy |

### F10 · Programmes / events

| Feature | Status | Notes |
| --- | --- | --- |
| Tabs: Retreat Programs · Seminars & Workshops · Online Classes | 📄 | Login required on live |
| Event cards: image, title, date, time, location, price, Book Now / Enroll Now | 📄 | Local copy has 6 fixed events; live likely database-driven (🔎 `assets/img/events/` uploads) |
| Booking modal: event details (read-only), UPI QR, transaction ID, name, email, phone → "I Have Paid — Submit Booking" | 📄 | Local copy only shows an alert |

### F11 · Personality Test

| Feature | Status |
| --- | --- |
| Language switch हिंदी / English | ✅ |
| Test types: **Physical Test** (शारीरिक प्रकृति, 21 questions × 3 options → Vata/Pitta/Kapha), **Emotions Test** (21 questions × 3 options → Sattva/Rajas/Tamas scores), **Karma Situation** (name, DOB DD/MM/YYYY, time HH:MM, place → zodiac-based text) | ✅ |
| Progress bar, question counter, Previous/Next, "परिणाम देखें" (see result), result card with suggestions | ✅ |
| Everything runs in the browser; nothing is stored | ✅ |

### F12–F13 · Content pages

| Page | Sections (live) |
| --- | --- |
| Indian Knowledge Wisdom (`ind_know.php`) | Hero · Paths of Spiritual Wisdom (Jnana, Bhakti, Karma, Raja Yoga) · Sacred Scriptures (Vedas, Upanishads, Gita, Yoga Sutras) · Meditation & Inner Peace · Eminent Spiritual Teachers · Eternal Wisdom Quotes · CTA |
| Spiritual Library (`lab.php`) | Hero with stats (10,000+, 5,000+, 50+) · Sacred Categories (8) · Featured Scriptures · Ancient Manuscripts · Digital Access · **Search Our Library** (text input + category filter: All Categories, Vedas, Upanishads, Puranas, Yoga Texts, Ayurveda, Philosophy + language filter: All Languages, Sanskrit, Hindi, English, Tamil, Bengali; **simulated: shows an alert**) · Study Resources · Stats · CTA |
| Community & Satsanga (`counity.php`) | Hero with stats · Why Join · Upcoming Satsang Events (3) · Community Members · Divine Music & Chanting · Discussion Forums · Virtual Satsang · Testimonials · Join CTA (live badge animation) |
| Personal Guidance (`presonal.php`) | Hero · Guidance Path (4 steps) · Mentors (3) · How it Works (4) · Sessions & pricing (₹999/session, ₹3,499/month, ₹499/session) · Testimonials · FAQ accordion · CTA with stats (500+ / 4.8/5 / 96%) · consultation modal (**in the code, not reachable on live**: its trigger selector `[href*="consultation"], [href*="Book"]` matches no link) |
| About (`about.php`) | 6 alternating image/text blocks: SanYod About · सांख्य और योग दर्शन · SanYod का विजन · पंचमहाभूत और अंतःकरण का महत्व · SanYod के माध्यम से · स्वयं के साथ जुड़ें |
| Peace Building (`Peace_Building.php`) | Hero · Peacebuilding Pillars · Global Initiatives · Global Network · Partners · Join CTA |

### F15–F16 · Contact and newsletter

| Feature | Status | Notes |
| --- | --- | --- |
| Contact page: breadcrumb, address/mail/phone cards, message form (name, email, phone, project, subject, message), branch list, Google Map | ✅ | **Template placeholders on live**: `Yoursite@ex.com`, a New York map, a breadcrumb link to `index.html` |
| Footer newsletter | ✅ | Button animation only |

### F17 · Admin panel (🔎 inferred; only the login page was seen)

| Feature | Evidence |
| --- | --- |
| Admin login: **Username**, Password, "Remember me", posts to `admin/authenticate.php` | ✅ |
| Dashboard ("Dashboard Overview") | ✅ title seen |
| Approve/reject book payments (status `pending` → `approved`) | 📄 statuses used by the user side |
| Manage hard-copy orders (`order_status`) | 📄 |
| Manage books (cover, PDF, title, author, price, description) | 🔎 `Books/book_<id>.jpg`, `Books_pdf/bookpdf_<id>.pdf` |
| Manage courses and videos (YouTube link, free/paid, order) | 🔎 `Courses/<timestamp>_<name>` uploads |
| Approve course payments | 🔎 |
| Manage doctors (photo, category, bio, CV) and consultations | 🔎 `uploads/doctors/doctor_<id>.jpg` |
| Manage events and bookings | 🔎 `assets/img/events/<timestamp>_<name>.jpg` |
| View users | 🔎 |

### F19–F20 · Pages needing a decision

| Page | Live content | Linked from | Recommendation |
| --- | --- | --- | --- |
| `Peace_Building.php` | Real peace-building content | Nowhere | Keep the route; ask the owner whether to add it to the menu |
| `blog.php` | "Cental / Rent Your Car" template | Home → Quick Access "Blog" | Ask the owner: rebuild as a real blog, or remove the tile |
| `service.php`, `team.php`, `testimonial.php` | Car-rental template | Nowhere | Do not rebuild unless the owner asks (keep a 301 redirect to `/`) |

---

## 3. Feature inventory by user role

| Role | Can do |
| --- | --- |
| **Visitor (logged out)** | Browse home, books catalogue, courses and course details, health directory, all spirituality pages, about, contact, Personality Test; register, log in, reset password |
| **Registered user** | All of the above, plus: book details and purchase (PDF / hard copy), My Books, read PDFs, My Orders, course playlists, course purchase, My Courses, doctor profiles and consultation booking, programmes and event booking |
| **Admin** | Separate login (username); manage all content, approve payments, process orders and bookings (🔎) |

---

## 4. Existing defects the rebuild must fix

| # | Defect | Where |
| --- | --- | --- |
| D1 | Quick Access "Courses" and "Spirituality" tiles lead to 404 | Home |
| D2 | `my_orders.php` returns HTTP 500 | Live |
| D3 | `my_courses.php` shows a PHP warning instead of redirecting | Live |
| D4 | `payment_status.php` (404) and `download_cv.php` (404) are linked | Payment success, doctor profile |
| D5 | Paid course video links are returned to anyone by `get_videos.php` | Live |
| D6 | Book PDFs are publicly downloadable from `/Books_pdf/` | Live |
| D7 | Password reset link shown on screen instead of emailed | Forgot password |
| D8 | Contact form, newsletter, personal-guidance request and library search do nothing | Live |
| D9 | Placeholder data: duplicate doctors, "Dr. Dr." prefix, `Yoursite@ex.com`, New York map, social links `#` | Live content |
| D10 | Navbar always highlights "Home" | All pages |

These are functional or data problems, not intended UI. Fix them in the new build while keeping the visual design identical.
