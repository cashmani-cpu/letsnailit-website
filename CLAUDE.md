# Let's Nail It - Project Context

## Project Overview
**Let's Nail It** is a murder mystery experience based in Bangalore. The live site is at https://www.letsnailit.com.

The public site is static HTML with a small local build step for production CSS and optimized images. Avoid reintroducing browser-time Tailwind CDN usage.

## File Structure
```
JNI/
├── index.html
├── blog/
│   ├── index.html
│   └── *.html
├── assets/
│   ├── css/site.css        # generated Tailwind output
│   ├── img/*.webp          # generated responsive image variants
│   └── js/*.js             # shared runtime scripts
├── src/
│   ├── styles.css          # Tailwind input + custom site CSS
│   └── site.config.json    # central reference for event/contact IDs
├── scripts/
│   ├── optimize-images.mjs     # skips .svg files
│   ├── build-brand-assets.mjs  # share card, logo-mark PNGs, safe image crops
│   ├── version-assets.mjs      # adds ?v=<hash> to assets/css + assets/js links in all HTML
│   └── validate-site.mjs
├── logo-mark.svg               # simplified logo (candle + ? + name) for small placements
├── logo-mark-180.png / -512.png
├── share-card.jpg              # 1200x630 social + search share image
├── mystery-props-evidence.jpg  # Fig. 2 crop (no "Blackwood" case file)
├── blog-mechanics-board.jpg    # blog card crop (no "Caucasian male, 1943" dossier)
├── tailwind.config.js
└── _headers                # Netlify cache/security headers
```

## Tech Stack
- Static HTML/CSS/JavaScript
- Tailwind CSS compiled locally with `npm run build:css`
- Responsive WebP image variants generated with `npm run build:images`
- Google Fonts: Playfair Display, Old Standard TT, UnifrakturMaguntia
- No Font Awesome CDN on the public pages; use text/icon glyphs via `.icon`

## Build Commands
```bash
npm run build        # compile CSS, regenerate optimized image variants, re-version asset links
npm run validate     # verify no Tailwind CDN/runtime CSS remains and JSON-LD parses
```

`node_modules/` and `.npm-cache/` are local-only and ignored by Git.

## Design System
```css
--newsprint-base: #d2c7b3
--newsprint-dark: #bdaf96
--newsprint-ink: #1c1b19
--newsprint-accent: #6b1111   /* oxblood */
--newsprint-muted: #5a5348    /* secondary text; Tailwind: text-newsprint-muted */
--paper-light: #f3ecdf        /* polaroid / photo mounts */
```

### Type and colour rules
- All-caps only for navigation, headlines and small tags. Subtitles, decks and captions are italic sentence case (`.section-deck`, `.byline`, `.kicker`).
- No light-grey text: use `text-newsprint-muted`, never `text-newsprint-ink/30–70`. Running text is 13px or larger.
- Oxblood is for one bold moment per screen: the main booking button (`.btn-primary`), one stamp (`.murder-stamp`, `.stamp-tag`). Secondary buttons use `.btn-secondary` (ink outline).
- Keep » arrows glued to their label with `&nbsp;»`.

### Front-page components (src/styles.css)
- `.hero-grid` (photo / cta / lede areas; CTA sits above the lede on desktop so headline + photo + button fit the first screen).
- `.photo-print` + `.halftone-dots` for sepia + halftone photos; `.murder-stamp` over the hero photo.
- `.telegram` (Exclusive Dispatch), `.evidence-strip` / `.polaroid` (taped evidence with plot tags), `.ticket` (sticky booking stub), `.suspect-row` / `.suspect-card`.
- Mobile (<768px): `.front-page` dissolves both columns (`display: contents`) and orders dispatch + evidence (`.m-order-2/3`) right after the opening story; evidence and suspects become swipe rows; classifieds show one notice with a `[data-toggle-notices]` button (wired in `assets/js/index.js`); page frame is a single thin border.
- Paper grain is a fixed `body::after` overlay; worn edges come from `.weathered`.
- `.wa-float` (all pages): floating WhatsApp seal, bottom-right, z-80 (below modals and the mobile menu).

