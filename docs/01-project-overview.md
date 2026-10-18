# 01 · Project Overview

## 1. What we are building

A **replica of the SANYOD – Sankhya Yog Darshan website** (<http://sanyod.in/>) on the **MERN stack with TypeScript/TSX**:

- **Frontend:** React 18 + TSX (Vite) in `replica-website/frontend`.
- **Backend:** Node.js 20 + Express + TypeScript + MongoDB (Mongoose) in `replica-website/backend`.

The replica must keep the live site's **overall UI, common UI components, shared functionality and user workflows**. Small component adjustments are allowed only within the rules in [06 § 0](06-ui-design-and-components.md#0-replication-rules-what-must-match-and-what-may-change).

### About the organisation (from the site)

| Item | Value |
| --- | --- |
| Brand | **SANYOD** = *San*-Sankhya (सांख्य) · *Yo*-Yog (योग) · *D*-Darshan (दर्शन) |
| Guide / author | साधक जामवंत (Sadhaka Jamwant) |
| Location | Mapusa, Goa |
| Contact | 📞 8077641645 · ✉ sanyod@sanyod.in |
| Hours | Mon–Fri 09:00–19:00 · Sat 10:00–17:00 · Sunday closed |
| Audience | Hindi-speaking learners of Indian philosophy, yoga, spirituality and holistic health |

### What the site offers

1. **Books:** PDF and hard-copy books by the founder, sold via manual UPI payment.
2. **Video courses:** YouTube-based playlists with free and paid videos.
3. **Health consultations:** naturopathy/ayurveda/homeopathy doctors, online consultation requests.
4. **Programmes/events:** retreats, workshops, online classes with UPI booking.
5. **Personality Test:** Prakriti (Vata/Pitta/Kapha), Guna (Sattva/Rajas/Tamas) and a "Karma Situation" generator, in Hindi/English.
6. **Spiritual content:** Indian Knowledge, Spiritual Library, Community & Satsanga, Personal Guidance, About, Peace Building.
7. **Accounts and admin:** user registration/login, purchases library, admin approval of payments and content management.

Full list: [02-features.md](02-features.md).

---

## 2. Scope

### In scope (release 1)

| Area | Notes |
| --- | --- |
| All public pages and their behaviour | Pixel-close replication ([06](06-ui-design-and-components.md)) |
| User accounts | Register, login, logout, forgot/reset password (by email) |
| Books | Catalogue, details, PDF / hard-copy purchase with UPI proof, My Books, protected PDF reader, My Orders |
| Courses | Catalogue, details, playlist with free/locked videos, course purchase with UPI proof, My Courses |
| Health | Doctor directory, profiles, consultation requests, CV download |
| Programmes | Event listing by category, booking with UPI proof |
| Forms that do nothing today | Contact, newsletter, guidance request: saved and emailed to the admin |
| Admin panel | Approvals, orders, content CRUD, users, messages, settings |
| Migration | Data + files from MySQL/PHP, legacy URL redirects |
| Security fixes | See [12 § 9](12-migration-plan.md#9-security-fixes-built-into-the-rebuild) |

### Out of scope (unless decided otherwise in [14](14-open-questions-and-decisions.md))

- Payment gateway (Razorpay/Cashfree): release 1 keeps **manual UPI + admin approval**.
- Real library search across texts (keep the simulated search UI, or a simple site search).
- Mobile apps (the home page shows "56K+ App Downloads", but no app is part of this project).
- Rewriting content, redesigning pages, new languages.
- Template leftover pages (`blog`, `service`, `team`, `testimonial`) unless the owner keeps them.

---

## 3. Principles

| # | Principle |
| --- | --- |
| P1 | **Replicate, don't redesign:** same HTML structure, class names, CSS, texts and flows. |
| P2 | **Read-only references:** the live site and the PHP code are never changed. |
| P3 | **Everything in `replica-website/`:** code, assets, docs, scripts. |
| P4 | **TypeScript end to end** with shared types and zod schemas (`backend/src/shared`, imported by the frontend via `@shared/*`). |
| P5 | **Server is the source of truth:** prices, amounts, user identity and access rights are decided on the server, never taken from the form. |
| P6 | **Private by default:** paid PDFs, payment screenshots and CVs are never publicly addressable. |
| P7 | **Old links keep working:** every legacy `.php` URL 301-redirects to its new route. |
| P8 | **Docs first:** behaviour changes are documented and decided before they are coded. |

---

## 4. Technology stack (summary)

| Layer | Choice | Details |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router 6, TanStack Query, react-hook-form + zod, react-helmet-async, sweetalert2, Bootstrap 5.1.3 CSS + legacy theme CSS, Font Awesome 5.15.4 | [07](07-frontend-architecture.md) |
| Backend | Node 20 LTS, Express 4, TypeScript, Mongoose 8, zod, multer, bcrypt, express-session + connect-mongo, Nodemailer, helmet, express-rate-limit, pino | [08](08-backend-architecture.md) |
| Database | MongoDB 7 | [09](09-database-models.md) |
| Testing | Vitest, React Testing Library, Supertest, mongodb-memory-server, Playwright (E2E + visual comparison with live) | [07](07-frontend-architecture.md), [08](08-backend-architecture.md) |
| Hosting (proposal) | VPS with Nginx + Node (PM2/Docker) + Let's Encrypt; MongoDB Atlas or self-hosted | [12 § 11](12-migration-plan.md#11-deployment) |

---

## 5. Directory layout

```text
replica-website/
├─ README.md       # how to navigate the project
├─ docs/           # this specification (01–14)
├─ reference/      # read-only captures of the live site (HTML, 12 Oct 2026)
├─ frontend/       # React + TSX app (public site + /admin): structure in docs/07
└─ backend/        # Express + TS API, models, scripts: structure in docs/08
```

---

## 6. Glossary

| Term | Meaning |
| --- | --- |
| **Prakriti** | Body constitution in Ayurveda: **Vata**, **Pitta**, **Kapha** (Physical Test result) |
| **Guna** | Mental qualities: **Sattva**, **Rajas**, **Tamas** (Emotions Test result) |
| **Kundli / Karma Situation** | Birth-details-based reading in the Personality Test |
| **Satsang(a)** | Spiritual gathering; the Community page |
| **Subject** | The PHP code's name for a **course** (`subject_id`) |
| **Hard Book / hardbook** | Physical copy of a book (price + ₹200) |
| **UPI** | India's instant payment system; the site uses a static QR/UPI ID and manual verification |
| **Entitlement** | (new) A record granting a user access to a purchased PDF or course |
| **Legacy ID** | The numeric MySQL ID kept on migrated records for redirects (e.g. book 26, course 7, doctor 11) |
| **Live** | The production PHP site at sanyod.in |
| **Replica** | The new MERN application in `replica-website/` |
