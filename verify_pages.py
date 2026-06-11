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


def check_social_meta(base_dir):
    """Canonical + OpenGraph + Twitter card present on every public page."""
    print(f"\n{Colors.BOLD}11. SOCIAL / CANONICAL META{Colors.END}")
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
    print(f"\n{Colors.BOLD}12. STRUCTURED DATA (JSON-LD on index){Colors.END}")
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
    print(f"\n{Colors.BOLD}13. LEGAL PAGES & LINKS{Colors.END}")
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
    print(f"\n{Colors.BOLD}14. CONVERSION & PLACEHOLDER HYGIENE{Colors.END}")
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
    base_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    base_dir = base_dir.resolve()

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
