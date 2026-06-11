"""Convert site image assets to WebP and build the social share cover.

Source PNGs stay on disk as originals; HTML/CSS/JS reference the .webp output.
Run from the project root:  python optimize_images.py
"""

import os
import sys

from PIL import Image

ASSETS = [
    "hero_craftsman_atlanta.png",
    "before_paint.png",
    "after_paint.png",
    "drywall_repair.png",
    "interior_painting_prep.png",
    "cabinet_spraying.png",
    "community_support.png",
    "real_estate_partner.png",
    "roly_owner.png",
    "pressure_washing.png",
    "color_navy_cream.png",
    "color_sage_charcoal.png",
    "color_white_bronze.png",
]

MAX_WIDTH = 1600
WEBP_QUALITY = 82

OG_SOURCE = "hero_craftsman_atlanta.png"
OG_OUTPUT = "og_cover.jpg"
OG_SIZE = (1200, 630)


def convert_to_webp(base_dir: str) -> bool:
    ok = True
    total_before = total_after = 0
    print(f"{'asset':<34}{'in':>9}{'out':>9}{'saved':>8}  dimensions")
    for name in ASSETS:
        src = os.path.join(base_dir, name)
        if not os.path.exists(src):
            print(f"{name:<34}  MISSING")
            ok = False
            continue
        dst = os.path.splitext(src)[0] + ".webp"
        img = Image.open(src).convert("RGB")
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            img = img.resize((MAX_WIDTH, round(img.height * ratio)), Image.LANCZOS)
        img.save(dst, "WEBP", quality=WEBP_QUALITY, method=6)
        size_in = os.path.getsize(src)
        size_out = os.path.getsize(dst)
        total_before += size_in
        total_after += size_out
        saved = 100 * (1 - size_out / size_in)
        print(f"{name:<34}{size_in // 1024:>7}KB{size_out // 1024:>7}KB{saved:>7.1f}%  {img.width}x{img.height}")
    print("-" * 78)
    print(f"{'TOTAL':<34}{total_before // 1024:>7}KB{total_after // 1024:>7}KB"
          f"{100 * (1 - total_after / max(total_before, 1)):>7.1f}%")
    return ok


def build_og_cover(base_dir: str) -> bool:
    src = os.path.join(base_dir, OG_SOURCE)
    if not os.path.exists(src):
        print(f"OG source missing: {OG_SOURCE}")
        return False
    img = Image.open(src).convert("RGB")
    target_w, target_h = OG_SIZE
    scale = max(target_w / img.width, target_h / img.height)
    resized = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    cover = resized.crop((left, top, left + target_w, top + target_h))
    out = os.path.join(base_dir, OG_OUTPUT)
    cover.save(out, "JPEG", quality=85, optimize=True)
    print(f"{OG_OUTPUT}: {OG_SIZE[0]}x{OG_SIZE[1]} ({os.path.getsize(out) // 1024}KB)")
    return True


if __name__ == "__main__":
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    success = convert_to_webp(base)
    success &= build_og_cover(base)
    sys.exit(0 if success else 1)
