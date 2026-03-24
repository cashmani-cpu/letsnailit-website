# Just Nail It - Project Context

## Project Overview
**Let's Nail It** is a Murder Mystery Supper Club based in Bangalore. Live at https://www.letsnailit.com. This is a single-file static website (`index.html`) with no build system or dependencies.

## File Structure
```
JNI/
└── index.html   # Entire site: HTML + CSS + JS in one file
```

## Tech Stack
- Pure HTML/CSS/JavaScript — no frameworks, no build tools
- Google Fonts: Playfair Display, Oswald, Lato
- Font Awesome 6.5.1 (CDN)
- No npm, no package.json, no bundler

## Design System (CSS Variables)
```css
--blood: #8B0000          /* Deep crimson — primary brand */
--blood-bright: #C41E3A   /* Bright red — hover/accent */
--gold: #C9A84C           /* Gold — secondary brand */
--gold-light: #D4B96A
--gold-dim: #8B7332
--cream: #F5F0E8          /* Light text */
--noir: #0D0D0D           /* Page background */
--noir-mid: #161616
--noir-card: #1C1C1C      /* Card backgrounds */
--noir-light: #2A2A2A
--noir-border: #333
--smoke: #666
--fog: #999
--mist: #BBB
```

## Conventions
- All styles are in the `<style>` block in `<head>` — no external CSS files
- All scripts are inline `<script>` at end of `<body>`
- Max content width: `1200px` via `.container`
- Mobile-first responsive design with `flex-wrap` and media queries

## Important Notes
- This is a **single HTML file** — keep everything self-contained
- No build step needed; open directly in a browser to preview
- Use the existing CSS variable names when adding new styles
- Maintain the noir/murder-mystery aesthetic: dark backgrounds, blood red + gold accents, serif headings (Playfair Display), sans-serif body (Lato/Oswald)

## Known Fixes — Do Not Revert

### Hero image on mobile (`@media (max-width: 600px)`)
**NEVER use `background-size: cover` for `.hero` on mobile.** `cover` zooms a landscape photo ~2.8× on a portrait container, making people look distorted. The correct value is `100% auto`:
```css
.hero {
  min-height: 0;
  background:
    linear-gradient(180deg, rgba(13,13,13,0.65) 0%, rgba(13,13,13,0.82) 50%, rgba(13,13,13,1) 100%),
    url('dinner.jpg') center top / 100% auto no-repeat !important;
}
```
The gradient fades to noir at the bottom so there is no visible gap below the image. This was confirmed working on device (commit `59bc42f`).
