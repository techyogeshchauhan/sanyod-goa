# Portal Security Findings and Fix Status

Audit date: 2026-11-21  
Scope: Backend authentication, admin authorization, password migration, request logging, and public registration.  
Method: Static source review. No live database, production logs, or deployed environment were accessed.

All four source-level findings have fixes in this checkout. The existing MongoDB records still need the one-time credential cleanup described under SEC-01.

## SEC-01: Legacy migration could store plaintext or weak password credentials

**Severity:** High  
**Status:** Code fixed; existing database cleanup pending

The MySQL importer previously placed unrecognized values directly in `legacyPasswordHash` and retained fast MD5/SHA-1 hashes. These values could be exposed by a database or backup leak.

**Fix:** `migrate-mysql.ts` now bcrypt-hashes plaintext values as they are imported. It does not import MD5 or SHA-1 as credentials, so those users must reset their passwords. Authentication accepts only bcrypt `passwordHash` values and no longer checks legacy fields. The legacy fields remain in the schema only so old records can be scrubbed. `remediate-legacy-passwords.ts` rehashes stored plaintext values, clears weak legacy hashes and all legacy credential fields, invalidates reset tokens issued before the URL change, and reports counts without printing secrets.

**Required deployment action:** Run from `backend` after deploying the code:

```powershell
npm run security:remediate-passwords
```

Accounts that only had an MD5 or SHA-1 credential will need to use password reset. Existing reset links will be invalidated; users can request a fresh link. This command was not run because no live database was accessed. Historical database backups are outside this script and must follow the organization's backup-retention process.

## SEC-02: Admin sessions could retain stale roles or remain active after account changes

**Severity:** High  
**Status:** Fixed in source

An admin session previously supplied its own role and active state. Password changes, demotions, and deactivation did not invalidate stored sessions.

**Fix:** `requireAdmin` now reloads the admin record on each protected admin request, rejects and destroys sessions for missing or inactive admins, and refreshes the session role from the current database record. The admin `/me` endpoint also returns current database state and clears inactive sessions. Password, role, and active-state changes revoke that admin's other sessions. A self-service password change preserves only the current session.

## SEC-03: Reset tokens and email contents could be written to logs

**Severity:** High when application logs are accessible  
**Status:** Fixed in source

Reset links previously put the token in a query string. Request logging could capture URLs, and the no-SMTP fallback logged complete email contents, including active reset links.

**Fix:** New reset links carry the token in the URL fragment, which is not sent in HTTP requests. The reset-token validation API accepts the token in a POST body. The frontend removes the fragment from browser history after reading it. Request URL and token fields are redacted, error logging records only the request path, and mailer logs omit recipients and message contents. In production, missing SMTP configuration now causes a generic failure log and does not retain the message in the development outbox.

## SEC-04: Public registration could reveal whether an email was registered

**Severity:** Low  
**Status:** Fixed in source

Registration previously returned a distinct conflict response for an existing email, allowing unauthenticated account enumeration.

**Fix:** Registration now returns the same generic response for new and existing addresses, hashes the submitted password before attempting creation, and handles only duplicate-email errors as the generic outcome. Registration no longer creates a session; the frontend shows the same sign-in/reset next step for either case.

## Validation and remaining limits

- Backend and frontend TypeScript typechecks passed; tests were not run.
- No live MongoDB remediation, production log review, browser attack flow, or deployment verification was performed.
- Older reset links that put tokens in query strings are no longer accepted by the frontend. Request a fresh reset link if one of those links is still needed.
