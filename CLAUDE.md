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
npm run build        # compile CSS and regenerate optimized image variants
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
- Keep custom CSS in `src/styles.css`, then run `npm run build:css`.
- Keep shared scripts in `assets/js/`; avoid inline event handlers.
- When adding or replacing images, run `npm run build:images` and use generated WebP `srcset` values.
- Keep event/contact/analytics constants mirrored in `src/site.config.json` when content changes.
- The untracked `portal/` folder is local-only until explicitly approved for release.
- `_headers` sets a strict CSP (`style-src 'self'`): no inline `style=""` attributes or `<style>` blocks; put CSS in `src/styles.css`.
- `dinner.jpg` and `group-pic.jpg` carry a watermark: they are git-ignored and must never be used on the site or as share images. Use `share-card.jpg` for og/twitter/JSON-LD images and `logo-final.png` / `logo-mark-512.png` for logos.
- Use `logo-mark.svg` (not `logo-final.png`) anywhere the logo is shown smaller than ~150px; the full logo's tagline is unreadable at that size.
- After changing source artwork for the share card or crops, run `node scripts/build-brand-assets.mjs`, then `npm run build:images`.
- Bookings are private groups only: minimum 10 guests, ₹1,500 per person, food and drinks not included, at our place or the customer's venue. Keep `MIN_GUESTS` / `PRICE_PER_PERSON` in `assets/js/index.js` and `src/site.config.json` in step with the copy.
- Form submissions go to a Google Apps Script web app that writes to the "LNI Signup" Google Sheet. `scripts/apps-script/forms.gs` mirrors its code; after editing, paste it into the Apps Script project and use Deploy → Manage deployments → edit → New version so the /exec URL in `assets/js/index.js` stays the same.
- Keep this file up to date: at the end of each working day with changes, add a dated entry to the change log below and update any section above that changed.

## Git & GitHub
- Repo: `cashmani-cpu/letsnailit-website` (remote `origin`, HTTPS). `main` is the live branch.
- This Mac is signed in to the GitHub CLI as `cashmani-cpu`; the token lives in the macOS keychain and git uses it through `gh auth git-credential`, so `git push` and `gh pr create` need no login. Run `gh auth status` to check; never copy the token into files.
- Before starting work or opening a PR, run `git fetch` and branch from `origin/main` (not a stale local `main`).

## Change Log
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
