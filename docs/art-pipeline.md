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
| `aspect` | `16:9`, `1:1`, `3:4`, `4:1`… |
| `imageSize` | `2K` or `4K` for a bigger raw image (about $0.10 at 2K). Used by the backgrounds. |
| `reference` | Raw sheet ids passed as style reference images. |
| `category` | Output folder under `public/sprites/`. |
| `scale` | Source pixels per output pixel. Bigger = smaller sprites. |
| `resize` | Extra resample factor before slicing, for sizes between whole scales. |
| `cells` | Output names in reading order. |
| `merge` | Gap (output px) still counted as one object. Use 0 when objects sit close together, more for objects with floating bits (dragon hearts). |
| `join` | `[[a, b]]` glue preview objects `a` and `b` into one (broken fence pieces). |
| `bgTolerance` | Lower to strip pink glow left by the magenta background. Too low eats purples. |
| `trim` | `false` keeps the full frame (wizard bases, so they line up). |
| `grid` | `[rows, cols]` group pieces by grid cell; cuts touching frames apart (animation sheets). |
| `fit` | `{"cells": [i, ...], "height" or "width": px}` resize so those objects come out at that size. |
| `cellScale` | `{"name": scale}` gives one object its own scale, fractions allowed (crown, beanie). |
| `fillHoles` | Fill see-through pockets inside an object, like the inside of a hat brim. |
| `cropBottom` | Cut this fraction off the bottom of every sprite (mushroom stems). |
| `flip` | `[name, ...]` mirror these sprites. For characters the model drew facing the wrong way. |
| `squash` | `{name: {"band": [y0, y1], "factor": 0.5}}` squash those rows to lower the camera angle (see below). |
| `cutBottomOval` | `[wfrac, hfrac]` cut an outlined oval out of the bottom so a head shows through (mushroom caps use `[0.68, 0.16]`). |
| `kind: "background"` + `out` + `size` | Full-image backgrounds instead of sprite sheets. `size` is the output in pixels; the raw image is `size × scale`. |

### Lowering the camera angle

The room and the outdoor scenes are seen almost side-on. A sprite drawn from too high up shows a deep top face and looks tilted, or seems to float above the ground line. `squash` (in `tools/art/squash.py`) fixes most of these without new art:

