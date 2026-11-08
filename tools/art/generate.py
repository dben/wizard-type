"""Generate a raw sprite sheet (or background) from a sheet spec via OpenRouter.

Usage:
    python3 tools/art/generate.py <sheet-id> [--force]

Reads   art/sheets/<sheet-id>.json
Writes  art/raw/<sheet-id>.webp   (lossless; the source of truth for slicing)

Spec fields used here:
    model        OpenRouter model id (default: DEFAULT_MODEL)
    prompt       What to draw. STYLE is prepended unless "style": false.
    aspect       Aspect ratio hint, e.g. "16:9", "1:1", "21:9".
    reference    Optional list of raw sheet ids passed as style reference images.

Auth: the OpenRouter key is injected by the environment's proxy. Set
OPENROUTER_API_KEY when running elsewhere.
"""
import base64
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SHEETS = ROOT / "art" / "sheets"
RAW = ROOT / "art" / "raw"
DEFAULT_MODEL = "google/gemini-3.1-flash-image"

STYLE = (
    "Cozy pixel art for a children's game. Chunky visible pixels, thick dark outline, "
    "soft warm cheerful palette, simple cel shading, cute and friendly. No text, no labels, "
    "no numbers, no drop shadows. "
)
SHEET_RULES = (
    "Every object is fully separate with plenty of empty space between objects, nothing touching "
    "or overlapping, nothing cut off at the edges. Flat solid pure magenta (#FF00FF) background "
    "everywhere, with no grid lines, no cell borders, no frames. "
)


def load_spec(sheet_id: str) -> dict:
    return json.loads((SHEETS / f"{sheet_id}.json").read_text())


def build_prompt(spec: dict) -> str:
    parts = []
    if spec.get("style", True):
        parts.append(STYLE)
    if spec.get("kind", "sheet") == "sheet":
        parts.append(SHEET_RULES)
    if spec.get("reference"):
        parts.append("Match the pixel size, outline and palette of the reference image exactly. ")
    parts.append(spec["prompt"])
    return "".join(parts)


def image_part(path: Path) -> dict:
    buf = io.BytesIO()
    Image.open(path).convert("RGB").save(buf, "PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}


def call(spec: dict) -> bytes:
    content = [{"type": "text", "text": build_prompt(spec)}]
    for ref in spec.get("reference", []):
        content.append(image_part(RAW / f"{ref}.webp"))
    body = {
        "model": spec.get("model", DEFAULT_MODEL),
        "messages": [{"role": "user", "content": content}],
        "modalities": ["image", "text"],
    }
    if spec.get("aspect"):
        body["image_config"] = {"aspect_ratio": spec["aspect"]}
    key = os.environ.get("OPENROUTER_API_KEY", "sk-or-proxy-injected")
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
    )
    try:
        res = json.load(urllib.request.urlopen(req, timeout=400))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code}: {e.read()[:500]!r}")
    images = res["choices"][0]["message"].get("images") or []
    if not images:
        raise SystemExit(f"No image returned: {res['choices'][0]['message'].get('content')!r}")
    cost = res.get("usage", {}).get("cost")
    print(f"  cost ${cost:.3f}" if cost else "  cost unknown")
    return base64.b64decode(images[0]["image_url"]["url"].split(",", 1)[1])


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    for sheet_id in args:
        out = RAW / f"{sheet_id}.webp"
        if out.exists() and not force:
            print(f"{sheet_id}: exists, skipping (use --force to regenerate)")
            continue
        spec = load_spec(sheet_id)
        print(f"{sheet_id}: generating with {spec.get('model', DEFAULT_MODEL)}")
        t = time.time()
        data = call(spec)
        Image.open(io.BytesIO(data)).convert("RGB").save(out, "WEBP", lossless=True)
        print(f"  saved {out.relative_to(ROOT)} in {time.time() - t:.0f}s")


if __name__ == "__main__":
    main()
