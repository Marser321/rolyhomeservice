# Roly Home Services Image Generation Prompts

Use this file as the copy/paste prompt sheet for generating the next visual library.
The machine-readable source remains `docs/visual-asset-manifest.json`.

For image-to-video prompts and motion briefs, use `docs/animation-generation-prompts.md`.

## Global Negative Prompt

```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

## Format Guide

- `hero_wide`: 2400x1350 - Top-of-page hero panes and wide conversion backgrounds
- `card`: 1600x1200 - Service cards, gallery cards, and case-study previews
- `square_detail`: 1536x1536 - Technical details and legacy square slots only
- `story_process`: 1920x1080 - Scrollytelling, VSL stills, and process backgrounds
- `social_og`: 1200x630 - OpenGraph and Twitter preview cards
- `social_vertical`: 1080x1920 - Story ads, reels, and vertical VSL cuts
- `subtle_texture`: 1600x900 - Soft CTA and form-section backgrounds where a full photo would distract

## Priority Hero And VSL Prompts

### hero-home-value.webp

- ID: `home_hero_value`
- Pages: index.html
- Format: `hero_wide`

Prompt:
```text
Photorealistic wide 16:9 exterior of a freshly painted Atlanta craftsman home, deep navy siding, cream trim, warm orange front door, clean landscaping, morning light, premium but believable neighborhood, space for website copy, no text, no logos.
```
Alternatives:
1.
```text
Professional painter respectfully walking a homeowner through an exterior finish inspection on a clean front porch, Atlanta craftsman home, color swatches and clipboard, warm trust-building documentary photography, no visible brand text.
```
2.
```text
Wide editorial photo of a clean Atlanta family home after exterior painting, protected porch furniture restored in place, crisp trim, warm morning shadows, premium local service realism, no text.
```

### hero-services-system.webp

- ID: `services_hero_system`
- Pages: services.html
- Format: `hero_wide`

Prompt:
```text
Clean interior painting preparation in a bright living room, furniture fully protected, drop cloths, blue painter tape, painter masking trim with precision, warm daylight, premium local service photography.
```
Alternatives:
1.
```text
Wide photo of a professional painting crew preparing an Atlanta home interior, labeled-free tools arranged neatly, floors fully covered, homeowner observing confidently from a safe distance, warm natural light.
```
2.
```text
Premium local home service scene showing paint samples, protected furniture, drywall touch-up tools, and a clean project checklist on a kitchen island, no readable text.
```

### hero-painting-prep.webp

- ID: `painting_hero_prep`
- Pages: painting.html, lp-painting.html
- Format: `hero_wide`

Prompt:
```text
Clean interior painting preparation in a bright living room, furniture fully protected, drop cloths, blue painter tape, painter masking trim with precision, warm daylight, premium local service photography.
```
Alternatives:
1.
```text
Exterior painting prep on a Southern home, siding being washed and scraped before paint, controlled water spray, safe equipment, crisp composition, communicates durability and care.
```
2.
```text
Painter applying a clean finish coat near a window with protected flooring, crisp cut line, warm sunlight, premium residential painting realism, no text or logos.
```

### hero-presale-punchlist.webp

- ID: `presale_hero_punchlist`
- Pages: presale.html
- Format: `hero_wide`

Prompt:
```text
Realtor, homeowner, and painting contractor reviewing a pre-listing punch list on a kitchen island, bright staged home, color samples, minor touch-up tools, calm professional collaboration, no handshake cliche.
```
Alternatives:
1.
```text
Market-ready living room after targeted painting and trim refresh, neutral walls, clean baseboards, staged but lived-in warmth, real estate listing photography quality.
```
2.
```text
Close view of pre-sale home preparation materials: neutral paint swatches, clean trim, patched wall, staging notes without readable text, bright Atlanta home.
```

### hero-partners-realtor.webp

- ID: `partners_hero_realtor`
- Pages: partners.html
- Format: `hero_wide`

Prompt:
```text
Realtor and painting contractor reviewing neutral paint options inside a bright staged Atlanta living room, clipboard with no readable text, calm professional collaboration, color samples, clean tools, premium local realism, no handshake cliche.
```
Alternatives:
1.
```text
Wide real estate preparation scene with a contractor pointing out trim touch-ups to a realtor and homeowner, finished living room, warm daylight, no visible brand text.
```
2.
```text
Premium but realistic pre-listing consultation in an Atlanta kitchen, paint fan deck, small repair tools, realtor folder without readable text, professional calm tone.
```

### hero-renovations-refresh.webp

- ID: `renovations_hero_refresh`
- Pages: renovations.html
- Format: `hero_wide`

Prompt:
```text
High-impact bathroom refresh in progress, vanity protected, trim painting, clean tools, drywall patch ready for paint, small renovation not full remodel, premium home improvement realism.
```
Alternatives:
1.
```text
Close detail of smooth drywall repair after sanding, vacuum sanding tool nearby, clean wall surface ready for primer, technical craftsmanship macro shot.
```
2.
```text
Bright hallway refresh with patched drywall, clean baseboards, protected floors, paint tray and precision brush, local home improvement professionalism.
```

### vsl-thumbnail-cabinet-finish.webp

- ID: `vsl_thumbnail`
- Pages: vsl.html
- Format: `story_process`

Prompt:
```text
Cinematic 16:9 thumbnail still for a home painting explainer video, painter showing a smooth cabinet finish sample to homeowner, warm indoor light, clean premium composition, dark navy negative space for play button overlay, no text.
```
Alternatives:
1.
```text
Cinematic wide still of a contractor presenting paint samples beside a protected living room, dark navy negative space on one side for video UI overlay, warm trustworthy lighting, no text.
```
2.
```text
Close cinematic shot of a smooth painted cabinet door sample being reviewed by a homeowner and contractor, clean kitchen background, premium but believable, no logos.
```

## Contextual Background And Card Prompts

### assets/contextual/home-avatar-sell-card.webp

- ID: `home-avatar-sell`
- Page: `index.html`
- Section: How Can We Help You Today?
- Component: `card_background`
- Format: `card`
- Priority: P1
- Placement notes: Background for the Preparing to Sell pathway card. Keep the strongest visual detail to the right/lower third and leave a calm overlay-safe area for card copy.

Prompt:
```text
Photorealistic 4:3 card background, staged Tucker/Atlanta living room prepared for pre-sale touch-ups, neutral walls, clean baseboards, small protected repair area, paint tray and swatches, warm natural light, space for overlay text, no readable text, no logos.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/home-avatar-new-buyer-card.webp

