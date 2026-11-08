# Art pipeline

All sprites are AI-generated pixel art, cleaned up by script so they share one look.

```
art/sheets/<id>.json  ──generate.py──►  art/raw/<id>.webp  ──slice.py──►  public/sprites/<category>/<name>.png
   (prompt + slicing)                    (lossless source)                  (game-ready, trimmed)
```

## Style

- Cozy, chunky pixel art with a thick dark outline, soft warm palette and simple shading.
- Every sheet after the first passes `hats-a` as a **style reference image**, so new art matches.
- Sheets are drawn on flat magenta (`#FF00FF`), which the slicer removes.
- Characters face **right** (wizard, pets). Creatures and villagers face **left**, toward the wizard.
- Broken/fixed and grumpy/happy pairs are generated side by side on one sheet so they match.

## Generating

```bash
python3 tools/art/generate.py <sheet-id>          # skips sheets that already have a raw file
python3 tools/art/generate.py <sheet-id> --force  # regenerate (costs money)
```

- Model: `google/gemini-3.1-flash-image` through OpenRouter (default in `generate.py`; set `"model"` in a spec to override). About $0.07 per sheet.
- `openai/gpt-image-2.6-sunburst` was tried first. It needs OpenRouter's `/images` endpoint and returned `502 upstream request failed` every time in November 2026. Worth retrying later.
- The OpenRouter key is injected by the cloud environment's proxy. Elsewhere, set `OPENROUTER_API_KEY`.
- Python needs `pillow` and `numpy` (`tools/art/requirements.txt`).

## Slicing

```bash
python3 tools/art/slice.py <sheet-id> --preview   # writes art/preview/<id>.png with numbered boxes
python3 tools/art/slice.py <sheet-id>             # exports every named cell
```

1. Generate the sheet.
2. Run `--preview` and open `art/preview/<id>.png`.
3. Fill `"cells"` in the spec with names in the numbered order (`null` skips one). The model often draws more or fewer objects than asked, or reorders them, so always check.
4. Export, then check sizes in the game.

What the slicer does: removes magenta and magenta-tinted fringe, shrinks by `scale` using a per-block median (keeps edges crisp), finds separate objects, sorts them in reading order, trims each one, and reduces it to at most 32 colors.

### Spec fields

| Field | Meaning |
| --- | --- |
| `prompt` | What to draw. A shared style line is added unless `"style": false`. |
| `aspect` | `16:9`, `1:1`, `3:4`… |
| `reference` | Raw sheet ids passed as style reference images. |
| `category` | Output folder under `public/sprites/`. |
| `scale` | Source pixels per output pixel. Bigger = smaller sprites. |
| `resize` | Extra resample factor before slicing, for sizes between whole scales. |
| `cells` | Output names in reading order. |
| `merge` | Gap (output px) still counted as one object. Use 0 when objects sit close together, more for objects with floating bits (dragon hearts). |
| `join` | `[[a, b]]` glue preview objects `a` and `b` into one (broken fence pieces). |
| `bgTolerance` | Lower to strip pink glow left by the magenta background. Too low eats purples. |
| `trim` | `false` keeps the full frame (wizard bases, so they line up). |
| `cellScale` | `{"name": scale}` gives one object its own scale, fractions allowed (crown, beanie). |
| `fillHoles` | Fill see-through pockets inside an object, like the inside of a hat brim. |
| `cropBottom` | Cut this fraction off the bottom of every sprite (mushroom stems). |
| `cutBottomOval` | `[wfrac, hfrac]` cut an outlined oval out of the bottom so a head shows through (mushroom caps use `[0.68, 0.16]`). |
| `kind: "background"` + `out` + `size` | Full-image backgrounds instead of sprite sheets. |

## The wizard

- `wizard-base` was generated first (using `villagers-a` as the style reference, for kid proportions instead of chibi), then each `wizard-hair-*` sheet edited that image ("same character, same pose, change only the hair"). The poses line up, so one set of anchors (head, hand, feet) in `src/render/wizard.ts` works for all of them.
- Bases are sliced with `scale: 8` and `resize: 0.75` into a 96 px frame; the kid is about 84 px tall, a little shorter than the villagers.
- Bases use key colors: bright green hair, peach skin, light grey robe. The game re-tints those pixels at runtime, which is how skin tone, hair color and robes work without extra art.
- Hats sit at the head anchor; `hatOffset` on a hat item nudges it down. Hair above the brim is erased so it can't poke through.

## Budget log

The key has a $10 monthly limit.

| Date | Spent | What |
| --- | --- | --- |
| 2026-11-08 | ~$1.14 | Second pass: 5 candidate wizard bases (try 3 kept) + 6 new hair edits, wide windows (2 tries), plants, knick-knacks, decor color variants, stemless mushroom hats. |
| 2026-11-08 | ~$2.32 | Initial set: 29 sheets (hats, wands, 3 pet sheets, 2 furniture, 2 decor, rugs, fixtures, clutter, 2 creature sheets, dragon, village, villagers, 2 prop sheets, UI icons, tower and map backgrounds, wizard base + 6 hair styles). furniture-a was generated twice. Includes model tests. |

## Known art issues

- `village/lantern` has no "lit" sprite; the glow is drawn in code.
- The first window sheet also had stained-glass and flower-box styles, but it was regenerated wider and those are gone. Generate a `windows-b` sheet to add more styles.
- The hats sheet's mushroom (with stem) is skipped; mushroom hats come from `hats-b`.
- The mushroom lamp in `decor-a` kept a pink halo and is not exported.
- The dragon on the map background is green; the battle dragon is red.
