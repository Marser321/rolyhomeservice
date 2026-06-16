#!/usr/bin/env python3
"""
verify_pages.py — Roly Home Services Site Integrity Auditor
============================================================
Validates link integrity, asset references, duplicate IDs, SEO tags,
TCPA consent presence, and vocabulary compliance across all HTML pages.

Usage:
    python verify_pages.py              # Check files in current directory
    python verify_pages.py ./path/to/   # Check files in a specific directory
"""

import json
import os
import re
import sys
from pathlib import Path
from collections import Counter

# ─── Configuration ─────────────────────────────────────────────────────────────
PROHIBITED_WORDS = ["remodeling", "remodel"]
REQUIRED_BRAND = "Roly Home Services"
REQUIRED_SLOGAN = "Your Property Best Friend"
REQUIRED_PHONE = "770-769-0008"
REQUIRED_EMAIL = "rolyhomeservices@gmail.com"

EXPECTED_PAGES = [
    "index.html",
    "services.html",
    "painting.html",
    "presale.html",
    "renovations.html",
    "partners.html",
    "community.html",
    "vsl.html",
    "gallery.html",
    "reviews.html",
    "about.html",
    "contact.html",
]

# Legal pages — checked for SEO/social and existence, but not for the lead form.
LEGAL_PAGES = ["privacy.html", "terms.html"]
VISUAL_LIBRARY_PAGES = EXPECTED_PAGES + ["lp-painting.html"]

# Motion stack expected (in load order) on every page.
MOTION_STACK = [
    "gsap@3.15.0/dist/gsap.min.js",
    "gsap@3.15.0/dist/ScrollTrigger.min.js",
    "gsap@3.15.0/dist/SplitText.min.js",
    "lenis@1.3.23/dist/lenis.min.js",
    'src="app.js"',
    'src="motion.js"',
]

# Image assets that should exist (WebP is what the pages reference; the source
# PNGs remain on disk but are not asserted here). og_cover.jpg backs social cards.
EXPECTED_ASSETS = [
    "hero_craftsman_atlanta.webp",
    "before_paint.webp",
    "after_paint.webp",
    "drywall_repair.webp",
    "interior_painting_prep.webp",
    "cabinet_spraying.webp",
    "community_support.webp",
    "real_estate_partner.webp",
    "roly_owner.webp",
    "pressure_washing.webp",
    "color_navy_cream.webp",
    "color_sage_charcoal.webp",
    "color_white_bronze.webp",
    "og_cover.jpg",
]

VISUAL_MANIFEST = Path("docs") / "visual-asset-manifest.json"
STRICT_VISUALS_FLAG = "--strict-visuals"

# ─── Utilities ─────────────────────────────────────────────────────────────────
class Colors:
    PASS = "\033[92m"
    FAIL = "\033[91m"
    WARN = "\033[93m"
    INFO = "\033[94m"
    BOLD = "\033[1m"
    END = "\033[0m"

def p(status, msg):
    icon = {"PASS": f"{Colors.PASS}[OK]", "FAIL": f"{Colors.FAIL}[XX]", "WARN": f"{Colors.WARN}[!!]", "INFO": f"{Colors.INFO}[ii]"}
    print(f"  {icon.get(status, '')} {msg}{Colors.END}")

# ─── Checks ────────────────────────────────────────────────────────────────────
def check_file_exists(base_dir):
    """Check that all expected HTML pages and image assets exist."""
    print(f"\n{Colors.BOLD}1. FILE EXISTENCE CHECK{Colors.END}")
    ok = True
    for page in EXPECTED_PAGES:
        path = base_dir / page
        if path.exists():
            p("PASS", f"{page} exists ({path.stat().st_size:,} bytes)")
        else:
            p("FAIL", f"{page} MISSING")
            ok = False

    print(f"\n{Colors.BOLD}   Image Assets:{Colors.END}")
    for asset in EXPECTED_ASSETS:
        path = base_dir / asset
        if path.exists():
            size_kb = path.stat().st_size / 1024
            p("PASS", f"{asset} ({size_kb:.0f} KB)")
        else:
            p("FAIL", f"{asset} MISSING")
            ok = False
    return ok


