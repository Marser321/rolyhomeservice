# Roly Home Services Animation Generation Prompts

Use this file as the copy/paste prompt sheet for image-to-video generation.
The machine-readable source of truth is `docs/visual-asset-manifest.json`.

## Global Motion Rules

- Generate from the still image named in `source_asset`.
- Keep motion premium, quiet, and useful for website backgrounds.
- Use muted WebM/MP4 outputs with the target names listed below.
- Keep text, CTAs, labels, phone numbers, and Roly branding in HTML, not inside video.
- Preserve the original composition unless the prompt explicitly asks for a reveal.
- For `before_after_reveal`, use the listed before image as the source and the after image named inside the prompt as the target state.
- Background loops should be subtle enough for text overlays and should respect future `prefers-reduced-motion` fallbacks.

## Negative Motion Prompt

```text
no readable text, no logos, no fake logos, no geometry drift, no warped hands, no unsafe ladders, no object popping, no morphing architecture, no jitter, no harsh camera shake, no messy jobsite
```

## Animation Types

- `ambient_background`: 6-8 second loops for heroes, banners, and section backgrounds.
- `card_micro_loop`: 4-6 second loops for cards with very minimal motion.
- `process_loop`: 6-8 second loops showing real craft actions.
- `before_after_reveal`: 6-10 second locked-camera transformation reveals.
- `scrollytelling_sequence`: connected clips designed for GSAP ScrollTrigger sections.

## Priority Animation Prompts

### assets/animations/home-hero-exterior-loop.webm

- ID: `anim-home-hero-exterior`
- Source asset: `hero-home-value.webp`
- Pages: `index.html`
- Use case: `ambient_background`
- Duration: 8 seconds
- Loop type: `seamless_loop`
- Motion intensity: `subtle`
- Scrollytelling candidate: `false`

Prompt:
```text
Slow cinematic push-in on a freshly painted Atlanta craftsman home, warm morning light moving softly across navy siding and cream trim, subtle leaves moving, premium curb appeal, stable realistic camera, no text, no logos, no people posing, seamless 8 second loop.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped hands, no unsafe ladders, no object popping, no morphing architecture, no jitter, no harsh camera shake, no messy jobsite
```

### assets/animations/interior-painting-prep-loop.webm

- ID: `anim-interior-painting-prep`
- Source asset: `assets/contextual/painting-process-prep-card.webp`
- Pages: `services.html`, `painting.html`, `lp-painting.html`
- Use case: `process_loop`
- Duration: 6 seconds
- Loop type: `seamless_loop`
- Motion intensity: `subtle`
- Scrollytelling candidate: `true`

Prompt:
```text
Gentle handheld-style cinematic loop of a protected living room before painting, drop cloths, blue painter tape, painter carefully masking trim, warm daylight, clean professional workflow, subtle motion only, no readable labels, no logos, seamless 6 second loop.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped hands, no unsafe ladders, no object popping, no morphing architecture, no jitter, no harsh camera shake, no messy jobsite
```

### assets/animations/painting-application-loop.webm

- ID: `anim-painting-application`
- Source asset: `assets/contextual/painting-process-application-card.webp`
- Pages: `painting.html`, `lp-painting.html`
- Use case: `process_loop`
- Duration: 6 seconds
- Loop type: `seamless_loop`
- Motion intensity: `subtle`
- Scrollytelling candidate: `true`

Prompt:
```text
Professional painter applies a smooth roller pass on a protected interior wall, controlled motion, crisp edges, soft natural window light, no splatter, no mess, realistic residential scale, camera locked with slight parallax, seamless 6 second loop.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped hands, no unsafe ladders, no object popping, no morphing architecture, no jitter, no harsh camera shake, no messy jobsite
```

### assets/animations/cabinet-finish-rack-focus-loop.webm

- ID: `anim-cabinet-finish`
- Source asset: `assets/contextual/vsl-thumbnail-premium.webp`
- Pages: `index.html`, `painting.html`, `gallery.html`, `vsl.html`
- Use case: `process_loop`
- Duration: 6 seconds
- Loop type: `seamless_loop`
- Motion intensity: `moderate`
- Scrollytelling candidate: `true`