- ID: `home-avatar-new-buyer`
- Page: `index.html`
- Section: How Can We Help You Today?
- Component: `card_background`
- Format: `card`
- Priority: P1
- Placement notes: Background for the Just Bought a Home pathway card. Preserve a bright, optimistic feel without making the space look like a luxury listing.

Prompt:
```text
Bright unfurnished Atlanta living room before move-in, protected floors, fresh paint samples, roller tray, a few moving boxes softly out of focus, optimistic new-home feeling, premium local realism, no text, no logos.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/home-avatar-partner-card.webp

- ID: `home-avatar-partner`
- Page: `index.html`
- Section: How Can We Help You Today?
- Component: `card_background`
- Format: `card`
- Priority: P1
- Placement notes: Background for the Realtors & Investors pathway card. Avoid handshake cliches; show useful coordination and blank/non-readable paperwork.

Prompt:
```text
Realtor and painting contractor reviewing a blank clipboard in a staged home, calm professional collaboration, no handshake cliche, warm daylight, shallow depth of field, no readable text, no brand marks.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/services-route-presale-card.webp

- ID: `services-route-presale`
- Page: `services.html`
- Section: Choose the Path That Matches Your Goal
- Component: `card_background`
- Format: `card`
- Priority: P1
- Placement notes: Route-card background for sellers. Composition should make the card feel like a pre-listing decision, not generic painting.

