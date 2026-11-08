"""Build a reference image for an edit from existing sprites.

Usage:
    python3 tools/art/make_ref.py <ref-id> <sprite> [<sprite> ...]

Writes art/raw/<ref-id>.webp: the sprites side by side, scaled up 4x with
crisp pixels, on the magenta background. Pass it as "reference" in a sheet
spec so the model keeps the same character design.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    ref_id, sprites = sys.argv[1], sys.argv[2:]
    ims = [Image.open(ROOT / "public" / "sprites" / f"{s}.png").convert("RGBA") for s in sprites]
    ims = [im.resize((im.width * 4, im.height * 4), Image.NEAREST) for im in ims]
    gap = 48
    w = sum(im.width for im in ims) + gap * (len(ims) + 1)
    h = max(im.height for im in ims) + gap * 2
    out = Image.new("RGBA", (w, h), (255, 0, 255, 255))
    x = gap
    for im in ims:
        out.alpha_composite(im, (x, h - gap - im.height))
        x += im.width + gap
    out.convert("RGB").save(ROOT / "art" / "raw" / f"{ref_id}.webp", "WEBP", lossless=True)
    print(f"art/raw/{ref_id}.webp {out.size}")


if __name__ == "__main__":
    main()
