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
│   ├── optimize-images.mjs
│   └── validate-site.mjs
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
--newsprint-accent: #6b1111
```

## Conventions
- Keep custom CSS in `src/styles.css`, then run `npm run build:css`.
- Keep shared scripts in `assets/js/`; avoid inline event handlers.
- When adding or replacing images, run `npm run build:images` and use generated WebP `srcset` values.
- Keep event/contact/analytics constants mirrored in `src/site.config.json` when content changes.
- The untracked `portal/` folder is local-only until explicitly approved for release.