Prompt:
```text
Pre-listing home prep scene on a kitchen island, blank punch list, color samples, minor touch-up tools, clean staged interior, real estate ready, no readable text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/services-route-renovations-card.webp

- ID: `services-route-renovations`
- Page: `services.html`
- Section: Choose the Path That Matches Your Goal
- Component: `card_background`
- Format: `card`
- Priority: P1
- Placement notes: Route-card background for small refreshes and repairs. Keep tools clean and scope modest.

Prompt:
```text
Small home refresh in progress, protected vanity and trim painting, drywall patch ready for primer, clean tools, premium but believable residential renovation, no text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/services-route-partners-card.webp

- ID: `services-route-partners`
- Page: `services.html`
- Section: Choose the Path That Matches Your Goal
- Component: `card_background`
- Format: `card`
- Priority: P1
- Placement notes: Route-card background for real estate partners. The scene should communicate reputation protection and coordination.

Prompt:
```text
Real estate partner walkthrough in a bright finished home, contractor pointing toward trim detail, professional trust, no documents with readable text, no logos.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/presale-checklist-section.webp

- ID: `presale-checklist-section`
- Page: `presale.html`
- Section: Strategic Pre-Listing Checklist
- Component: `section_background`
- Format: `hero_wide`
- Priority: P1
- Placement notes: Wide supporting image for the checklist section. Leave negative space for adjacent copy and avoid readable punch-list text.

Prompt:
```text
Wide 16:9 pre-sale punch list scene, homeowner, realtor, and contractor around a kitchen island, blank papers, paint swatches, clean staged home, negative space for website copy, no readable text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/painting-process-prep-card.webp

- ID: `painting-process-prep`
- Page: `painting.html`
- Section: The Roly Painting Process
- Component: `process_card_background`
- Format: `story_process`
- Priority: P1
- Placement notes: Step-card background for preparation. Detail should show protection and precision without cropping the tape/trim action.

Prompt:
```text
Interior painting prep close-up, furniture fully protected, crisp painter tape on trim, drop cloths, clean professional workflow, warm window light, no labels.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/painting-process-application-card.webp

- ID: `painting-process-application`
- Page: `painting.html`
- Section: The Roly Painting Process
- Component: `process_card_background`
- Format: `story_process`
- Priority: P1
- Placement notes: Step-card background for application. Keep the roller/wall contact visible and overlay-safe.

Prompt:
```text
Painter applying smooth wall finish with roller in a protected living room, controlled posture, clean edges, premium local service photography, no text/logos.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/painting-process-walkthrough-card.webp

- ID: `painting-process-walkthrough`
- Page: `painting.html`
- Section: The Roly Painting Process
- Component: `process_card_background`
- Format: `story_process`
- Priority: P1
- Placement notes: Step-card background for cleanup and walkthrough. Show inspection and trust, not a staged testimonial pose.

Prompt:
```text
Finished room walkthrough, contractor showing homeowner a crisp trim line and smooth wall finish, warm trust-building documentary style, no readable text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/renovations-kitchen-card.webp

- ID: `renovations-kitchen`
- Page: `renovations.html`
- Section: High-Impact Refreshes & Repairs
- Component: `card_background`
- Format: `card`
- Priority: P2
- Placement notes: Background for kitchen update card. Keep the image scoped to refresh work, not a full gut renovation.

Prompt:
```text
Kitchen refresh detail, cabinets protected, trim and wall paint touch-ups, clean tools, not a full remodel, realistic Atlanta home, no text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/renovations-bathroom-card.webp