Prompt:
```text
Slow cinematic rack focus from a smooth painted cabinet door sample to a clean kitchen background, homeowner and contractor hands visible but natural, premium finish sheen, no readable text, no logos, no distorted hands, seamless 6 second loop.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped hands, no distorted hands, no object popping, no morphing cabinets, no jitter, no harsh camera shake, no messy jobsite
```

### assets/animations/drywall-repair-craft-loop.webm

- ID: `anim-drywall-repair`
- Source asset: `assets/contextual/renovations-drywall-card.webp`
- Pages: `renovations.html`, `painting.html`, `gallery.html`
- Use case: `process_loop`
- Duration: 6 seconds
- Loop type: `seamless_loop`
- Motion intensity: `subtle`
- Scrollytelling candidate: `true`

Prompt:
```text
Macro craftsmanship loop of a smooth drywall patch being lightly sanded with dust extraction, clean protected floor, subtle dust capture, wall surface becoming visibly refined, camera locked, no labels, seamless 6 second loop.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped hands, no unsafe tools, no object popping, no wall texture morphing, no jitter, no harsh camera shake, no messy jobsite
```

### assets/animations/presale-punchlist-loop.webm

- ID: `anim-presale-punchlist`
- Source asset: `assets/contextual/presale-checklist-section.webp`
- Pages: `presale.html`, `partners.html`
- Use case: `ambient_background`
- Duration: 7 seconds
- Loop type: `seamless_loop`
- Motion intensity: `subtle`
- Scrollytelling candidate: `false`

Prompt:
```text
Calm professional pre-listing consultation around a kitchen island, blank papers, color swatches, minor touch-up tools, realtor and contractor reviewing surfaces, no handshake cliche, no readable text, warm daylight, seamless 7 second loop.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped hands, no handshake cliche, no object popping, no paper text appearing, no jitter, no harsh camera shake, no messy jobsite
```

### assets/animations/reviews-proof-walkthrough-loop.webm

- ID: `anim-reviews-proof`
- Source asset: `assets/contextual/reviews-proof-bg.webp`
- Pages: `reviews.html`, `index.html`
- Use case: `ambient_background`
- Duration: 6 seconds
- Loop type: `seamless_loop`
- Motion intensity: `subtle`
- Scrollytelling candidate: `false`

Prompt:
```text
Finished living room walkthrough after painting, contractor gestures toward crisp trim line while homeowner observes, warm authentic trust, very subtle camera drift, no testimonial text, no logos, seamless 6 second loop.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped hands, no fake testimonial text, no object popping, no morphing room layout, no jitter, no harsh camera shake, no messy jobsite
```

### assets/animations/contact-consultation-loop.webm

- ID: `anim-contact-hero`
- Source asset: `assets/contextual/contact-hero-consultation.webp`
- Pages: `contact.html`
- Use case: `ambient_background`
- Duration: 8 seconds
- Loop type: `seamless_loop`
- Motion intensity: `subtle`
- Scrollytelling candidate: `false`

Prompt:
```text
Warm estimate consultation scene, phone, blank notebook, paint swatches, soft exterior home view through window, gentle sunlight movement, organized and calm, no readable text, no logos, seamless 8 second loop.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped hands, no phone screen text, no object popping, no morphing table objects, no jitter, no harsh camera shake, no messy jobsite
```

### assets/animations/community-mural-loop.webm

- ID: `anim-community-hero`
- Source asset: `assets/contextual/community-hero-mural.webp`
- Pages: `community.html`
- Use case: `ambient_background`
- Duration: 6 seconds
- Loop type: `seamless_loop`
- Motion intensity: `moderate`
- Scrollytelling candidate: `false`

Prompt:
```text
Families and volunteers painting abstract colorful mural shapes, joyful realistic community energy, safe clean setup, no readable words, no school names, subtle documentary motion, seamless 6 second loop.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no school names, no geometry drift, no warped hands, no unsafe ladders, no object popping, no morphing mural words, no jitter, no harsh camera shake
```

## Before/After Reveal Prompts

### assets/animations/exterior-siding-curb-appeal-reveal.webm