## Conventions
- Keep custom CSS in `src/styles.css`, then run `npm run build:css` and `npm run build:version` (or just `npm run build`). `/assets/*` is cached for a year as immutable, so a CSS/JS change only reaches returning visitors once its `?v=` hash changes.
- Keep shared scripts in `assets/js/`; avoid inline event handlers.
- When adding or replacing images, run `npm run build:images` and use generated WebP `srcset` values.
- Keep event/contact/analytics constants mirrored in `src/site.config.json` when content changes.
- The untracked `portal/` folder is local-only until explicitly approved for release.
- `_headers` sets a strict CSP (`style-src 'self'`): no inline `style=""` attributes or `<style>` blocks; put CSS in `src/styles.css`.
- `dinner.jpg` and `group-pic.jpg` carry a watermark: they are git-ignored and must never be used on the site or as share images. Use `share-card.jpg` for og/twitter/JSON-LD images and `logo-final.png` / `logo-mark-512.png` for logos.
- Use `logo-mark.svg` (not `logo-final.png`) anywhere the logo is shown smaller than ~150px; the full logo's tagline is unreadable at that size.
- After changing source artwork for the share card or crops, run `node scripts/build-brand-assets.mjs`, then `npm run build:images`.
- Bookings are private groups only: minimum 10 guests, ₹1,500 per person, food and drinks not included, at our place or the customer's venue. Keep `MIN_GUESTS` / `PRICE_PER_PERSON` in `assets/js/index.js` and `src/site.config.json` in step with the copy.
- Forms and the Google Apps Script must change together — see **Forms ↔ Apps Script** below.
- Keep this file up to date: at the end of each working day with changes, add a dated entry to the change log below and update any section above that changed.

## Forms ↔ Apps Script (keep in sync)
**Rule: whenever a website form changes, the Google Apps Script must be changed to match, in the same piece of work.** A form change is not finished until the script is updated, redeployed and tested.

- Forms: `#bookModal` in `index.html` (`form_type=group_booking`) and the quote form in `corporate/index.html` (`form_type=corporate_event`). Both post every field as URL parameters to the Apps Script `/exec` URL in `assets/js/index.js` (`FORM_ENDPOINT`).
- The script writes to the "LNI Signup" Google Sheet. Both forms go to the **Group Bookings** tab; columns come from `getHeaders()` / `getRow()`.
- `scripts/apps-script/forms.gs` is the repo copy of the script (Sheet ID is a placeholder because the repo is public; the real ID is only in the Apps Script project).
- Counts as a form change: adding, removing or renaming a field (`name=`), a new or renamed `form_type`, new radio/select values, or a price change (`PRICE_PER_PERSON` is in both `assets/js/index.js` and the script).
- When one happens:
  1. Update `getHeaders()` and `getRow()` (and `getTabName()` for a new `form_type`) in `scripts/apps-script/forms.gs`.
  2. Paste it into the Apps Script project (script.google.com → the project whose code has `doGet` and `form_type`), keeping the real `SHEET_ID`, and save.
  3. Deploy → Manage deployments → edit the active deployment → Version: **New version** → Deploy. Never "New deployment": that creates a new URL and the site would stop saving bookings.
  4. Headers are only written when a tab is first created. If columns change, add the new header cells to the existing tab by hand, or rename the old tab so a fresh one is created.
  5. Test: send one booking marked "TEST — delete me", check the row in the sheet, then delete it.

## Git & GitHub
- Repo: `cashmani-cpu/letsnailit-website` (remote `origin`, HTTPS). `main` is the live branch.
- This Mac is signed in to the GitHub CLI as `cashmani-cpu`; the token lives in the macOS keychain and git uses it through `gh auth git-credential`, so `git push` and `gh pr create` need no login. Run `gh auth status` to check; never copy the token into files.
- Before starting work or opening a PR, run `git fetch` and branch from `origin/main` (not a stale local `main`).

## Change Log
### 2026-11-17 — Dispatch pop-ups above the nav (branch `claude/modal-above-nav`)
- The three Exclusive Dispatch article pop-ups (`#dispatch1–3`) were `z-50`, below the sticky nav (`z-[60]`), so the nav bar showed across the open article on desktop. Raised to `z-[90]`, same as `#bookModal`. Pop-ups must stay above the nav (60) and the WhatsApp seal (80).

### 2026-11-17 — Cache-busting for CSS/JS (branch `claude/asset-cache-busting`)
- `/assets/*` is served `immutable` for a year at fixed URLs, so returning visitors never got new CSS/JS. New `scripts/version-assets.mjs` (`npm run build:version`, now part of `npm run build`) tags every `assets/css` and `assets/js` link with `?v=<content hash>` on all pages.

