# Roly Home Services

Marketing website for **Roly Home Services** — professional painting and property
improvements in Tucker, Atlanta, and surrounding areas.

## Stack

Static HTML / CSS / vanilla JS — no build step. Enhancements load from CDN and
degrade gracefully if unavailable:

- **GSAP 3.15** (ScrollTrigger, SplitText, Flip) — scroll animations, the
  cinematic process story, and the gallery filter
- **Lenis 1.3** — smooth scrolling
- `motion.js` — presentational motion layer · `app.js` — functional layer
  (menu, multi-step form, color lab) · `paint-reveal.js` — canvas before/after

## Deploy (Vercel)

Zero-config static deploy. Import the repo in Vercel and deploy — no framework,
no build command, output directory is the repo root. Pages are served at their
`.html` paths (e.g. `/contact.html`); `/` serves `index.html`.

## Pages

`index` · `services` · `painting` · `presale` · `renovations` · `partners` ·
`gallery` · `reviews` · `about` · `contact` · `vsl` · `community` · `privacy` ·
`terms`

## QA

`python verify_pages.py` runs the site integrity audit (links, SEO/OG,
structured data, motion stack, image hygiene, accessibility, conversion
elements).

## Visual Assets

`docs/visual-asset-system.md` and `docs/visual-asset-manifest.json` define the
premium-local-real image prompt system, target filenames, formats, and
replacement priorities. Use `python verify_pages.py --strict-visuals` once new
assets are generated to fail the build on repeated hero imagery or missing
target replacements.
