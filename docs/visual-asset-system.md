# Roly Home Services Visual Asset System

This file is the human brief for the image system. The machine-readable source
of truth is `docs/visual-asset-manifest.json`.

## Goal

Move the site from repeated square stock-like images to a premium local real
visual library. Every image should feel specific to Roly Home Services: clean
prep, protected homes, precise painting, trustworthy communication, and homes
that look believable for Tucker and Atlanta.

## Global Rules

- Keep Roly brand text in HTML/design, not inside generated images.
- Avoid readable text, fake logos, product labels, or invented company names.
- Avoid generic handshake shots, luxury mansions, exaggerated HDR, cartoon
  style, unsafe work positions, and messy job sites.
- Use warm natural light, clean tools, protected furniture, precise trim lines,
  and practical homes that feel local.
- Prefer real photography for owner portraits, completed jobs, testimonials,
  and case studies whenever available.

Negative prompt:

```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

## Formats

| Format | Size | Use |
| --- | --- | --- |
| Hero wide | 2400x1350 | Home, Services, Painting, Presale, Partners, Renovations, VSL |
| Card | 1600x1200 | Service cards, gallery cards, case studies |
| Square detail | 1536x1536 | Technical details and legacy square slots |
| Story/process | 1920x1080 | Scrollytelling and VSL backgrounds |
| Social/OG | 1200x630 | Social share cards |
| Social vertical | 1080x1920 | Reels, stories, vertical ads |

## Priority Generation Queue

1. `hero-home-value.webp` for `index.html`.
2. `hero-services-system.webp` for `services.html`.
3. `hero-painting-prep.webp` for `painting.html` and `lp-painting.html`.
4. `hero-presale-punchlist.webp` for `presale.html`.
5. `hero-partners-realtor.webp` for `partners.html`.
6. `hero-renovations-refresh.webp` for `renovations.html`.
7. `vsl-thumbnail-cabinet-finish.webp` for `vsl.html`.

Do not update HTML references until each target asset exists and has been
optimized. When replacing, update `width`, `height`, preload links, and alt text.

## Prompt Library

### Home Hero

```text
Photorealistic wide 16:9 exterior of a freshly painted Atlanta craftsman home, deep navy siding, cream trim, warm orange front door, clean landscaping, morning light, premium but believable neighborhood, space for website copy, no text, no logos.
```

```text
Professional painter respectfully walking a homeowner through an exterior finish inspection on a clean front porch, Atlanta craftsman home, color swatches and clipboard, warm trust-building documentary photography, no visible brand text.
```

### Services, Painting, LP Painting

```text
Clean interior painting preparation in a bright living room, furniture fully protected, drop cloths, blue painter tape, painter masking trim with precision, warm daylight, premium local service photography.
```

```text
Exterior painting prep on a Southern home, siding being washed and scraped before paint, controlled water spray, safe equipment, crisp composition, communicates durability and care.
```

```text
Factory-grade cabinet painting scene, cabinet doors on racks inside a clean spray booth, painter in protective suit, glossy smooth white finish, technical precision, no readable labels.
```

### Color Science Lab

```text
Same Atlanta craftsman house front elevation, navy siding with warm cream trim, realistic landscaping, consistent camera angle, clean daylight, designed for color comparison UI.
```

```text
Same house and camera angle, organic sage siding, charcoal trim, black windows, premium curb appeal, realistic shadows, no people, no text.
```

```text
Same house and camera angle, warm white exterior, bronze accents, dark roof, refined real estate curb appeal, photorealistic.
```

### Presale And Partners

```text
Realtor, homeowner, and painting contractor reviewing a pre-listing punch list on a kitchen island, bright staged home, color samples, minor touch-up tools, calm professional collaboration, no handshake cliche.
```

```text
Market-ready living room after targeted painting and trim refresh, neutral walls, clean baseboards, staged but lived-in warmth, real estate listing photography quality.
```

### Renovations

```text
High-impact bathroom refresh in progress, vanity protected, trim painting, clean tools, drywall patch ready for paint, small renovation not full remodel, premium home improvement realism.
```

```text
Close detail of smooth drywall repair after sanding, vacuum sanding tool nearby, clean wall surface ready for primer, technical craftsmanship macro shot.
```

### Gallery And Case Studies

```text
Before-and-after style exterior painting project, split composition implied by matching angles, one side weathered siding, one side finished deep navy paint, realistic local home, no text overlay.
```

```text
Interior trim and wall finish close-up, crisp cut line, smooth satin sheen, sunlight across baseboard, communicates precision and cleanliness.
```

### About And Trust

```text
Authentic local painting business owner portrait in a finished kitchen, navy polo with no logo, warm approachable expression, shallow depth of field, no text, no fake company name.
```

### Community

```text
Local school community mural painting day, families and volunteers painting abstract colorful wall shapes, joyful but realistic, no readable words, no school names, clean safe setup.
```

### VSL

```text
Cinematic 16:9 thumbnail still for a home painting explainer video, painter showing a smooth cabinet finish sample to homeowner, warm indoor light, clean premium composition, dark navy negative space for play button overlay, no text.
```

## Contextual Backgrounds & Card Compositions

These prompts fill the sections that currently feel text-heavy or generic:
pathway cards, process cards, trust/proof bands, contact/about heroes, and
section panels. The goal is not to add a photo everywhere. Each image must help
the visitor understand a decision, proof point, or transformation faster.

Future folder:

```text
assets/contextual/{slot-id}.webp
```

Composition protocol:

1. Choose the slot from `contextual_background_slots` in the manifest.
2. Generate at the slot format size: `2400x1350` for heroes/bands,
   `1600x1200` for cards, `1920x1080` for process/VSL, and `1600x900` for
   subtle textures.
3. Keep a clear safe area for the existing HTML text and overlay. For cards,
   keep visual action on one side or in the lower third.
4. Use real residential scale, warm daylight, clean tools, protected surfaces,
   and Tucker/Atlanta believability.
5. Do not put Roly branding, badges, fake paperwork text, readable labels, or
   signs inside the image.
6. If the image communicates content, integrate it later as an `<img>` with
   width, height, alt text, and lazy loading. If it is atmospheric support, use
   a CSS background with a gradient overlay and real HTML text.
7. Do not reference these target files in HTML until the generated files exist
   and pass mobile/desktop crop QA.

Priority 1 contextual slots:

| Target asset | Page | Prompt |
| --- | --- | --- |
| `assets/contextual/home-avatar-sell-card.webp` | Home pathway card | Photorealistic 4:3 card background, staged Tucker/Atlanta living room prepared for pre-sale touch-ups, neutral walls, clean baseboards, small protected repair area, paint tray and swatches, warm natural light, space for overlay text, no readable text, no logos. |
| `assets/contextual/home-avatar-new-buyer-card.webp` | Home pathway card | Bright unfurnished Atlanta living room before move-in, protected floors, fresh paint samples, roller tray, a few moving boxes softly out of focus, optimistic new-home feeling, premium local realism, no text, no logos. |
| `assets/contextual/home-avatar-partner-card.webp` | Home pathway card | Realtor and painting contractor reviewing a blank clipboard in a staged home, calm professional collaboration, no handshake cliche, warm daylight, shallow depth of field, no readable text, no brand marks. |
| `assets/contextual/services-route-presale-card.webp` | Services route card | Pre-listing home prep scene on a kitchen island, blank punch list, color samples, minor touch-up tools, clean staged interior, real estate ready, no readable text. |
| `assets/contextual/services-route-renovations-card.webp` | Services route card | Small home refresh in progress, protected vanity and trim painting, drywall patch ready for primer, clean tools, premium but believable residential renovation, no text. |
| `assets/contextual/services-route-partners-card.webp` | Services route card | Real estate partner walkthrough in a bright finished home, contractor pointing toward trim detail, professional trust, no documents with readable text, no logos. |
| `assets/contextual/presale-checklist-section.webp` | Presale checklist section | Wide 16:9 pre-sale punch list scene, homeowner, realtor, and contractor around a kitchen island, blank papers, paint swatches, clean staged home, negative space for website copy, no readable text. |
| `assets/contextual/painting-process-prep-card.webp` | Painting process card | Interior painting prep close-up, furniture fully protected, crisp painter tape on trim, drop cloths, clean professional workflow, warm window light, no labels. |
| `assets/contextual/painting-process-application-card.webp` | Painting process card | Painter applying smooth wall finish with roller in a protected living room, controlled posture, clean edges, premium local service photography, no text/logos. |
| `assets/contextual/painting-process-walkthrough-card.webp` | Painting process card | Finished room walkthrough, contractor showing homeowner a crisp trim line and smooth wall finish, warm trust-building documentary style, no readable text. |
| `assets/contextual/about-hero-team.webp` | About hero | Authentic local painting team preparing a protected interior room, clean uniforms without logos, warm approachable energy, premium local business realism, wide composition, no text. |
| `assets/contextual/contact-hero-consultation.webp` | Contact hero | Warm consultation scene for home services estimate, phone, blank notebook, paint swatches, house exterior softly visible through window, clean negative space, no readable text. |
| `assets/contextual/vsl-thumbnail-premium.webp` | VSL thumbnail | Cinematic 16:9 video thumbnail still, painter showing smooth cabinet finish sample to homeowner, warm indoor light, dark navy negative space for play button overlay, no text. |

Priority 2 contextual slots:

| Target asset | Page | Prompt |
| --- | --- | --- |
| `assets/contextual/renovations-kitchen-card.webp` | Renovations card | Kitchen refresh detail, cabinets protected, trim and wall paint touch-ups, clean tools, not a full remodel, realistic Atlanta home, no text. |
| `assets/contextual/renovations-bathroom-card.webp` | Renovations card | Small bathroom refresh, vanity protected, fresh trim paint, repaired wall surface, clean bright finish, believable home improvement scene, no text. |
| `assets/contextual/renovations-drywall-card.webp` | Renovations card | Macro residential drywall repair, smooth patched wall, vacuum sanding tool nearby, surface ready for primer, technical craftsmanship, no labels. |
| `assets/contextual/renovations-deck-card.webp` | Renovations card | Backyard deck staining project, one clean protected work zone, warm wood tone, realistic suburban Atlanta yard, no text/logos. |
| `assets/contextual/reviews-proof-bg.webp` | Reviews proof band | Finished Atlanta living room after professional painting, homeowner and contractor doing final inspection, clean baseboards, warm natural light, authentic trust, no readable text. |
| `assets/contextual/community-hero-mural.webp` | Community hero | Local community mural painting day, families and volunteers painting abstract colorful wall shapes, safe clean setup, joyful realistic atmosphere, no words, no school names. |

## Before/After Animation Pairs

The before/after library is built for animation, not just gallery thumbnails.
Each pair must be generated as two separate files with a locked camera so the
site can later use sliders, wipes, crossfades, or scrollytelling transitions.

Folder and naming:

```text
assets/before-after/{pair-id}-before.webp
assets/before-after/{pair-id}-after.webp
```

Production protocol:

1. Generate the `before` image first at `1920x1080`.
2. Use the finished `before` image as the reference or edit target for the
   `after` image.
3. Preserve the same camera angle, focal length, wall/home geometry, windows,
   furniture, landscaping, shadows, and light direction.
4. Change only the surfaces Roly would actually improve: paint, trim, drywall
   repair, cabinet finish, washing, staining, or surface cleanliness.
5. Export both images separately as optimized WebP.
6. Do not connect the files in HTML until both sides of the pair exist and pass
   visual QA.

Base before prompt:

```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark.
```

Base after prompt:

```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos.
```

Canonical client pairs:

| Pair ID | Service | Intended use |
| --- | --- | --- |
| `exterior-siding-curb-appeal` | Exterior Painting | Home, Painting, Gallery hero proof |
| `exterior-curb-appeal-2` | Exterior Painting | Alternate warm-white exterior proof |
| `exterior-trim-front-door` | Exterior Painting | Close exterior detail slider |
| `interior-hallway-scuffs` | Interior Painting | Mobile story and scuff repair proof |
| `cabinet-kitchen-refresh` | Cabinet Painting | High-value kitchen conversion proof |
| `drywall-patch-repair` | Drywall Repair | Process education and repair trust |
| `soft-wash-siding` | Soft Full House Washing | Clean/dirty wipe |
| `deck-staining` | Deck Staining | Wood protection proof |
| `fence-staining` | Fence Staining | Exterior wood finish proof |
| `garage-door-trim` | Exterior Painting | Compact curb appeal proof |

Do not publish `interior-living-room-paint`, `bathroom-refresh`, or
`kitchen-presale-neutral` as separate before/after stories unless new
locked-camera source pairs are supplied. They previously reused pair 3 or pair
5 and made the site feel repetitive. Unused JPGs in `Roldan New Feedback/` are
reference screenshots only, not site visuals.

Animation QA:

- The `before` and `after` must align at rooflines, windows, baseboards,
  cabinet frames, railings, floor seams, and major furniture edges.
- The `after` should not add new rooms, luxury upgrades, staging objects, or
  structural changes unless the before already includes them.
- If a transition jitters, regenerate the `after` from the before image instead
  of generating a new standalone after scene.

## QA

Run:

```bash
python verify_pages.py
```

For launch readiness after the new assets are generated, run:

```bash
python verify_pages.py --strict-visuals
```

The strict mode turns missing target assets and repeated hero imagery into
failures so the visual refresh cannot ship half-finished.
