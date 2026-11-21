# Portal Functionality Bugs: Findings and Resolutions

Audit date: 2026-11-21  
Scope: Public catalog, purchase, consultation, site settings, and admin catalog flows.  
Review method: Static source review followed by backend and frontend TypeScript checks. No live portal or browser workflow was exercised.

## Findings

### 1. Course checkout offered payment methods it could not process

**Severity:** P2  
**Status:** Fixed

The course checkout showed card, net banking, and wallet alongside UPI, although every option used the same manual UPI transfer, transaction ID, and screenshot flow. Checkout now offers UPI only, and the API accepts only `upi` for new payment submissions.

### 2. Hard-copy-only books could not be purchased

**Severity:** P2  
**Status:** Fixed

Book availability now reflects either configured, available format. A hard-copy order no longer depends on the PDF price or PDF availability. Hard-copy prices are explicit catalog values; admin and migration code no longer infer them by adding a fixed surcharge to the PDF price.

### 3. The book page allowed hard-copy reorders after delivery that the API rejected

**Severity:** P2  
**Status:** Fixed

The book page now blocks hard-copy purchases for any pending or approved order, including delivered orders, matching the API rule that an approved order prevents a repeat purchase.

### 4. Concurrent submissions could create duplicate pending purchases

**Severity:** P2  
**Status:** Fixed in code

Payments now carry a unique sparse key for the active user/item/purchase-type combination. The database constraint arbitrates concurrent submissions, and a duplicate-key result is returned as a purchase conflict. The existing lookup also continues to catch pending or approved legacy payments that predate the key.

### 5. Consultation date validation used the wrong calendar day near midnight in India

**Severity:** P3  
**Status:** Fixed

The browser and API now calculate the minimum appointment date using the Asia/Kolkata calendar day, including between local midnight and 05:30.

### 6. Spiritual Library search and discovery controls were inert

**Severity:** P2  
**Status:** Fixed

Book search, category, language, and featured filters now query the catalog API. Category and language choices come from published database records. Random book selection opens a book from that catalog, and featured discovery filters to books marked featured in admin.

## Operational and catalog data

Public contact details, address, opening hours, social links, UPI IDs, QR images, and the admin notification recipient now come from the database-backed Settings record and admin Settings page. Blank admin notification email disables those notifications; missing payment setup disables checkout instead of displaying a baked-in recipient.

Book author, category, language, featured state, and prices are catalog fields. Course discount, level, and certificate availability no longer receive invented promotional/catalog defaults. Doctor availability and verification no longer default to “Available Today” or verified in new admin records or migration output. Authored page copy and brand presentation remain in the frontend.

The JSON seed files remain optional bootstrap data for initializing an empty database. Public pages read catalog data through the API; seed records are not embedded in those page components. Existing values already saved in MongoDB are preserved. A new database must have its payment and contact settings configured in the admin panel before those features can be used.

## Verification

- Backend `npm run typecheck`: passed.
- Frontend `npm run typecheck`: passed.
- Automated tests and live/browser workflows were not run.