- `band` is the rows of the top face, in sprite pixels. Only those rows shrink; legs and wheels below keep their shape.
- `factor` is the band's new height (0.5 = half).
- `riderTop` keeps everything above that row at full height and sets it back down on the surface (the desk's quill).
- `riders: true` also lifts anything that is not wood-colored out of the band first (the potion bottles).

Find the rows by opening the sprite zoomed in. If a squash looks muddy, redraw the object instead, as was done for the armchair and bed.

## Backgrounds

- `bg-tower` (the room) is a 4:1 panorama at 2K (4128 × 1024). Its art pixels are about 4 raw pixels, the same density as the sprites, and it is exported at half size (2064 × 512), two pixels per room pixel. The first try had a shallow floor; the kept one is an edit of it asking for a floor that fills the bottom quarter. If you regenerate it, check `FLOOR_TOP`, the posts, door and fireplace against `content/world/room.ts`.
- `bg-map` is 16:9 at 2K, exported at 1376 × 768. After regenerating it, re-plot `MAP_TRAIL` in `content/world/mapPath.ts` (map units are half the image size).
- Backgrounds keep 192 to 256 colors. With fewer, small color areas (the purple tower roof) turned grey.

## Animations

Creatures and pets are animated with frames generated as edits of their existing art.

1. Build a reference from the current sprites: `python3 tools/art/make_ref.py ref-<name> <sprite> <sprite> ...` (sprites side by side, 4x, on magenta).
2. Write an `anim-<name>` sheet that passes that reference and asks for a grid of frames ("same design, same size, facing left").
3. Slice with `grid` (pieces are grouped by grid cell, so floating hearts and smoke stay with their frame, and touching frames are cut apart) and `fit` (scale so the first frames match the old sprite's height).

| Sheets | Layout | Frames |
| --- | --- | --- |
| `anim-<creature>` | 2 rows × 3 | `<c>-grumpy`, `-2`, `-3`, then `<c>-happy`, `-2`, `-3` |
| `anim-pet-<species>` | 4 rows × 4 (plain, scarf, hat, flowers) | sitting `<p>-<outfit>`, then `-walk-1..3` |

The first frame of each row replaces the old still sprite, so every frame in a set matches. The code side lives in `src/content/world/animations.ts`: creature idle loops play 1-2-3-2; kittens and foxes walk, bunnies and frogs hop, owls and baby dragons fly (the game also bobs flyers up and down).

## The wizard

- `wizard-base` was generated first (using `villagers-a` as the style reference, for kid proportions instead of chibi), then each `wizard-hair-*` sheet edited that image ("same character, same pose, change only the hair"). The poses line up, so one set of anchors (head, hand, feet) in `src/render/wizard.ts` works for all of them.
- Bases are sliced with `scale: 8` and `resize: 0.75` into a 96 px frame; the kid is about 84 px tall, a little shorter than the villagers.
- Bases use key colors: bright green hair, peach skin, light grey robe. `python3 tools/art/wizard_roles.py` writes a mask next to each base (`base-<hair>-roles.png`: red skin, green hair, blue robe), and the game recolors only masked pixels. That's how skin tone, hair color and robes work without extra art. Re-run it after re-slicing the bases and check the masks by eye: eye whites, boots, the belt and outlines should stay unmarked.
- Hats sit at the head anchor; `hatOffset` on a hat item nudges it down. Hair above the brim is erased so it can't poke through.

## Budget log

The key has a $10 monthly limit.

| Date | Spent | What |
| --- | --- | --- |
| 2026-11-11 | ~$0.20 | Bed redrawn from a lower angle (3 tries). |
| 2026-11-10 | ~$0.37 | High-res map, wide room (2 tries), armchair redrawn from a lower angle. |
| 2026-11-08 | ~$1.05 | Animations: 9 creature idle sheets, 6 pet sit/move sheets (owl and dragon redone as flying). |
| 2026-11-08 | ~$1.14 | Second pass: 5 candidate wizard bases (try 3 kept) + 6 new hair edits, wide windows (2 tries), plants, knick-knacks, decor color variants, stemless mushroom hats. |
| 2026-11-08 | ~$2.32 | Initial set: 29 sheets (hats, wands, 3 pet sheets, 2 furniture, 2 decor, rugs, fixtures, clutter, 2 creature sheets, dragon, village, villagers, 2 prop sheets, UI icons, tower and map backgrounds, wizard base + 6 hair styles). furniture-a was generated twice. Includes model tests. |

## Known art issues

- `village/lantern` has no "lit" sprite; the glow is drawn in code.
- The first window sheet also had stained-glass and flower-box styles, but it was regenerated wider and those are gone. Generate a `windows-b` sheet to add more styles.
- The hats sheet's mushroom (with stem) is skipped; mushroom hats come from `hats-b`.
- The mushroom lamp in `decor-a` kept a pink halo and is not exported.
- `furniture-c` holds the armchair redrawn from a lower camera angle (`ref-armchair` is its reference). The `furniture-a` armchair cell is skipped.
- The broken plate is exported at half size (`cellScale`).
- `furniture-d` holds the bed redrawn from the foot end at eye level (`ref-bed` is its reference). A side view was tried and looked out of perspective with the floor. The `furniture-a` bed cell is skipped.
- The round table, writing desk, potion table, wagons and flower beds were drawn from a high angle and are flattened with `squash`.
- The model drew most villagers facing right. All but the farmer (who faces front) are mirrored with `flip`.
- Windows are sliced with `resize: 1.2` (about 2.5 raw pixels per sprite pixel). Their art pixels are about 3 raw pixels, so going bigger would start to show.
