"""Write a role mask for each wizard base sprite.

Usage:
    python3 tools/art/wizard_roles.py

For public/sprites/wizard/base-<hair>.png writes base-<hair>-roles.png:
red = skin, green = hair, blue = robe, transparent = keep as drawn
(outlines, eyes, eye whites, mouth, boots, belt). The game recolors only the
marked pixels, so the masks can be checked by eye instead of trusting color
guesses at runtime. Re-run after re-slicing the wizard bases.
"""
import colorsys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "public" / "sprites" / "wizard"

NECK_Y = 37   # robe starts below this line; light greys above it are eye whites
BOOTS_Y = 82  # nothing below this is skin


def role(r: int, g: int, b: int, y: int) -> str | None:
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    h *= 360
    if 75 <= h <= 170 and s >= 0.35 and l >= 0.08:
        return "hair"
    if 75 <= h <= 170 and s >= 0.1:
        return "greenish"  # decided by its neighbors below
    if (h <= 40 or h >= 350) and s >= 0.12 and 0.35 <= l <= 0.92 and y < BOOTS_Y:
        return "skin"
    cool_grey = s <= 0.14 and 180 <= h <= 260 and l >= 0.2
    warm_light_grey = s <= 0.14 and l >= 0.6
    if y >= NECK_Y and (cool_grey or warm_light_grey):
        return "robe"
    return None


def main() -> None:
    color = {"skin": (255, 0, 0, 255), "hair": (0, 255, 0, 255), "robe": (0, 0, 255, 255)}
    for f in sorted(DIR.glob("base-*.png")):
        if f.stem.endswith("-roles"):
            continue
        a = np.array(Image.open(f).convert("RGBA"))
        h, w = a.shape[:2]
        roles = [[None] * w for _ in range(h)]
        for y in range(h):
            for x in range(w):
                r, g, b, al = (int(v) for v in a[y, x])
                if al:
                    roles[y][x] = role(r, g, b, y)
        # Dull green pixels are hair shading when they touch hair, otherwise robe outline drift.
        for _ in range(3):
            for y in range(h):
                for x in range(w):
                    if roles[y][x] != "greenish":
                        continue
                    near = [roles[j][i] for j in range(max(0, y - 1), min(h, y + 2)) for i in range(max(0, x - 1), min(w, x + 2))]
                    if "hair" in near:
                        roles[y][x] = "hair"
        # Tiny specks of "skin" are outline color drift, not skin.
        seen = set()
        for y in range(h):
            for x in range(w):
                if roles[y][x] != "skin" or (y, x) in seen:
                    continue
                blob, stack = [], [(y, x)]
                seen.add((y, x))
                while stack:
                    cy, cx = stack.pop()
                    blob.append((cy, cx))
                    for j in (-1, 0, 1):
                        for i in (-1, 0, 1):
                            ny, nx = cy + j, cx + i
                            if 0 <= ny < h and 0 <= nx < w and (ny, nx) not in seen and roles[ny][nx] == "skin":
                                seen.add((ny, nx))
                                stack.append((ny, nx))
                if len(blob) < 5:
                    for cy, cx in blob:
                        roles[cy][cx] = None
        out = np.zeros_like(a)
        for y in range(h):
            for x in range(w):
                k = roles[y][x]
                if k == "greenish":
                    k = "robe" if y >= NECK_Y else None
                if k:
                    out[y, x] = color[k]
        Image.fromarray(out, "RGBA").save(DIR / f"{f.stem}-roles.png", optimize=True)
        print(f"{f.stem}-roles.png")


if __name__ == "__main__":
    main()