def check_prohibited_vocabulary(base_dir):
    """Ensure prohibited words don't appear in any HTML file."""
    print(f"\n{Colors.BOLD}2. VOCABULARY COMPLIANCE (No 'remodel/remodeling'){Colors.END}")
    ok = True
    for page in EXPECTED_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore").lower()
        for word in PROHIBITED_WORDS:
            count = content.count(word)
            if count > 0:
                p("FAIL", f"{page}: Found '{word}' x{count}")
                ok = False
        if all(content.count(w) == 0 for w in PROHIBITED_WORDS):
            p("PASS", f"{page}: Clean")
    return ok


def check_external_urls(base_dir):
    """Check for Unsplash or other stock image URLs that should be local."""
    print(f"\n{Colors.BOLD}3. EXTERNAL URL AUDIT (No Unsplash/stock URLs){Colors.END}")
    ok = True
    stock_patterns = [r"unsplash\.com", r"pexels\.com", r"placeholder\.com"]
    for page in EXPECTED_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        found = []
        for pattern in stock_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            found.extend(matches)
        if found:
            p("FAIL", f"{page}: Found stock URLs: {', '.join(found)}")
            ok = False
        else:
            p("PASS", f"{page}: No stock URLs")
    return ok


def check_seo_tags(base_dir):
    """Verify unique <title> and <meta description> per page."""
    print(f"\n{Colors.BOLD}4. SEO META TAGS{Colors.END}")
    ok = True
    titles = {}
    for page in EXPECTED_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        title_match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE)
        desc_match = re.search(r'<meta\s+name="description"\s+content="(.*?)"', content, re.IGNORECASE)

        if title_match:
            title = title_match.group(1).strip()
            if title in titles.values():
                p("WARN", f"{page}: Duplicate <title> with another page")
                ok = False
            else:
                p("PASS", f"{page}: <title> = \"{title[:60]}...\"")
            titles[page] = title
        else:
            p("FAIL", f"{page}: Missing <title>")
            ok = False

        if desc_match:
            desc = desc_match.group(1).strip()
            p("PASS", f"{page}: <meta description> present ({len(desc)} chars)")
        else:
            p("FAIL", f"{page}: Missing <meta description>")
            ok = False
    return ok


def check_brand_consistency(base_dir):
    """Verify brand name, slogan, phone, and email are present on pages."""
    print(f"\n{Colors.BOLD}5. BRAND CONSISTENCY{Colors.END}")
    ok = True
    checks = [
        (REQUIRED_BRAND, "Brand name"),
        (REQUIRED_SLOGAN, "Slogan"),
        (REQUIRED_PHONE, "Phone"),
    ]
    for page in EXPECTED_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        for value, label in checks:
            if value in content:
                p("PASS", f"{page}: {label} present")
            else:
                p("FAIL", f"{page}: {label} '{value}' MISSING")
                ok = False
    return ok


def check_forms(base_dir):
    """Check that all pages have the GHL progressive form and TCPA consent."""
    print(f"\n{Colors.BOLD}6. FORM & TCPA CONSENT{Colors.END}")
    ok = True
    for page in EXPECTED_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")

        has_form = "ghlProgressiveForm" in content
        has_consent = "form-consent-notice" in content
        has_success = "formSuccessCard" in content

        if has_form:
            p("PASS", f"{page}: Progressive form present")
        else:
            p("FAIL", f"{page}: Progressive form MISSING")
            ok = False

        if has_consent:
            p("PASS", f"{page}: TCPA consent notice present")
        else:
            p("FAIL", f"{page}: TCPA consent notice MISSING")
            ok = False

        if has_success:
            p("PASS", f"{page}: Success card present")
        else:
            p("FAIL", f"{page}: Success card MISSING")
            ok = False
    return ok


def check_duplicate_ids(base_dir):
    """Check for duplicate IDs within each page."""
    print(f"\n{Colors.BOLD}7. DUPLICATE ID CHECK{Colors.END}")
    ok = True
    for page in EXPECTED_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        ids = re.findall(r'\bid="([^"]+)"', content)
        dupes = {k: v for k, v in Counter(ids).items() if v > 1}
        if dupes:
            p("WARN", f"{page}: Duplicate IDs: {dupes}")
        else:
            p("PASS", f"{page}: All IDs unique ({len(ids)} IDs)")
    return ok


