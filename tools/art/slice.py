"""Turn a raw sheet into game-ready pixel sprites.

Usage:
    python3 tools/art/slice.py <sheet-id> [...]     # export sprites named in "cells"
    python3 tools/art/slice.py <sheet-id> --preview # numbered contact sheet only

Reads   art/raw/<sheet-id>.webp and art/sheets/<sheet-id>.json
Writes  public/sprites/<category>/<id>.png
        art/preview/<sheet-id>.png (numbered boxes, for writing the "cells" list)

Sheet spec fields used here:
    kind      "sheet" (default) or "background"
    scale     source pixels per output pixel (AI pixel art is usually ~4-6)
    category  output folder under public/sprites
    cells     ids in reading order (left->right, top->bottom); null skips a cell
    merge     gap in output pixels that still counts as one object (default 2)
    minSize   drop objects smaller than this many output pixels across (default 6)
    colors    max colors per sprite after cleanup (default 32)
    resize    resample the raw image by this factor first (fine-tunes output size)
    bgTolerance  lower (e.g. 60) also strips pink glow left from the magenta background
    join      [[a, b, ...]] preview indices to glue into one object (numbering before the join)
    trim      false keeps the whole frame instead of cropping (for layered sprites)
Background-only fields:
    out       output path under public/sprites, e.g. "backgrounds/tower.png"
    crop      [x, y, w, h] in source pixels before scaling
    size      [w, h] final size in pixels
"""
import json
import sys
import warnings
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SPRITES = ROOT / "public" / "sprites"


