# SANYOD Replica Website (MERN + TypeScript/TSX)

A rebuild of **sanyod.in** (Sankhya Yog Darshan), currently PHP + MySQL, on **MongoDB · Express · React (TSX) · Node.js**. It keeps the live site's functionality, content and user workflows, with a new visual design ([D-27](docs/14-open-questions-and-decisions.md#3-decisions-log); the UI is no longer an exact replica).

> **Status (19 Oct 2026): phases 1–6 built.** Every page of the PHP site is rebuilt (public site, books, courses, health, programmes, personality test, user library) with a working API, UPI payment flow, file uploads, emails and a full admin panel. Phase 7 (data migration + launch) is ready to run once the database export and server files arrive: see [backend/README.md](backend/README.md#migrating-the-live-data) and the open items in [docs/14](docs/14-open-questions-and-decisions.md).

## Run locally

```bash
cd backend && npm install && cp .env.example .env   # set SESSION_SECRET; needs MongoDB on 127.0.0.1:27017
npm run seed                                          # books, courses + videos, doctors, events, settings
npm run create-admin -- --username admin --password "a-strong-password" --role superadmin
npm run dev                                           # API → http://localhost:4000
cd ../frontend && npm install && npm run dev         # site → http://localhost:5173, admin → /admin
```

## Ground rules

1. The **live website** (<http://sanyod.in/>) and the **PHP codebase** (`D:\sanyod.in`, everything outside this folder) are **read-only references**. Never modify them.
2. All new code, assets, scripts and docs live **inside `replica-website/`**.
3. Docs come first: if behaviour or UI must differ from the docs, update the docs and the decisions log ([docs/14](docs/14-open-questions-and-decisions.md)) before coding.

## Structure

```text
replica-website/
├─ README.md        # this file
├─ docs/            # full specification (start with docs/README.md)
├─ reference/       # read-only HTML captures of the live site (12 Oct 2026)
├─ frontend/        # React 18 + TSX app (public site + /admin): see frontend/README.md
└─ backend/         # Node 20 + Express + TypeScript API + MongoDB: see backend/README.md
```

## Documentation map

| Topic | Document |
| --- | --- |
| Overview, scope, stack, glossary | [docs/01](docs/01-project-overview.md) |
| Features | [docs/02](docs/02-features.md) |
| User roles and permissions | [docs/03](docs/03-user-roles-and-permissions.md) |
| Workflows | [docs/04](docs/04-workflows.md) |
| Authentication | [docs/05](docs/05-authentication.md) |
| UI design system, components, page specs | [docs/06](docs/06-ui-design-and-components.md) |
| Frontend architecture | [docs/07](docs/07-frontend-architecture.md) |
| Backend architecture | [docs/08](docs/08-backend-architecture.md) |
| Database models and schema | [docs/09](docs/09-database-models.md) |
| API specification | [docs/10](docs/10-api-specification.md) |
| Third-party integrations | [docs/11](docs/11-third-party-integrations.md) |
| PHP → MERN migration plan | [docs/12](docs/12-migration-plan.md) |
| Verification report | [docs/13](docs/13-verification-report.md) |
| Open questions and decisions | [docs/14](docs/14-open-questions-and-decisions.md) |

## Next steps

1. Phase 2: home, spirituality pages, about, contact, peace building, Personality Test (static content, visual parity checks).
2. Resolve blockers B1–B5 and questions in docs/14 (needed from Phase 3).
