#!/usr/bin/env python3
"""
check_i18n.py — i18n coverage & integrity audit
================================================
For every page:
  1. every data-i18n / data-i18n-html key and every key referenced in
     data-i18n-attr must exist in i18n/es/common.js + i18n/es/<page>.js;
  2. the HTML must still parse (no broken tags from the tagging pass);
  3. no Spanish sneaks into the HTML itself (mirrors verify_pages.py #8).

Usage:
    python3 check_i18n.py           # all pages
    python3 check_i18n.py contact   # single page
"""

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

PAGES = [
    "index", "services", "painting", "presale", "renovations", "partners",
    "gallery", "reviews", "about", "contact", "community", "lp-painting",
    "privacy", "terms", "vsl", "404",
]

KEY_RE = re.compile(r'"((?:[\w-]+\.)+[\w-]+)"\s*:')


def dict_keys(path: Path) -> set:
    if not path.exists():
        return set()
    return set(KEY_RE.findall(path.read_text(encoding="utf-8")))


class Checker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.keys = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if value is None:
                continue
            if name in ("data-i18n", "data-i18n-html"):
                self.keys.append(value)
            elif name == "data-i18n-attr":
                for chunk in value.split(";"):
                    if ":" in chunk:
                        self.keys.append(chunk.split(":", 1)[1].strip())


def main() -> int:
    only = sys.argv[1].replace(".html", "") if len(sys.argv) > 1 else None
    common = dict_keys(Path("i18n/es/common.js")) | dict_keys(Path("i18n/es/app-strings.js"))
    failed = False

    for page in PAGES:
        if only and page != only:
            continue
        html_path = Path(f"{page}.html")
        if not html_path.exists():
            continue
        src = html_path.read_text(encoding="utf-8")

        parser = Checker()
        try:
            parser.feed(src)
            parser.close()
        except Exception as exc:  # noqa: BLE001
            print(f"[XX] {page}.html: HTML parse error: {exc}")
            failed = True
            continue

        available = common | dict_keys(Path(f"i18n/es/{page}.js"))
        missing = sorted(set(k for k in parser.keys if k not in available))
        dupes = sorted({k for k in parser.keys if parser.keys.count(k) > 1
                        and not k.startswith("common.")})

        spanish = re.findall(r"Paso \d|diagnóstico|lijado|sellado|acabado premium",
                             src, re.IGNORECASE)

        status = "OK "
        notes = [f"{len(parser.keys)} keys tagged"]
        if missing:
            status, failed = "XX ", True
            notes.append(f"MISSING in dict: {missing[:8]}{'...' if len(missing) > 8 else ''}")
        if spanish:
            status, failed = "XX ", True
            notes.append(f"Spanish residue in HTML: {spanish[:5]}")
        if dupes:
            notes.append(f"note: duplicated page keys {dupes[:5]}")
        print(f"[{status}] {page}.html: {'; '.join(notes)}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
