"""Lower the camera angle of a sprite by squashing a band of rows.

Sprites drawn from too high up show a deep top face (a table top, the inside
of a wagon). Squashing just those rows flattens the top face and leaves legs,
wheels and everything below untouched.

Used by slice.py through the "squash" spec field:
    "squash": {"<cell name>": {"band": [y0, y1], "factor": 0.5, "riders": true}}

    band     rows (output px, top is 0) to squash
    factor   new height of the band as a fraction of the old one
    riders   true when things stand on the surface (bottles). They are cut out
             by color (anything that is not wood), kept at full height and
             moved down so they still stand on the squashed surface.
    riderTop rows above this count as riders whatever their color (corks, a
             quill). Works without "riders" too.
"""
import colorsys
from collections import deque

import numpy as np
from PIL import Image

OUTLINE_LUMA = 70


def _luma(rgb):
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def squash_rows(a: np.ndarray, y0: int, y1: int, factor: float) -> np.ndarray:
    """Squash rows y0..y1 of an RGBA array. Dark outline pixels win, so thin lines survive."""
    band = a[y0:y1]
    n = max(1, round(len(band) * factor))
    edges = np.linspace(0, len(band), n + 1)
    rows = []
    for i in range(n):
        lo, hi = int(np.floor(edges[i])), max(int(np.floor(edges[i])) + 1, int(np.ceil(edges[i + 1])))
        group = band[lo:hi]
        row = group[len(group) // 2].copy()
        dark = (group[..., 3] > 0) & (_luma(group[..., :3].astype(float)) < OUTLINE_LUMA)
        for x in np.nonzero(dark.any(axis=0))[0]:
            row[x] = group[np.nonzero(dark[:, x])[0][0], x]
        rows.append(row)
    return np.concatenate([a[:y0], np.array(rows), a[y1:]])


def _is_wood(px) -> bool:
    r, g, b = (int(v) / 255 for v in px[:3])
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return v < 0.3 or (0.03 <= h <= 0.12 and s > 0.3)


def _components(mask):
    seen = np.zeros_like(mask)
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        part = np.zeros_like(mask)
        q = deque([(y, x)])
        seen[y, x] = True
        while q:
            cy, cx = q.popleft()
            part[cy, cx] = True
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        yield part


def squash(im: Image.Image, band, factor: float, riders: bool = False, riderTop: int = 0) -> Image.Image:
    a = np.array(im.convert("RGBA"))
    y0, y1 = band
    cut = (y1 - y0) - max(1, round((y1 - y0) * factor))
    pieces = []
    if riders or riderTop:
        h, w = a.shape[:2]
        opaque = a[..., 3] > 0
        mask = np.zeros((h, w), bool)
        for y in range(min(y1, h)):
            for x in range(w):
                if opaque[y, x] and (y < riderTop or (riders and not _is_wood(a[y, x]))):
                    mask[y, x] = True
        grown = mask.copy()  # take the dark outline around each rider with it
        dark = opaque & (_luma(a[..., :3].astype(float)) < OUTLINE_LUMA)
        grown[1:] |= mask[:-1] & dark[1:]; grown[:-1] |= mask[1:] & dark[:-1]
        grown[:, 1:] |= mask[:, :-1] & dark[:, 1:]; grown[:, :-1] |= mask[:, 1:] & dark[:, :-1]
        for part in _components(grown):
            if part.sum() < 20:
                continue
            ys, xs = np.nonzero(part)
            base = ys.max()
            # how far the spot under this rider moves down when the band shrinks
            shift = cut if base < y0 else cut - round((base - y0) * (1 - factor)) if base < y1 else 0
            pieces.append((part, a.copy(), shift))
            # patch the hole with the surface color beside it
            for y in np.unique(ys):
                row = np.nonzero(part[y])[0]
                solid = np.nonzero(opaque[y] & ~grown[y])[0]
                if len(solid):
                    for x in row:
                        a[y, x] = a[y, solid[np.argmin(np.abs(solid - x))]]
                else:
                    a[y, row, 3] = 0
    out = squash_rows(a, y0, y1, factor)
    # the band lost rows; riders above it land lower in the old frame, so shift relative to the new one
    for part, src, shift in pieces:
        ys, xs = np.nonzero(part)
        ny = ys + shift - cut
        ok = ny >= 0
        out[ny[ok], xs[ok]] = src[ys[ok], xs[ok]]
    res = Image.fromarray(out, "RGBA")
    return res.crop(res.getbbox())


if __name__ == "__main__":
    import json, sys
    src, dst, cfg = sys.argv[1:4]
    squash(Image.open(src), **json.loads(cfg)).save(dst)