def check_spanish_residue(base_dir):
    """Check for leftover Spanish text in HTML files (scrollytelling etc.)."""
    print(f"\n{Colors.BOLD}8. SPANISH RESIDUE CHECK{Colors.END}")
    ok = True
    spanish_patterns = [r"Paso \d", r"diagnóstico", r"lijado", r"sellado", r"acabado premium"]
    for page in EXPECTED_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        found = []
        for pattern in spanish_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            found.extend(matches)
        if found:
            p("FAIL", f"{page}: Spanish residue found: {found}")
            ok = False
        else:
            p("PASS", f"{page}: English only")
    return ok


def check_motion_stack(base_dir):
    """Each page loads the pinned GSAP + Lenis stack, in the right order."""
    print(f"\n{Colors.BOLD}9. MOTION STACK (GSAP 3.15 + Lenis, in order){Colors.END}")
    ok = True
    for page in EXPECTED_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        positions = [content.find(token) for token in MOTION_STACK]
        if any(pos == -1 for pos in positions):
            missing = [MOTION_STACK[i] for i, pos in enumerate(positions) if pos == -1]
            p("FAIL", f"{page}: missing {missing}")
            ok = False
        elif positions != sorted(positions):
            p("FAIL", f"{page}: scripts out of order")
            ok = False
        else:
            extra = " + Flip" if "Flip.min.js" in content else ""
            p("PASS", f"{page}: stack present and ordered{extra}")
    return ok


def check_image_hygiene(base_dir):
    """No .png references remain; every <img> is lazy or high-priority; pages
    with a priority hero image preload it."""
    print(f"\n{Colors.BOLD}10. IMAGE HYGIENE (WebP + loading attrs){Colors.END}")
    ok = True
    for page in EXPECTED_PAGES + LEGAL_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        issues = []
        if re.search(r'src="[^"]+\.png"', content) or re.search(r"url\(['\"]?[^)]+\.png", content):
            issues.append("residual .png reference")
        imgs = re.findall(r"<img\b[^>]*>", content, re.IGNORECASE)
        bad = [t for t in imgs if 'loading="lazy"' not in t and 'fetchpriority="high"' not in t]
        if bad:
            issues.append(f"{len(bad)} <img> without loading/fetchpriority")
        if 'fetchpriority="high"' in content and 'rel="preload" as="image"' not in content:
            issues.append("priority hero without preload link")
        if issues:
            p("FAIL", f"{page}: {'; '.join(issues)}")
            ok = False
        else:
            p("PASS", f"{page}: clean ({len(imgs)} imgs)")
    return ok


def _extract_image_asset_refs(content):
    """Return local image filenames referenced from HTML inline assets."""
    refs = []
    patterns = [
        r'(?:src|href|content)=["\'](?:https://rolyhomeservices\.com/)?([^"\']+\.(?:webp|jpg|jpeg|png))["\']',
        r'url\(["\']?([^)"\']+\.(?:webp|jpg|jpeg|png))["\']?\)',
    ]
    for pattern in patterns:
        for match in re.findall(pattern, content, re.IGNORECASE):
            name = match.split("/")[-1]
            if not name.startswith("http"):
                refs.append(name)
    return refs