- ID: `renovations-bathroom`
- Page: `renovations.html`
- Section: High-Impact Refreshes & Repairs
- Component: `card_background`
- Format: `card`
- Priority: P2
- Placement notes: Background for bathroom update card. Show protected fixtures and fresh surfaces, not luxury-spa replacement.

Prompt:
```text
Small bathroom refresh, vanity protected, fresh trim paint, repaired wall surface, clean bright finish, believable home improvement scene, no text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/renovations-drywall-card.webp

- ID: `renovations-drywall`
- Page: `renovations.html`
- Section: High-Impact Refreshes & Repairs
- Component: `card_background`
- Format: `card`
- Priority: P2
- Placement notes: Background for drywall repair card. Macro/detail composition should make craft quality obvious.

Prompt:
```text
Macro residential drywall repair, smooth patched wall, vacuum sanding tool nearby, surface ready for primer, technical craftsmanship, no labels.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/renovations-deck-card.webp

- ID: `renovations-deck`
- Page: `renovations.html`
- Section: High-Impact Refreshes & Repairs
- Component: `card_background`
- Format: `card`
- Priority: P2
- Placement notes: Background for deck/fence card. Use warm wood protection and local backyard context.

Prompt:
```text
Backyard deck staining project, one clean protected work zone, warm wood tone, realistic suburban Atlanta yard, no text/logos.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/reviews-proof-bg.webp

- ID: `reviews-proof`
- Page: `reviews.html`
- Section: What Your Atlanta Neighbors Say
- Component: `proof_background`
- Format: `hero_wide`
- Priority: P2
- Placement notes: Subtle proof image for reviews hero or review-section band. Keep faces natural and avoid fake testimonial text.

Prompt:
```text
Finished Atlanta living room after professional painting, homeowner and contractor doing final inspection, clean baseboards, warm natural light, authentic trust, no readable text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/about-hero-team.webp

- ID: `about-hero-team`
- Page: `about.html`
- Section: The Team Behind the Finish
- Component: `hero_background`
- Format: `hero_wide`
- Priority: P1
- Placement notes: Hero background or image pane for About. Prefer real team photography if available; this prompt is a fallback.

Prompt:
```text
Authentic local painting team preparing a protected interior room, clean uniforms without logos, warm approachable energy, premium local business realism, wide composition, no text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/contact-hero-consultation.webp

- ID: `contact-hero-consultation`
- Page: `contact.html`
- Section: Let's Talk About Your Property
- Component: `hero_background`
- Format: `hero_wide`
- Priority: P1
- Placement notes: Hero background for Contact. Make it feel responsive and organized; keep visual noise low around form/call CTAs.

Prompt:
```text
Warm consultation scene for home services estimate, phone, blank notebook, paint swatches, house exterior softly visible through window, clean negative space, no readable text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/community-hero-mural.webp

- ID: `community-hero-mural`
- Page: `community.html`
- Section: Supporting Our Local Schools & Neighborhoods
- Component: `hero_background`
- Format: `hero_wide`
- Priority: P2
- Placement notes: Hero replacement for community page. Use abstract mural shapes so there are no accidental school names or fake slogans.

