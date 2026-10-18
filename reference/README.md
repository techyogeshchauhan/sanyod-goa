# Reference Captures (read-only)

Raw HTML of the **live** sanyod.in pages, captured on **12 October 2026** as a logged-out visitor (`curl`, rate-limited). These files are the UI reference for converting pages to TSX ([docs/06](../docs/06-ui-design-and-components.md), [docs/12 § 5](../docs/12-migration-plan.md#5-keeping-the-ui-identical)).

**Do not edit these files.** If the live site changes, add a new dated capture folder instead.

| File | Live URL | Notes |
| --- | --- | --- |
| `index.html` | `/index.php` | Home |
| `Personality_Test.html` | `/Personality_Test.php` | Quiz data embedded in the script |
| `books.html` | `/books.php` | |
| `courses.html` | `/courses.php` | |
| `course_details__subject_id_7.html` | `/course_details.php?subject_id=7` | Emotional Command |
| `health.html` | `/health.php` | |
| `ind_know.html`, `lab.html`, `counity.html`, `presonal.html` | Spirituality pages | |
| `about.html`, `contact.html`, `Peace_Building.html` | | `contact.php` needed the host's bot-check cookie |
| `blog.html`, `service.html`, `team.html`, `testimonial.html` | | Car-rental template leftovers |
| `login.html`, `register.html`, `forget.html`, `reset_password.html` | Auth pages | Reset page in its "invalid link" state |
| `my_courses.html` | `/my_courses.php` | Logged-out output = header + PHP warning (broken page) |
| `admin_login.html` | `/admin/login.php` | Admin login (SB Admin 2) |

Not included:

- Login-only pages (redirect to login). Use the local PHP saved copies in `D:\sanyod.in` instead; see [docs/13 § 2](../docs/13-verification-report.md#2-page-level-results-logged-out).
- `get_videos.php` output, because it contains paid video links.

## Viewing

Asset paths in these files are relative (`css/style.css`, `images/…`). To view a capture with its styles, open the live URL. Or serve a copy with `<base href="https://sanyod.in/">` added to `<head>` (never modify the originals).

For automated visual comparison, Playwright should screenshot the **live URL** and the replica route ([docs/07 § 12](../docs/07-frontend-architecture.md#12-testing)).