def check_visual_asset_strategy(base_dir, strict=False):
    """Validate the premium-local-real visual prompt manifest and report current
    visual debt. Default mode warns only; --strict-visuals turns debt into a
    failing release check once the new image library is ready."""
    print(f"\n{Colors.BOLD}11. VISUAL ASSET STRATEGY{' (STRICT)' if strict else ''}{Colors.END}")
    ok = True
    manifest_path = base_dir / VISUAL_MANIFEST

    if not manifest_path.exists():
        p("FAIL", f"{VISUAL_MANIFEST.as_posix()} missing")
        return False

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        p("FAIL", f"{VISUAL_MANIFEST.as_posix()} invalid JSON: {exc}")
        return False

    formats = manifest.get("formats", {})
    priority_slots = manifest.get("priority_slots", [])
    section_packs = manifest.get("section_packs", [])
    contextual_slots = manifest.get("contextual_background_slots", [])
    before_after_pairs = manifest.get("before_after_pairs", [])
    animation_slots = manifest.get("animation_prompt_slots", [])
    negative_prompt = manifest.get("negative_prompt_global", "")

    if len(formats) >= 6:
        p("PASS", f"Manifest defines {len(formats)} image formats")
    else:
        p("FAIL", "Manifest missing required image format definitions")
        ok = False

    if len(priority_slots) >= 7:
        p("PASS", f"Manifest defines {len(priority_slots)} priority replacement slots")
    else:
        p("FAIL", "Manifest missing priority hero/VSL slots")
        ok = False

    if section_packs:
        p("PASS", f"Manifest defines {len(section_packs)} section prompt packs")
    else:
        p("FAIL", "Manifest missing section prompt packs")
        ok = False

    if len(contextual_slots) >= 19:
        p("PASS", f"Manifest defines {len(contextual_slots)} contextual background slots")
    else:
        p("FAIL", f"Manifest should define at least 19 contextual background slots, found {len(contextual_slots)}")
        ok = False

    canonical_pair_ids = {
        "exterior-siding-curb-appeal",
        "exterior-curb-appeal-2",
        "exterior-trim-front-door",
        "interior-hallway-scuffs",
        "cabinet-kitchen-refresh",
        "drywall-patch-repair",
        "soft-wash-siding",
        "deck-staining",
        "fence-staining",
        "garage-door-trim",
    }

    if {pair.get("id") for pair in before_after_pairs} == canonical_pair_ids:
        p("PASS", "Manifest defines the 10 canonical client before/after pairs")
    else:
        found = sorted(pair.get("id", "unknown") for pair in before_after_pairs)
        p("FAIL", f"Manifest before/after pairs must match the canonical set; found {found}")
        ok = False

    if len(animation_slots) >= 10:
        p("PASS", f"Manifest defines {len(animation_slots)} image-to-video animation prompt slots")
    else:
        p("FAIL", f"Manifest should define at least 10 animation prompt slots, found {len(animation_slots)}")
        ok = False

    required_negative_terms = ["no readable text", "no fake logos", "no brand names"]
    missing_terms = [term for term in required_negative_terms if term not in negative_prompt]
    if missing_terms:
        p("FAIL", f"Global negative prompt missing: {missing_terms}")
        ok = False
    else:
        p("PASS", "Global negative prompt blocks text/logos/brand hallucinations")

    contextual_required_fields = [
        "id", "page", "section", "component_type", "format", "target_asset",
        "placement_notes", "prompt", "negative_prompt", "priority",
    ]
    contextual_ids = [slot.get("id") for slot in contextual_slots]
    duplicate_contextual_ids = sorted({
        slot_id for slot_id in contextual_ids if contextual_ids.count(slot_id) > 1
    })
    if duplicate_contextual_ids:
        p("FAIL", f"Duplicate contextual slot ids: {duplicate_contextual_ids}")
        ok = False

    contextual_assets = [
        slot.get("target_asset") for slot in contextual_slots if slot.get("target_asset")
    ]
    duplicate_contextual_assets = sorted({
        asset for asset in contextual_assets if contextual_assets.count(asset) > 1
    })
    if duplicate_contextual_assets:
        p("FAIL", f"Duplicate contextual target assets: {duplicate_contextual_assets}")
        ok = False

    valid_component_types = {
        "hero_background", "section_background", "card_background",
        "process_card_background", "proof_background", "vsl_thumbnail",
    }
    invalid_contextual_slots = []
    for slot in contextual_slots:
        slot_id = slot.get("id", "unknown")
        missing = [field for field in contextual_required_fields if not slot.get(field)]
        if missing:
            invalid_contextual_slots.append(f"{slot_id}: missing {missing}")
            continue

        target_asset = slot["target_asset"]
        negative = slot["negative_prompt"].lower()

        if slot["page"] not in VISUAL_LIBRARY_PAGES:
            invalid_contextual_slots.append(f"{slot_id}: page should be one of VISUAL_LIBRARY_PAGES")
        if slot["format"] not in formats:
            invalid_contextual_slots.append(f"{slot_id}: unknown format {slot['format']}")
        if slot["component_type"] not in valid_component_types:
            invalid_contextual_slots.append(f"{slot_id}: unknown component_type {slot['component_type']}")
        if not target_asset.startswith("assets/contextual/") or not target_asset.endswith(".webp"):
            invalid_contextual_slots.append(f"{slot_id}: target_asset should live under assets/contextual/*.webp")
        for term in ["no readable text", "no fake logos", "no brand names"]:
            if term not in negative:
                invalid_contextual_slots.append(f"{slot_id}: negative_prompt missing '{term}'")
        if not isinstance(slot.get("priority"), int) or slot["priority"] not in {1, 2, 3}:
            invalid_contextual_slots.append(f"{slot_id}: priority should be 1, 2, or 3")

    if invalid_contextual_slots:
        p("FAIL", f"Contextual background slot issues: {'; '.join(invalid_contextual_slots[:4])}"
          + ("..." if len(invalid_contextual_slots) > 4 else ""))
        ok = False
    elif contextual_slots:
        p("PASS", "Contextual background slots have complete schema, valid formats, and safe negative prompts")

    animation_required_fields = [
        "id", "source_asset", "target_video", "pages", "use_case",
        "duration_seconds", "loop_type", "motion_intensity",
        "animation_prompt", "negative_motion_prompt",
        "scrollytelling_candidate", "priority",
    ]
    animation_ids = [slot.get("id") for slot in animation_slots]
    duplicate_animation_ids = sorted({
        slot_id for slot_id in animation_ids if animation_ids.count(slot_id) > 1
    })
    if duplicate_animation_ids:
        p("FAIL", f"Duplicate animation slot ids: {duplicate_animation_ids}")
        ok = False

    animation_videos = [
        slot.get("target_video") for slot in animation_slots if slot.get("target_video")
    ]
    duplicate_animation_videos = sorted({
        video for video in animation_videos if animation_videos.count(video) > 1
    })
    if duplicate_animation_videos:
        p("FAIL", f"Duplicate animation target videos: {duplicate_animation_videos}")
        ok = False

    valid_animation_use_cases = {
        "ambient_background", "card_micro_loop", "process_loop",
        "before_after_reveal", "scrollytelling_sequence",
    }
    valid_loop_types = {"seamless_loop", "single_reveal", "scroll_scrub_sequence"}
    valid_motion_intensities = {"subtle", "moderate", "cinematic"}
    invalid_animation_slots = []
    for slot in animation_slots:
        slot_id = slot.get("id", "unknown")
        missing = [field for field in animation_required_fields if field not in slot or slot.get(field) in ("", None)]
        if missing:
            invalid_animation_slots.append(f"{slot_id}: missing {missing}")
            continue

        source_asset = slot["source_asset"]
        target_video = slot["target_video"]
        negative = slot["negative_motion_prompt"].lower()
        duration = slot["duration_seconds"]

        if not isinstance(slot.get("pages"), list) or not slot["pages"]:
            invalid_animation_slots.append(f"{slot_id}: pages must be a non-empty list")
        else:
            unknown_pages = [page for page in slot["pages"] if page not in VISUAL_LIBRARY_PAGES]
            if unknown_pages:
                invalid_animation_slots.append(f"{slot_id}: unknown pages {unknown_pages}")
        if slot["use_case"] not in valid_animation_use_cases:
            invalid_animation_slots.append(f"{slot_id}: unknown use_case {slot['use_case']}")
        if slot["loop_type"] not in valid_loop_types:
            invalid_animation_slots.append(f"{slot_id}: unknown loop_type {slot['loop_type']}")
        if slot["motion_intensity"] not in valid_motion_intensities:
            invalid_animation_slots.append(f"{slot_id}: unknown motion_intensity {slot['motion_intensity']}")
        if not target_video.startswith("assets/animations/") or not target_video.endswith((".webm", ".mp4")):
            invalid_animation_slots.append(f"{slot_id}: target_video should live under assets/animations/*.webm or *.mp4")
        if not source_asset.endswith((".webp", ".jpg", ".jpeg", ".png")):
            invalid_animation_slots.append(f"{slot_id}: source_asset should be an image file")
        if not isinstance(duration, (int, float)) or duration < 4 or duration > 10:
            invalid_animation_slots.append(f"{slot_id}: duration_seconds should be between 4 and 10")
        if not isinstance(slot.get("scrollytelling_candidate"), bool):
            invalid_animation_slots.append(f"{slot_id}: scrollytelling_candidate should be boolean")
        if not isinstance(slot.get("priority"), int) or slot["priority"] not in {1, 2, 3}:
            invalid_animation_slots.append(f"{slot_id}: priority should be 1, 2, or 3")
        for term in ["no readable text", "no logos", "no geometry drift"]:
            if term not in negative:
                invalid_animation_slots.append(f"{slot_id}: negative_motion_prompt missing '{term}'")

    if invalid_animation_slots:
        p("FAIL", f"Animation prompt slot issues: {'; '.join(invalid_animation_slots[:4])}"
          + ("..." if len(invalid_animation_slots) > 4 else ""))
        ok = False
    elif animation_slots:
        p("PASS", "Animation prompt slots have complete schema, valid motion types, and safe negative prompts")

    pair_required_fields = [
        "id", "service", "pages", "format", "before_asset", "after_asset",
        "before_prompt", "after_prompt", "animation_notes", "priority",
    ]
    pair_ids = [pair.get("id") for pair in before_after_pairs]
    duplicate_pair_ids = sorted({pair_id for pair_id in pair_ids if pair_ids.count(pair_id) > 1})
    if duplicate_pair_ids:
        p("FAIL", f"Duplicate before/after pair ids: {duplicate_pair_ids}")
        ok = False

    before_assets = [pair.get("before_asset") for pair in before_after_pairs]
    after_assets = [pair.get("after_asset") for pair in before_after_pairs]
    all_pair_assets = [asset for asset in before_assets + after_assets if asset]
    duplicate_pair_assets = sorted({asset for asset in all_pair_assets if all_pair_assets.count(asset) > 1})
    if duplicate_pair_assets:
        p("FAIL", f"Duplicate before/after asset paths: {duplicate_pair_assets}")
        ok = False

    invalid_pairs = []
    for pair in before_after_pairs:
        pair_id = pair.get("id", "unknown")
        missing = [field for field in pair_required_fields if not pair.get(field)]
        if missing:
            invalid_pairs.append(f"{pair_id}: missing {missing}")
            continue

        expected_before = f"assets/before-after/{pair_id}-before.webp"
        expected_after = f"assets/before-after/{pair_id}-after.webp"
        after_prompt = pair["after_prompt"].lower()
        before_prompt = pair["before_prompt"].lower()

        if pair["before_asset"] != expected_before:
            invalid_pairs.append(f"{pair_id}: before_asset should be {expected_before}")
        if pair["after_asset"] != expected_after:
            invalid_pairs.append(f"{pair_id}: after_asset should be {expected_after}")
        if pair["before_asset"] == pair["after_asset"]:
            invalid_pairs.append(f"{pair_id}: before_asset and after_asset must differ")
        if pair["format"] != "story_process":
            invalid_pairs.append(f"{pair_id}: format should be story_process for 1920x1080 pairs")
        if not pair.get("pages") or not isinstance(pair.get("pages"), list):
            invalid_pairs.append(f"{pair_id}: pages must be a non-empty list")
        if "locked-camera" not in before_prompt or "same exact composition" not in before_prompt:
            invalid_pairs.append(f"{pair_id}: before_prompt missing locked-camera composition language")
        for term in ["same camera angle", "preserve structure", "change only"]:
            if term not in after_prompt:
                invalid_pairs.append(f"{pair_id}: after_prompt missing '{term}'")

    if invalid_pairs:
        p("FAIL", f"Before/after pair schema issues: {'; '.join(invalid_pairs[:4])}"
          + ("..." if len(invalid_pairs) > 4 else ""))
        ok = False
    elif before_after_pairs:
        p("PASS", "Before/after pairs have unique ids, locked-camera prompts, and expected asset paths")

    current_refs = Counter()
    for page in EXPECTED_PAGES + LEGAL_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        current_refs.update(_extract_image_asset_refs(path.read_text(encoding="utf-8", errors="ignore")))

    repeated_assets = {name: count for name, count in current_refs.items()
                       if count >= 4 and name not in {"og_cover.jpg"}}
    if repeated_assets:
        level = "FAIL" if strict else "WARN"
        p(level, f"Repeated visual debt: {repeated_assets}")
        ok = ok and not strict
    else:
        p("PASS", "No overused local image appears in 4+ contexts")

    risk_assets = [
        item.get("asset") for item in manifest.get("current_asset_audit", [])
        if item.get("risk") == "text_or_logo"
    ]
    active_risks = [asset for asset in risk_assets if asset in current_refs]
    if active_risks:
        level = "FAIL" if strict else "WARN"
        p(level, f"Generated text/logo risk assets still referenced: {active_risks}")
        ok = ok and not strict
    else:
        p("PASS", "No known fake text/logo risk assets are referenced")

    missing_targets = sorted({
        slot.get("target_asset")
        for slot in priority_slots
        if slot.get("target_asset") and not (base_dir / slot["target_asset"]).exists()
    })
    if missing_targets:
        level = "FAIL" if strict else "WARN"
        p(level, f"{len(missing_targets)} priority target assets not generated yet: {', '.join(missing_targets[:5])}"
          + ("..." if len(missing_targets) > 5 else ""))
        ok = ok and not strict
    else:
        p("PASS", "All priority target assets exist")

    incomplete_slots = [
        slot.get("id", "unknown")
        for slot in priority_slots
        if not slot.get("prompt") or not slot.get("target_asset") or not slot.get("format")
    ]
    if incomplete_slots:
        p("FAIL", f"Incomplete manifest slots: {incomplete_slots}")
        ok = False
    else:
        p("PASS", "Every priority slot has prompt, format, and target asset")

    missing_contextual_assets = sorted({
        asset for asset in contextual_assets
        if asset and not (base_dir / asset).exists()
    })
    if missing_contextual_assets:
        level = "FAIL" if strict else "WARN"
        p(level, f"{len(missing_contextual_assets)} contextual target assets not generated yet: "
          f"{', '.join(missing_contextual_assets[:4])}"
          + ("..." if len(missing_contextual_assets) > 4 else ""))
        ok = ok and not strict
    elif contextual_slots:
        p("PASS", "All contextual target assets exist")

    missing_pair_assets = sorted({
        asset for asset in all_pair_assets
        if asset and not (base_dir / asset).exists()
    })
    if missing_pair_assets:
        level = "FAIL" if strict else "WARN"
        p(level, f"{len(missing_pair_assets)} before/after pair assets not generated yet: "
          f"{', '.join(missing_pair_assets[:4])}"
          + ("..." if len(missing_pair_assets) > 4 else ""))
        ok = ok and not strict
    elif before_after_pairs:
        p("PASS", "All before/after pair assets exist")

    animation_source_assets = sorted({
        slot.get("source_asset")
        for slot in animation_slots
        if slot.get("source_asset") and not (base_dir / slot["source_asset"]).exists()
    })
    if animation_source_assets:
        level = "FAIL" if strict else "WARN"
        p(level, f"{len(animation_source_assets)} animation source assets not generated yet: "
          f"{', '.join(animation_source_assets[:4])}"
          + ("..." if len(animation_source_assets) > 4 else ""))
        ok = ok and not strict
    elif animation_slots:
        p("PASS", "All animation source assets exist")

    missing_animation_videos = sorted({
        video for video in animation_videos
        if video and not (base_dir / video).exists()
    })
    if missing_animation_videos:
        p("WARN", f"{len(missing_animation_videos)} animation target videos not generated yet (roadmap only): "
          f"{', '.join(missing_animation_videos[:4])}"
          + ("..." if len(missing_animation_videos) > 4 else ""))
    elif animation_slots:
        p("PASS", "All animation target videos exist")

    return ok


