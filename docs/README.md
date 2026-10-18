# SANYOD Replica Website: Documentation

The complete specification for rebuilding **sanyod.in** (PHP + MySQL) as a **MERN + TypeScript/TSX** application in `replica-website/`. The new site must replicate the live website's overall UI, common components, shared functionality and user workflows.

| | |
| --- | --- |
| Status | **Phase 1 (foundation) implemented and tested**; Phase 2 (layout + public pages) next |
| Verified on | 12 October 2026 (live site + local PHP codebase) |
| Live reference | <http://sanyod.in/> (read-only) |
| PHP reference | `D:\sanyod.in` (read-only) |
| New code | `replica-website/frontend` (React + TSX) · `replica-website/backend` (Express + TS) |
| Supersedes | `../../documentation/` (first draft; kept unchanged for history) |

> **Ground rule:** never modify the PHP codebase or the live website. All work happens inside `replica-website/`.

---

## Reading order

| # | Document | Answers |
| --- | --- | --- |
| 01 | [Project overview](01-project-overview.md) | What we're building, scope, principles, tech stack, glossary |
| 02 | [Features](02-features.md) | Every feature/module, live status, priority, known defects |
| 03 | [User roles and permissions](03-user-roles-and-permissions.md) | Visitor / User / Admin, permission matrix, route access |
| 04 | [Workflows](04-workflows.md) | Site map, access rules, end-to-end flows, business rules, statuses |
| 05 | [Authentication](05-authentication.md) | Register, login, sessions, password reset, admin auth, guards, security |
| 06 | [UI design and components](06-ui-design-and-components.md) | Replication rules, design tokens, layout, component inventory, page specs |
| 07 | [Frontend architecture](07-frontend-architecture.md) | React/TSX project structure, routing, state, CSS pipeline, conventions |
| 08 | [Backend architecture](08-backend-architecture.md) | Express/TS layers, middleware, services, storage, email, config |
| 09 | [Database models](09-database-models.md) | Current MySQL schema (reconstructed), MongoDB models, relationships, seed data |
| 10 | [API specification](10-api-specification.md) | REST endpoints, payloads, auth levels, errors |
| 11 | [Third-party integrations](11-third-party-integrations.md) | Current libraries/services, MERN replacements, version pins |
| 12 | [Migration plan](12-migration-plan.md) | PHP→MERN mapping, URL redirects, UI parity method, data/file migration, phases |
| 13 | [Verification report](13-verification-report.md) | How each fact was checked, results, corrections, coverage gaps |
| 14 | [Open questions and decisions](14-open-questions-and-decisions.md) | Blockers, owner decisions, decisions log |

Supporting material: [`../reference/`](../reference/README.md) (captured live HTML), [`../frontend/README.md`](../frontend/README.md), [`../backend/README.md`](../backend/README.md).

---

## Confidence legend used throughout

| Mark | Meaning |
| --- | --- |
| ✅ **Live** | Seen on the live site (12 Oct 2026) |
| 📄 **Code** | Read in the local PHP code |
| 🔎 **Inferred** | Strongly implied by code or saved output, not directly seen |
| ❓ **Unknown** | Behind a login or in the admin panel, or source missing. **Confirm before building that part** ([14](14-open-questions-and-decisions.md)). |

---

## Documentation status

| Area | Coverage | Notes |
| --- | --- | --- |
| Public pages (UI + behaviour) | ✅ Complete | Live captured; local files match live (see [13](13-verification-report.md)) |
| Logged-in user pages | ⚠ Partial | Live redirects to login; documented from local saved copies; some are placeholders |
| Admin panel | ⚠ Inferred | Only the admin login page is visible; features derived from the user flows |
| Database | ⚠ Reconstructed | From SQL in the code and page output; no dump available |
| Integrations, auth, API, architecture | ✅ Complete | Target design; implementation-ready |

Development can start with the parts marked ✅ (foundation, layout, public pages). The ⚠ parts need the inputs listed in [14](14-open-questions-and-decisions.md) first.

---

## Updating these docs

- Change docs **before** changing code when behaviour or UI differs from what is written here.
- Record every decision in [14 § Decisions log](14-open-questions-and-decisions.md#3-decisions-log).
- Keep the confidence marks accurate: upgrade 🔎/❓ to ✅ when verified.