Prompt:
```text
Local community mural painting day, families and volunteers painting abstract colorful wall shapes, safe clean setup, joyful realistic atmosphere, no words, no school names.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

### assets/contextual/vsl-thumbnail-premium.webp

- ID: `vsl-thumbnail-premium`
- Page: `vsl.html`
- Section: VSL video wrapper
- Component: `vsl_thumbnail`
- Format: `story_process`
- Priority: P1
- Placement notes: Video-wrapper background. Keep dark navy negative space where the play button and video UI sit.

Prompt:
```text
Cinematic 16:9 video thumbnail still, painter showing smooth cabinet finish sample to homeowner, warm indoor light, dark navy negative space for play button overlay, no text.
```
Negative prompt:
```text
no readable text, no fake logos, no brand names, no distorted hands, no unsafe ladders, no messy jobsite, no over-saturated HDR, no cartoon look, no luxury mansion, no stock-photo posing
```

## Section Pack Prompts

### interior_painting_cards

- Format: `card`

#### card-interior-protection.webp
```text
Bright living room with furniture fully wrapped, drop cloths, blue tape, painter cutting a crisp line around trim, warm natural light, premium local service realism, no text.
```

#### gallery-interior-trim-line.webp
```text
Interior trim and wall finish close-up, crisp cut line, smooth satin sheen, sunlight across baseboard, communicates precision and cleanliness.
```

### exterior_painting_cards

- Format: `card`

#### card-exterior-prep.webp
```text
Exterior painting prep on a Southern home, siding being washed and scraped before paint, controlled water spray, safe equipment, crisp composition, communicates durability and care.
```

#### gallery-exterior-before-after.webp
```text
Before-and-after style exterior painting project, split composition implied by matching angles, one side weathered siding, one side finished deep navy paint, realistic local home, no text overlay.
```

### cabinet_finish_cards

- Format: `card`

#### card-cabinet-spray.webp
```text
Factory-grade cabinet painting scene, cabinet doors on racks inside a clean spray booth, painter in protective suit, glossy smooth white finish, technical precision, no readable labels.
```

#### gallery-cabinet-finished.webp
```text
Finished kitchen cabinets in a warm Atlanta home, smooth painted doors, upgraded hardware, clean countertops, natural light, premium but not mansion-like, no text.
```

### drywall_process_cards

- Format: `story_process`

#### card-drywall-vacuum-sanding.webp
```text
Close detail of smooth drywall repair after sanding, vacuum sanding tool nearby, clean wall surface ready for primer, technical craftsmanship macro shot.
```

#### story-drywall-repair-stage.webp
```text
Painter using dust-extraction sanding on a repaired drywall patch, protected floor, clean hallway, safety mask, warm daylight, no labels or logos.
```

### pressure_washing_cards

- Format: `card`

#### card-soft-wash-prep.webp
```text
Soft wash exterior preparation on a local Atlanta home, controlled low-pressure water cleaning siding, clear before-and-after cleaning boundary, safe stance, clean property surroundings, no text.
```

### color_lab

- Format: `square_detail`

#### color-lab-navy-cream.webp
```text
Same Atlanta craftsman house front elevation, navy siding with warm cream trim, realistic landscaping, consistent camera angle, clean daylight, designed for color comparison UI.
```

#### color-lab-sage-charcoal.webp
```text
Same house and camera angle, organic sage siding, charcoal trim, black windows, premium curb appeal, realistic shadows, no people, no text.
```

#### color-lab-white-bronze.webp
```text
Same house and camera angle, warm white exterior, bronze accents, dark roof, refined real estate curb appeal, photorealistic.
```

### about_trust

- Format: `card`
- Note: Prefer a real owner photo over generated imagery for this slot.

#### owner-roly-real-portrait.webp
```text
Authentic local painting business owner portrait in a finished kitchen, navy polo with no logo, warm approachable expression, shallow depth of field, no text, no fake company name.
```

### community

- Format: `card`

#### community-mural-abstract.webp
```text
Local school community mural painting day, families and volunteers painting abstract colorful wall shapes, joyful but realistic, no readable words, no school names, clean safe setup.
```

### social

- Format: `social_og`

#### og-cover-premium-local.jpg
```text
OpenGraph cover for a premium local painting company: freshly painted Atlanta craftsman home, clean navy and cream palette, warm front porch, negative space for HTML text overlay, no text inside image.
```

#### social-story-painting-estimate.webp
```text
Vertical social story image of protected interior painting prep in a bright home, painter masking trim with precision, warm trustworthy feel, no text or logos.
```

## Before/After Animation Pairs

Generate the before image first. Then create the after state as an edit/variation from that before image so geometry, lighting, perspective, furniture, landscaping, and camera angle stay locked.

### exterior-siding-curb-appeal

- Service: Exterior Painting
- Pages: index.html, gallery.html, painting.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/exterior-siding-curb-appeal-before.webp`
- After asset: `assets/before-after/exterior-siding-curb-appeal-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Exterior craftsman home with weathered siding, faded dull paint, slightly dirty cream trim, realistic landscaping with ordinary Atlanta yard details, visible curb-appeal fatigue but still structurally sound.
```
After prompt:
```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos. Same home with premium deep navy siding, clean cream trim, warm front door accent, subtle refreshed landscaping cleanup, crisp exterior paint lines, believable Atlanta curb appeal.
```
Animation notes:
```text
Use as a hero or gallery wipe. Lock roofline, windows, porch columns, driveway, shrubs, and shadows so only siding, trim, door, and surface cleanliness transition.
```