def check_social_meta(base_dir):
    """Canonical + OpenGraph + Twitter card present on every public page."""
    print(f"\n{Colors.BOLD}12. SOCIAL / CANONICAL META{Colors.END}")
    ok = True
    needed = ['property="og:title"', 'property="og:description"', 'property="og:image"',
              'property="og:url"', 'name="twitter:card"']
    for page in EXPECTED_PAGES + LEGAL_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        missing = [tok for tok in needed if tok not in content]
        has_canonical = re.search(r'<link\s+rel="canonical"\s+href="https://rolyhomeservices\.com', content)
        if missing or not has_canonical:
            detail = []
            if missing:
                detail.append(f"missing {missing}")
            if not has_canonical:
                detail.append("missing canonical")
            p("FAIL", f"{page}: {'; '.join(detail)}")
            ok = False
        else:
            p("PASS", f"{page}: OG + Twitter + canonical present")
    return ok


def check_structured_data(base_dir):
    """index.html carries LocalBusiness (HousePainter) JSON-LD."""
    print(f"\n{Colors.BOLD}13. STRUCTURED DATA (JSON-LD on index){Colors.END}")
    path = base_dir / "index.html"
    if not path.exists():
        p("FAIL", "index.html MISSING")
        return False
    content = path.read_text(encoding="utf-8", errors="ignore")
    ok = True
    for token in ['application/ld+json', '"@type": "HousePainter"', '"telephone"']:
        if token in content:
            p("PASS", f"index.html: {token} present")
        else:
            p("FAIL", f"index.html: {token} MISSING")
            ok = False
    return ok