### 2026-11-17 — Photo proportions on desktop (branch `claude/photo-proportions`)
- Fig. 1 (hero): from 1280px the photo stretches to the full height of the CTA + lede column (`.hero-grid__photo` flex, `.hero-photo-crop` fills, 5:4 floor), so there is no blank paper under it. 1024–1279px uses a fixed 4:5 portrait crop, because a stretched photo there becomes a thin strip.
- Fig. 2 (editor's desk): grid is now 2/3 text + 1/3 photo (max 260px); the editor's box stretches to the photo's height with its text centred, so its top and bottom rules line up with the photo.
- Fig. 2 `sizes` corrected to `260px` (was `220px`, so retina screens got the 480w file for a ~300px slot).
- Not done: at 1024–1279px the hero lede is still taller than the photo; the "Book your group »" label overflows its button at 1024px (already the case before this change).
- Merged to `main` (PR #6).

### 2026-11-17 — Group bookings only (branch `claude/trusting-goldberg-ndvoxz`)
- Booking model changed from single seats to private group bookings: minimum 10 guests, no maximum, ₹1,500 per person (food and drinks not included), same price at our place (Aga Abbas Ali Road) or the customer's venue anywhere in Bangalore.
- The three homepage modals (`partyModal`, `privateModal`, `notifyModal`) are replaced by one `bookModal` form: venue choice cards (`.venue-choice`), area field shown only for "your venue", guest count with a 10-minimum message and live ₹ estimate, preferred date, occasion. Sends `form_type=group_booking` with new fields `venue`, `area`, `occasion` to the same Apps Script endpoint.
- Removed the fake "sold out — 25 April" waitlist flow and the Notify Me modal/footer link from `assets/js/index.js` and the homepage.
- Corporate quote form shares the same logic via `data-group-booking` (venue choice, 10+ minimum); corporate copy, schema and sidebar now say 10+ guests, ₹1,500/person.
- Homepage copy, FAQ (visible + JSON-LD), meta/OG descriptions, ticket stub ("Admit ten or more"), nav ("Group Bookings", anchor `#groups`) and the stats strip ("10+ guests per group") updated; weekly Fri–Sun EventSeries schema removed (no public sessions).
- `/date-night/` retired: page deleted, 301 to `/` in new `_redirects`, removed from sitemap, Tailwind content and validate script. The date-night blog post stays but its CTAs now point to `/#groups` with a "double date — or a dozen" angle.
- Blog CTAs ("Reserve a Seat" → "Book Your Group") and prices updated; share card text now "PRIVATE MURDER MYSTERY · GROUPS OF 10+ · BANGALORE".
- Fixed the phone `pattern` on all forms (was an invalid regex in current browsers, so phone validation was silently skipped).
- Merged to `main` (PR #3) and live on letsnailit.com.
- Apps Script form endpoint updated (deployment version 5, same /exec URL): `group_booking` and `corporate_event` now go to a new **Group Bookings** tab (Timestamp, Name, Email, Phone, Source, Venue, Area, Guests, Estimate ₹, Preferred Date, Occasion). All user text is stored as plain text, so "+91…" phones no longer show #ERROR! and formula injection is blocked. Reference copy in `scripts/apps-script/forms.gs` (Sheet ID replaced by a placeholder; repo is public).
- Not done: `make_shotlist_video.py` (untracked) still says ₹999; the consent text still names Formspree although forms post to Google Apps Script; the old **Other** tab holds earlier corporate/notify-me entries, many of them bot spam.

### 2026-11-17 — Design review fixes (branch `claude/trusting-goldberg-ndvoxz`)
- Homepage hero: headline overlap fixed, masthead ~40% smaller, oxblood main CTA with "Fri–Sun · ₹999 · Aga Abbas Ali Road"; removed the top booking ribbon and hero fact strip (location/price line now only at the top CTA and the final ticket).
- Drop cap moved off the byline; Fig. 1 is now the inspector photo with a MURDER stamp; Fig. 2 uses the cropped props image with a matching caption.
- New simplified logo (`logo-mark.svg`) on the mobile masthead, desktop seal, footer, favicons and web manifest across all pages.
- New `share-card.jpg` replaces `dinner.jpg` for social/search; `dinner.jpg` and `group-pic.jpg` untracked and git-ignored.
- Blog: dossier image cropped to the evidence board; "Forthcoming" titles readable; `VOL. XLII · No. 12,804` fixed site-wide; publisher logo in JSON-LD now `logo-mark-512.png`.
- Sections restyled: Usual Suspects heading matches other sections; private-event cards equal height with aligned links (new birthday link opens the private-event form); Four Acts numerals above titles on mobile; Notify Me footer link matches the others.
- Texture: paper grain, worn edges, sepia/halftone photos, telegram dispatch, taped polaroid evidence, ticket-stub booking box (sticky on desktop).
- Merged main (new contact number +91 80734 26951 and the floating WhatsApp button, `.wa-float`). Review item 23 done: the button is now a small ink wax-seal (oxblood on hover) and phones get 4rem of bottom padding so it never covers text.
- Out of scope: photoshoot, regenerating AI images, real guest reviews.