def background_mask(rgb: np.ndarray, tolerance: int = 90) -> np.ndarray:
    """Magenta and magenta-tinted fringe pixels. Lower tolerance removes more pink glow."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    return (np.minimum(r, b) - g > tolerance) & (np.abs(r - b) < 90)


def downscale(rgb: np.ndarray, fg: np.ndarray, s: int):
    h, w = (rgb.shape[0] // s) * s, (rgb.shape[1] // s) * s
    rgb, fg = rgb[:h, :w].astype(float), fg[:h, :w]
    blocks = rgb.reshape(h // s, s, w // s, s, 3).transpose(0, 2, 1, 3, 4).reshape(h // s, w // s, s * s, 3)
    fgb = fg.reshape(h // s, s, w // s, s).transpose(0, 2, 1, 3).reshape(h // s, w // s, s * s)
    alpha = fgb.mean(axis=2) >= 0.5
    masked = np.where(fgb[..., None], blocks, np.nan)
    with np.errstate(all="ignore"), warnings.catch_warnings():
        warnings.simplefilter("ignore")
        color = np.nanmedian(masked, axis=2)
    color = np.nan_to_num(color).clip(0, 255).astype(np.uint8)
    return color, alpha


def dilate(mask: np.ndarray, n: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(n):
        m = out.copy()
        m[1:] |= out[:-1]; m[:-1] |= out[1:]; m[:, 1:] |= out[:, :-1]; m[:, :-1] |= out[:, 1:]
        out = m
    return out


def components(mask: np.ndarray):
    labels = np.zeros(mask.shape, int)
    count = 0
    for y, x in zip(*np.nonzero(mask)):
        if labels[y, x]:
            continue
        count += 1
        labels[y, x] = count
        q = deque([(y, x)])
        while q:
            cy, cx = q.popleft()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not labels[ny, nx]:
                        labels[ny, nx] = count
                        q.append((ny, nx))
    return labels, count


def reading_order(boxes):
    """Sort (y0, x0, y1, x1) boxes into rows, then left to right."""
    boxes = sorted(boxes, key=lambda b: (b[0] + b[2]) / 2)
    rows, current = [], []
    for b in boxes:
        cy = (b[0] + b[2]) / 2
        if current:
            ref = np.mean([(c[0] + c[2]) / 2 for c in current])
            tol = np.median([c[2] - c[0] for c in current]) * 0.5
            if abs(cy - ref) > tol:
                rows.append(current)
                current = []
        current.append(b)
    if current:
        rows.append(current)
    return [b for row in rows for b in sorted(row, key=lambda b: b[1])]


def clean_sprite(rgb: np.ndarray, alpha: np.ndarray, colors: int) -> Image.Image:
    rgba = np.dstack([rgb, np.where(alpha, 255, 0).astype(np.uint8)])
    im = Image.fromarray(rgba, "RGBA")
    if colors:
        q = im.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        rgbq = np.array(q.convert("RGB"))
        im = Image.fromarray(np.dstack([rgbq, rgba[..., 3]]), "RGBA")
    return im


def slice_sheet(sheet_id: str, preview_only: bool) -> None:
    spec = json.loads((ROOT / "art" / "sheets" / f"{sheet_id}.json").read_text())
    src = np.array(Image.open(ROOT / "art" / "raw" / f"{sheet_id}.webp").convert("RGB"))
    s = spec.get("scale", 4)

    if spec.get("kind") == "background":
        if spec.get("crop"):
            x, y, w, h = spec["crop"]
            src = src[y:y + h, x:x + w]
        if spec.get("size"):
            w, h = spec["size"]
            src = np.array(Image.fromarray(src).resize((w * s, h * s), Image.LANCZOS))
        color, _ = downscale(src, np.ones(src.shape[:2], bool), s)
        im = clean_sprite(color, np.ones(color.shape[:2], bool), spec.get("colors", 64))
        out = SPRITES / spec["out"]
        out.parent.mkdir(parents=True, exist_ok=True)
        im.convert("RGB").save(out, optimize=True)
        print(f"{sheet_id}: background {im.size} -> {out.relative_to(ROOT)}")
        return

    if spec.get("resize"):
        f = spec["resize"]
        src = np.array(Image.fromarray(src).resize((round(src.shape[1] * f), round(src.shape[0] * f)), Image.LANCZOS))
    fg = ~background_mask(src, spec.get("bgTolerance", 90))
    color, alpha = downscale(src, fg, s)
    labels, n = components(dilate(alpha, spec.get("merge", 2)))
    min_size = spec.get("minSize", 6)
    boxes = []
    for i in range(1, n + 1):
        ys, xs = np.nonzero((labels == i) & alpha)
        if len(ys) and max(ys.max() - ys.min(), xs.max() - xs.min()) + 1 >= min_size:
            boxes.append((ys.min(), xs.min(), ys.max() + 1, xs.max() + 1, i))
    boxes = reading_order(boxes)
    for group in spec.get("join", []):  # glue multi-piece objects (preview numbering)
        first = group[0]
        for k in group[1:]:
            labels[labels == boxes[k][4]] = boxes[first][4]
        ys, xs = [np.concatenate(v) for v in zip(*[(np.array([boxes[k][0], boxes[k][2] - 1]), np.array([boxes[k][1], boxes[k][3] - 1])) for k in group])]
        boxes[first] = (ys.min(), xs.min(), ys.max() + 1, xs.max() + 1, boxes[first][4])
    drop = {k for group in spec.get("join", []) for k in group[1:]}
    boxes = [b for k, b in enumerate(boxes) if k not in drop]

    prev = Image.fromarray(np.dstack([color, np.where(alpha, 255, 60).astype(np.uint8)]), "RGBA")
    prev = prev.resize((prev.width * 3, prev.height * 3), Image.NEAREST)
    draw = ImageDraw.Draw(prev)
    for k, (y0, x0, y1, x1, _) in enumerate(boxes):
        draw.rectangle([x0 * 3, y0 * 3, x1 * 3, y1 * 3], outline=(0, 255, 255, 255))
        draw.text((x0 * 3 + 2, y0 * 3 + 1), str(k), fill=(255, 255, 0, 255))
    prev.save(ROOT / "art" / "preview" / f"{sheet_id}.png")
    print(f"{sheet_id}: {len(boxes)} objects (preview in art/preview/{sheet_id}.png)")
    if preview_only:
        return

    cells = spec.get("cells", [])
    outdir = SPRITES / spec["category"]
    outdir.mkdir(parents=True, exist_ok=True)
    for k, (y0, x0, y1, x1, lab) in enumerate(boxes):
        if k >= len(cells) or not cells[k]:
            continue
        if spec.get("trim", True):
            a = alpha[y0:y1, x0:x1] & (labels[y0:y1, x0:x1] == lab)
            im = clean_sprite(color[y0:y1, x0:x1], a, spec.get("colors", 32))
        else:  # keep the full frame so layered sprites share coordinates
            im = clean_sprite(color, alpha & (labels == lab), spec.get("colors", 32))
        im.save(outdir / f"{cells[k]}.png", optimize=True)
        print(f"  {k:2d} -> {spec['category']}/{cells[k]}.png {im.size}")


if __name__ == "__main__":
    ids = [a for a in sys.argv[1:] if not a.startswith("--")]
    for sid in ids:
        slice_sheet(sid, "--preview" in sys.argv)