def check_legal_pages(base_dir):
    """Privacy/Terms exist with SEO, and their links no longer point to '#'."""
    print(f"\n{Colors.BOLD}14. LEGAL PAGES & LINKS{Colors.END}")
    ok = True
    for page in LEGAL_PAGES:
        path = base_dir / page
        if not path.exists():
            p("FAIL", f"{page} MISSING")
            ok = False
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"<title>.*?</title>", content, re.IGNORECASE) and 'name="description"' in content:
            p("PASS", f"{page}: present with SEO")
        else:
            p("FAIL", f"{page}: missing title/description")
            ok = False
    # No dead Privacy/Terms links anywhere.
    for page in EXPECTED_PAGES + LEGAL_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        if re.search(r'href="#"[^>]*>\s*(Privacy|Terms)', content):
            p("FAIL", f"{page}: dead Privacy/Terms link (href=#)")
            ok = False
    return ok


def check_conversion_elements(base_dir):
    """Mobile call pill, skip link, working form anchor, and no placeholder
    video URLs anywhere."""
    print(f"\n{Colors.BOLD}15. CONVERSION & PLACEHOLDER HYGIENE{Colors.END}")
    ok = True
    for page in EXPECTED_PAGES + LEGAL_PAGES:
        path = base_dir / page
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        issues = []
        if "mobile-call-pill" not in content:
            issues.append("missing mobile call pill")
        if "skip-link" not in content:
            issues.append("missing skip link")
        if 'id="main-content"' not in content:
            issues.append("missing main-content landmark")
        if "dQw4w9WgXcQ" in content:
            issues.append("placeholder video URL present")
        if "ghlProgressiveForm" in content and 'id="get-started"' not in content:
            issues.append("form page without get-started anchor")
        if issues:
            p("FAIL", f"{page}: {'; '.join(issues)}")
            ok = False
        else:
            p("PASS", f"{page}: pill + skip link + anchors clean")
    return ok


