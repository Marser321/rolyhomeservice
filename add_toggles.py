#!/usr/bin/env python3
"""
add_toggles.py — Wire the language (EN/ES) + theme (light/dark) toggles
========================================================================
Idempotent rollout helper. For every standard page it inserts:
  1. the anti-FOUC theme/lang bootstrap right after the viewport meta,
  2. the theme-color meta pair,
  3. the two toggle buttons at the top of <div class="header-actions">,
  4. the i18n dictionary + runtime script tags after the last local script.

vsl.html and 404.html have non-standard headers and are patched with
their own button insertion anchors below.

Usage: python3 add_toggles.py
"""

from pathlib import Path

PAGES = [
    "index.html", "services.html", "painting.html", "presale.html",
    "renovations.html", "partners.html", "gallery.html", "reviews.html",
    "about.html", "contact.html", "community.html", "lp-painting.html",
    "privacy.html", "terms.html", "vsl.html", "404.html",
]

VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'

HEAD_SNIPPET = """
    <script>
    (function () {
      try {
        var t = localStorage.getItem('roly-theme');
        if (t !== 'dark' && t !== 'light') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', t);
        var l = localStorage.getItem('roly-lang');
        if (l === 'es') document.documentElement.lang = 'es';
      } catch (e) { document.documentElement.setAttribute('data-theme', 'light'); }
    })();
    </script>
    <meta name="theme-color" content="#FBFAF7" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#0B1526" media="(prefers-color-scheme: dark)">"""

TOGGLE_BUTTONS = """
                <button type="button" class="header-toggle lang-toggle" aria-pressed="false" aria-label="Switch to Spanish" data-i18n-attr="aria-label:common.toggle.lang">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-width="2"/><path stroke-width="2" d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9z"/></svg>
                    <span class="lang-toggle-label">ES</span>
                </button>
                <button type="button" class="header-toggle theme-toggle" aria-pressed="false" aria-label="Toggle dark mode" data-i18n-attr="aria-label:common.toggle.theme">
                    <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke-width="2"/><path stroke-width="2" stroke-linecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>
                    <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-width="2" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
                </button>"""


def i18n_scripts(page_key: str) -> str:
    return (
        f'\n    <script defer src="i18n/es/common.js"></script>'
        f'\n    <script defer src="i18n/es/app-strings.js"></script>'
        f'\n    <script defer src="i18n/es/{page_key}.js"></script>'
        f'\n    <script defer src="i18n/i18n.js"></script>'
    )


def patch(page: str) -> None:
    path = Path(page)
    src = path.read_text(encoding="utf-8")
    page_key = page.replace(".html", "")

    changed = False

    if "roly-theme" not in src:
        assert src.count(VIEWPORT) == 1, f"{page}: viewport anchor not found"
        src = src.replace(VIEWPORT, VIEWPORT + HEAD_SNIPPET)
        changed = True

    if "i18n/i18n.js" not in src:
        anchors = ['<script defer src="house-3d.js"></script>',
                   '<script defer src="motion.js"></script>']
        for anchor in anchors:
            if anchor in src:
                src = src.replace(anchor, anchor + i18n_scripts(page_key))
                break
        else:
            # 404.html has no local scripts; hook before the icon link
            icon = '<link rel="icon"'
            src = src.replace(icon, i18n_scripts(page_key).lstrip("\n") + "\n    " + icon)
        changed = True

    if "lang-toggle" not in src:
        if '<div class="header-actions">' in src:
            src = src.replace('<div class="header-actions">',
                              '<div class="header-actions">' + TOGGLE_BUTTONS, 1)
        elif page == "vsl.html":
            # Keep the funnel phone link outside .header-actions so it stays
            # visible on mobile; the toggles get their own group.
            anchor = '<a href="tel:7707690008" class="phone-link" style="color: #FFFFFF;">'
            buttons = TOGGLE_BUTTONS.replace("\n" + " " * 16, "\n" + " " * 16)
            src = src.replace(anchor,
                              '<div class="header-actions">' + buttons
                              + "\n            </div>\n            " + anchor, 1)
        elif page == "404.html":
            anchor = '<main class="nf-wrap">'
            buttons = TOGGLE_BUTTONS.replace("\n" + " " * 16, "\n" + " " * 8)
            src = src.replace(anchor,
                              '<div class="header-actions nf-toggles">' + buttons
                              + "\n    </div>\n    " + anchor, 1)
        changed = True

    if changed:
        path.write_text(src, encoding="utf-8")
        print(f"patched  {page}")
    else:
        print(f"skipped  {page} (already wired)")


if __name__ == "__main__":
    for page in PAGES:
        patch(page)