### exterior-curb-appeal-2

- Service: Exterior Painting
- Pages: gallery.html, painting.html, vsl.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/exterior-curb-appeal-2-before.webp`
- After asset: `assets/before-after/exterior-curb-appeal-2-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Second exterior curb appeal project with tired siding, dull trim, softened edges, and ordinary landscaping, distinct from the navy craftsman hero pair.
```
After prompt:
```text
Create the after state from the same camera angle and same home geometry as the before image. Preserve roofline, windows, porch, driveway, landscaping, lens, perspective, and lighting. Change only painted and cleaned surfaces. Fresh exterior paint, crisp trim contrast, repaired caulk lines, cleaner front elevation, and believable Atlanta curb appeal without luxury exaggeration.
```
Animation notes:
```text
Use as an exterior painting proof point below the primary hero pair. Keep architecture and landscaping locked; transition siding, trim, edge cleanliness, and overall curb appeal only.
```

### exterior-trim-front-door

- Service: Exterior Painting
- Pages: services.html, painting.html, gallery.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/exterior-trim-front-door-before.webp`
- After asset: `assets/before-after/exterior-trim-front-door-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Close wide view of a front porch with yellowed trim, scuffed front door, worn columns, minor caulk gaps, and real-world dust on thresholds.
```
After prompt:
```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos. Same porch with crisp freshly painted trim, smooth front door finish, repaired caulk lines, clean columns, and precise edges around hardware and sidelights.
```
Animation notes:
```text
Best for a tight slider. Keep porch decor, railing, door hardware, and column silhouettes identical; transition only trim, door, caulk, and surface cleanliness.
```

### interior-hallway-scuffs

- Service: Interior Painting
- Pages: painting.html, gallery.html, vsl.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/interior-hallway-scuffs-before.webp`
- After asset: `assets/before-after/interior-hallway-scuffs-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Residential hallway with hand marks, corner dings, baseboard wear, small drywall imperfections, and slightly uneven old paint sheen.
```
After prompt:
```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos. Same hallway with invisible patch repairs, uniform wall sheen, fresh trim, sharp baseboard line, and clean corner edges.
```
Animation notes:
```text
Good for mobile before/after stories. Keep door spacing, floor pattern, light falloff, and perspective identical; transition marks, dents, wall sheen, and trim.
```

### cabinet-kitchen-refresh

- Service: Cabinet Painting
- Pages: index.html, services.html, painting.html, gallery.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/cabinet-kitchen-refresh-before.webp`
- After asset: `assets/before-after/cabinet-kitchen-refresh-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Kitchen with older dark wood cabinets, dated hardware, slightly heavy visual tone, clean countertops, same appliances and layout, ready for cabinet painting transformation.
```
After prompt:
```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos. Same kitchen with cabinets painted in a smooth factory-grade warm white or soft greige finish, updated simple hardware, brighter premium look, countertops and appliances unchanged.
```
Animation notes:
```text
High-value conversion pair. Keep cabinet door count, appliance positions, backsplash, counters, and light direction identical; transition cabinet finish and hardware only.
```

### drywall-patch-repair