# ─── Main ──────────────────────────────────────────────────────────────────────
def main():
    args = [arg for arg in sys.argv[1:] if arg != STRICT_VISUALS_FLAG]
    base_dir = Path(args[0]) if args else Path(".")
    base_dir = base_dir.resolve()
    strict_visuals = STRICT_VISUALS_FLAG in sys.argv[1:]

    print(f"\n{'='*60}")
    print(f"{Colors.BOLD}  ROLY HOME SERVICES — SITE INTEGRITY AUDIT{Colors.END}")
    print(f"  Directory: {base_dir}")
    print(f"{'='*60}")

    results = []
    results.append(("File Existence", check_file_exists(base_dir)))
    results.append(("Vocabulary", check_prohibited_vocabulary(base_dir)))
    results.append(("External URLs", check_external_urls(base_dir)))
    results.append(("SEO Tags", check_seo_tags(base_dir)))
    results.append(("Brand Consistency", check_brand_consistency(base_dir)))
    results.append(("Forms & TCPA", check_forms(base_dir)))
    results.append(("Duplicate IDs", check_duplicate_ids(base_dir)))
    results.append(("Spanish Residue", check_spanish_residue(base_dir)))
    results.append(("Motion Stack", check_motion_stack(base_dir)))
    results.append(("Image Hygiene", check_image_hygiene(base_dir)))
    results.append(("Visual Asset Strategy", check_visual_asset_strategy(base_dir, strict_visuals)))
    results.append(("Social Meta", check_social_meta(base_dir)))
    results.append(("Structured Data", check_structured_data(base_dir)))
    results.append(("Legal Pages", check_legal_pages(base_dir)))
    results.append(("Conversion Elements", check_conversion_elements(base_dir)))

    print(f"\n{'='*60}")
    print(f"{Colors.BOLD}  SUMMARY{Colors.END}")
    print(f"{'='*60}")
    total_pass = sum(1 for _, ok in results if ok)
    total = len(results)
    for name, ok in results:
        status = f"{Colors.PASS}PASS{Colors.END}" if ok else f"{Colors.FAIL}FAIL{Colors.END}"
        print(f"  [{status}] {name}")

    print(f"\n  Result: {total_pass}/{total} categories passed")
    if total_pass == total:
        print(f"\n  {Colors.PASS}{Colors.BOLD}*** ALL CHECKS PASSED ***{Colors.END}")
    else:
        print(f"\n  {Colors.FAIL}{Colors.BOLD}!!! SOME CHECKS FAILED - Review above{Colors.END}")

    sys.exit(0 if total_pass == total else 1)


if __name__ == "__main__":
    main()