- ID: `anim-before-after-exterior`
- Source asset: `assets/before-after/exterior-siding-curb-appeal-before.webp`
- After-state reference: `assets/before-after/exterior-siding-curb-appeal-after.webp`
- Pages: `index.html`, `gallery.html`, `painting.html`
- Use case: `before_after_reveal`
- Duration: 8 seconds
- Loop type: `single_reveal`
- Motion intensity: `cinematic`
- Scrollytelling candidate: `true`

Prompt:
```text
Locked-camera transformation reveal from weathered Atlanta craftsman siding to freshly painted navy siding and cream trim, using assets/before-after/exterior-siding-curb-appeal-after.webp as the after-state reference, diagonal paint-wipe transition, preserve roofline, windows, porch, landscaping and shadows, no new objects, no text, 8 second reveal.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped architecture, no new objects, no changing windows, no morphing roofline, no flicker, no jitter, no harsh camera shake
```

### assets/animations/interior-living-room-paint-reveal.webm

- ID: `anim-before-after-interior`
- Source asset: `assets/before-after/interior-living-room-paint-before.webp`
- After-state reference: `assets/before-after/interior-living-room-paint-after.webp`
- Pages: `index.html`, `services.html`, `painting.html`, `lp-painting.html`
- Use case: `before_after_reveal`
- Duration: 8 seconds
- Loop type: `single_reveal`
- Motion intensity: `cinematic`
- Scrollytelling candidate: `true`

Prompt:
```text
Locked-camera transformation from tired beige living room walls with scuffs to clean luminous neutral paint and fresh white baseboards, using assets/before-after/interior-living-room-paint-after.webp as the after-state reference, preserve furniture, windows, rug, lighting and perspective, smooth crossfade/wipe, no text, 8 second reveal.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped furniture, no new objects, no changing windows, no morphing floor lines, no flicker, no jitter, no harsh camera shake
```

### assets/animations/cabinet-kitchen-refresh-reveal.webm

- ID: `anim-before-after-cabinets`
- Source asset: `assets/before-after/cabinet-kitchen-refresh-before.webp`
- After-state reference: `assets/before-after/cabinet-kitchen-refresh-after.webp`
- Pages: `index.html`, `services.html`, `painting.html`, `gallery.html`
- Use case: `before_after_reveal`
- Duration: 8 seconds
- Loop type: `single_reveal`
- Motion intensity: `cinematic`
- Scrollytelling candidate: `true`

Prompt:
```text
Locked-camera kitchen cabinet transformation from older dark wood cabinets to smooth warm white factory-grade painted finish, using assets/before-after/cabinet-kitchen-refresh-after.webp as the after-state reference, preserve appliances, counters, backsplash, cabinet geometry and lighting, elegant wipe reveal, no text, 8 second reveal.
```

Negative motion prompt:
```text
no readable text, no logos, no fake logos, no geometry drift, no warped cabinet doors, no new objects, no changing appliance positions, no morphing countertops, no flicker, no jitter, no harsh camera shake
```

## Scrollytelling Candidates

- Highest value: `interior-living-room-paint`
  Use as a four-step story: damage/scuffs, protection/prep, application, finished walkthrough.
- Strong secondary: `cabinet-kitchen-refresh`
  Use as a premium transformation story: old cabinets, prep/sanding, sprayed doors, finished kitchen.
- Exterior proof: `exterior-siding-curb-appeal`
  Use as a hero or gallery wipe unless the generated pair aligns tightly enough for a longer story.
- Educational detail: `drywall-patch-repair`
  Use as a compact renovations or painting micro-story, not the main home-page story.

## QA Before Website Integration

- Check desktop `1440x900` and mobile `390x844` crops.
- Confirm the video is calm enough to sit behind section text or card overlays.
- Confirm no fake text, logos, warped hands, morphing walls, flicker, or object popping.
- Confirm loops are seamless where `loop_type` is `seamless_loop`.
- Confirm `before_after_reveal` clips preserve geometry and do not invent new furniture, windows, landscaping, or luxury upgrades.
- Export optimized muted WebM/MP4, ideally under 1.5 MB for card loops and under 3 MB for hero/banner loops.