- Service: Drywall Repair
- Pages: index.html, renovations.html, gallery.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/drywall-patch-repair-before.webp`
- After asset: `assets/before-after/drywall-patch-repair-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Interior wall with a visible drywall patch, uneven texture, sanding haze, surrounding scuffs, baseboard nearby for scale, clean but unfinished repair area.
```
After prompt:
```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos. Same wall with seamless texture match, smooth repaired surface, fresh primer or paint blended evenly, no visible patch outline, baseboard unchanged except cleaned edge.
```
Animation notes:
```text
Use for process education. Keep wall plane, outlet/baseboard location, and shadow gradient identical; transition patch visibility, texture, and paint blend.
```

### soft-wash-siding

- Service: Soft Full House Washing
- Pages: services.html, gallery.html, presale.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/soft-wash-siding-before.webp`
- After asset: `assets/before-after/soft-wash-siding-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Exterior siding with Georgia humidity stains, organic buildup, visible grime around lower siding and window trim, realistic plants and walkway, no pressure washer in frame.
```
After prompt:
```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos. Same siding cleaned by soft wash, grime removed, original color restored without repainting, windows and trim clearer, landscaping unchanged.
```
Animation notes:
```text
Use for a dramatic clean/dirty wipe. Keep siding color fundamentally the same; transition only organic stains, dirt, and surface brightness.
```

### deck-staining

- Service: Deck Staining
- Pages: services.html, renovations.html, gallery.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/deck-staining-before.webp`
- After asset: `assets/before-after/deck-staining-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Backyard deck with gray weathered boards, dry wood grain, faded railings, ordinary patio furniture in the same positions, Atlanta greenery in the background.
```
After prompt:
```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos. Same deck with warm even stain, protected wood grain still visible, refreshed railings, patio furniture and surrounding greenery unchanged.
```
Animation notes:
```text
Keep board seams, railing geometry, furniture, and tree shadows aligned; transition wood color, sheen, and weathering.
```

### fence-staining

- Service: Fence Staining
- Pages: services.html, renovations.html, gallery.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/fence-staining-before.webp`
- After asset: `assets/before-after/fence-staining-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Backyard wood fence with dull uneven color, weather marks, light mildew near the bottom, grass and garden edge visible, practical suburban Atlanta setting.
```
After prompt:
```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos. Same fence with uniform warm stain, visible natural wood texture, cleaned lower boards, grass and garden edge unchanged.
```
Animation notes:
```text
A simple slider pair. Keep fence slats, knots, posts, grass line, and background depth identical; transition stain color and surface cleanliness.
```

### garage-door-trim

- Service: Exterior Painting
- Pages: services.html, painting.html, gallery.html
- Format: `story_process` / 1920x1080 WebP
- Before asset: `assets/before-after/garage-door-trim-before.webp`
- After asset: `assets/before-after/garage-door-trim-after.webp`

Before prompt:
```text
Photorealistic locked-camera before image, believable Tucker/Atlanta home, same exact composition needed for later animation, natural warm daylight, realistic residential scale, detailed surfaces, no readable text, no fake logos, no brand names, no watermark. Exterior garage door and surrounding trim with worn paint, uneven color, dirt at lower panels, slightly tired curb appeal, driveway and shrubs visible for context.
```
After prompt:
```text
Create the after state from the same camera angle and same room/home geometry as the before image. Preserve structure, windows, furniture placement, landscaping, lens, perspective, and lighting. Change only the painted, repaired, washed, stained, or refreshed surfaces. Premium local real finish, clean professional result, no readable text, no fake logos. Same garage facade with clean painted garage door, crisp trim contrast, refreshed lower panels, stronger premium curb appeal, driveway and shrubs unchanged.
```
Animation notes:
```text
Useful as a compact exterior proof point. Keep garage panel geometry, driveway lines, shrubs, and shadow edges locked; transition trim, garage paint, and dirt.
```
