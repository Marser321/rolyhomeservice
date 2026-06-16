"""Build the site's visual library from the generated PNGs.

Reads docs/photo-audit-map.json (PNG -> slot assignments) and the format specs
in docs/visual-asset-manifest.json, then center-crops + resizes each source PNG
to its target format and writes the optimized .webp (or .jpg) to the exact path
the manifest/QA gate expects.

Source PNGs live in 'Fotos roly home/' and stay on disk (gitignored); the site
ships the .webp/.jpg outputs. Run from the project root:  python build_assets.py
"""

import glob
import json
import os
import sys

from PIL import Image

MANIFEST = os.path.join("docs", "visual-asset-manifest.json")
AUDIT_MAP = os.path.join("docs", "photo-audit-map.json")
WEBP_QUALITY = 82
JPEG_QUALITY = 85


def parse_px(spec):
    """'2400x1350' -> (2400, 1350)."""
    w, h = spec.lower().split("x")
    return int(w), int(h)


def resolve_source(source_dir, token):
    """Resolve a source PNG. If `token` names a file that exists in source_dir,
    use it verbatim (exact-filename mode); otherwise treat it as a unique
    timestamp substring and match by glob."""
    exact = os.path.join(source_dir, token)
    if os.path.isfile(exact):
        return exact
    matches = sorted(glob.glob(os.path.join(source_dir, f"*{token}*.png")))
    if not matches:
        raise FileNotFoundError(f"no source PNG matches token '{token}'")
    if len(matches) > 1:
        # Prefer an exact-ish match; otherwise report ambiguity.
        exact = [m for m in matches if token in os.path.basename(m)]
        if len(exact) != 1:
            raise ValueError(f"token '{token}' is ambiguous: {[os.path.basename(m) for m in matches]}")
        return exact[0]
    return matches[0]


def cover_resize(img, target_w, target_h):
    """Center-crop to the target aspect ratio, then resize to exact pixels."""
    scale = max(target_w / img.width, target_h / img.height)
    resized = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def write_image(src_path, dst_path, target_w, target_h, ideal_kb=0):
    img = Image.open(src_path).convert("RGB")
    out = cover_resize(img, target_w, target_h)
    os.makedirs(os.path.dirname(dst_path) or ".", exist_ok=True)
    if dst_path.lower().endswith((".jpg", ".jpeg")):
        out.save(dst_path, "JPEG", quality=JPEG_QUALITY, optimize=True)
        return os.path.getsize(dst_path)
    # WebP: step quality down until under the format's ideal size (floor 68).
    for quality in (WEBP_QUALITY, 78, 74, 70, 68):
        out.save(dst_path, "WEBP", quality=quality, method=6)
        size = os.path.getsize(dst_path)
        if not ideal_kb or size // 1024 <= ideal_kb or quality == 68:
            return size
    return os.path.getsize(dst_path)


def main(base_dir="."):
    manifest = json.load(open(os.path.join(base_dir, MANIFEST), encoding="utf-8"))
    audit = json.load(open(os.path.join(base_dir, AUDIT_MAP), encoding="utf-8"))
    formats = manifest["formats"]
    source_dir = os.path.join(base_dir, audit["source_dir"])

    jobs = []  # (target_rel, source_token, format_key)
    for s in audit["stills"]:
        jobs.append((s["target"], s["source"], s["format"]))
    for h in audit.get("hero_color_loop", []):
        jobs.append((h["target"], h["file"], h["format"]))
    for pair in audit["before_after"]:
        before = pair.get("before_file", pair["before"])
        after = pair.get("after_file", pair["after"])
        jobs.append((f"assets/before-after/{pair['id']}-before.webp", before, "story_process"))
        jobs.append((f"assets/before-after/{pair['id']}-after.webp", after, "story_process"))

    print(f"{'target':<54}{'fmt':<14}{'KB':>6}{'max':>6}  src")
    print("-" * 100)
    ok = True
    over = []
    for target_rel, token, fmt in jobs:
        try:
            src = resolve_source(source_dir, token)
        except (FileNotFoundError, ValueError) as exc:
            print(f"{target_rel:<54}{fmt:<14}  ERROR: {exc}")
            ok = False
            continue
        tw, th = parse_px(formats[fmt]["target_px"])
        dst = os.path.join(base_dir, target_rel)
        ideal = formats[fmt].get("ideal_max_kb", 0)
        kb = write_image(src, dst, tw, th, ideal) // 1024
        flag = "  OVER" if ideal and kb > ideal else ""
        if flag:
            over.append((target_rel, kb, ideal))
        print(f"{target_rel:<54}{fmt:<14}{kb:>6}{ideal:>6}{flag}  {token}")

    print("-" * 100)
    print(f"{len(jobs)} targets built")
    if over:
        print(f"\n{len(over)} over ideal size (consider lower quality / smaller px):")
        for t, kb, ideal in over:
            print(f"  {t}: {kb}KB > {ideal}KB")
    return ok


if __name__ == "__main__":
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(0 if main(base) else 1)
