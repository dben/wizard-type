# Architecture

## Stack

| Choice | Why |
| --- | --- |
| Vite + TypeScript | Fast dev server, static build that GitHub Pages can host. |
| Preact | React-style components at 4 kB. Screens are simple; no router or state library needed. |
| Canvas 2D for the lesson scene | Particles, scrolling and sprite animation at 60 fps. |
| DOM for everything else | Menus, the room editor (drag and drop) and the keyboard (SVG) are easier and more accessible as DOM. |
| Vitest | Same config as Vite; tests run in Node. |
| localStorage | No accounts or servers. Save codes move a wizard between devices. |
| Synthesized sound (Web Audio) | No audio files to download or license. |

## Folders and data flow

```
src/content  (data)  ──►  src/game  (pure rules)  ──►  src/ui + src/render  (screens, canvas)
                                     ▲                         │
                                     └──── src/app/store ◄─────┘   (save file, current screen)
```

- **content** is plain typed data: chapters/lessons, items, words, sentence templates, world layout.
- **game** holds the rules as pure functions over that data:
  - `spell.ts`: one prompt's typing state machine (poof mode / fix mode, potency).
  - `generator.ts`: turns lesson recipes into prompts using only learned keys, with a seeded RNG so every run differs.
  - `scoring.ts`: accuracy, WPM, stars, gold payout.
  - `progress.ts`: lesson unlocking, finishing a lesson (gold, gifts, room placement), shop state, buying, equipping.
  - `save.ts`: profiles, localStorage, save codes.
  - `keyboard.ts`: US QWERTY layout with finger assignments and which Shift to use.
- **app/store.ts** keeps the save and current screen in a tiny observable; screens call `update(fn)` with a pure function from `game/`.
- **render**:
  - `scene.ts`: the lesson scene. The lesson screen sends it events (`keySparkle`, `oops`, `poof`, `cast`, `celebrate`); it never decides rules.
  - `wizard.ts`: builds the wizard from a base sprite per hair style. The bases are drawn with key colors (green hair, peach skin, grey robe); pixels are classified by color and snapped to a 5-step shade ramp of the chosen skin, hair or robe color (flat steps keep the pixel art clean; smooth tinting looked blotchy). Robe patterns and hem trim are stamped onto robe pixels. Then the hat goes on: hair above the brim and outside the hat's outline is erased (per column, only above the hat's lowest pixel), and the hat is drawn at the head anchor.
  - `wand.ts`: finds where each wand is held by measuring its pixels (grip point and, for the feather, its lean), so every wand sits in the hand and the sparks leave from the real tip. Used by `scene.ts` and `portrait.ts`.
  - `portrait.ts`: cached data-URL portraits for menus.

## Scene layout

- Logical size 480 × 200, drawn at 2× into the canvas and scaled with CSS (`image-rendering: pixelated`).
- Indoor (tower): painted background (see Room geometry), the chosen window, the kid's own room decorations, other lessons' mess greyed out, and this lesson's targets standing where its mess is in the room (`clutterFor()` in `content/world/room.ts`).
- Outdoor: sky gradient, two procedural hill lines, hazy far props (parallax 0.55), ground strip, near props. Targets are spaced 240 px apart and the camera pans to the next one when a target is done, so the wizard appears to walk.
- Spells are shared evenly across a lesson's targets. Battles have a single target with a heart meter.

## Room geometry

The tower is an octagon seen from inside: a flat back wall facing the player, two angled walls on each side, and a trapezoid floor that widens toward the player. `src/content/world/room.ts` holds the numbers in room pixels (480 × 270): `BACK_WALL`, `FLOOR_TOP`, and `floorSpan(y)` for the floor's left and right edge at any depth. `content.test.ts` checks that wall mess sits on the back wall, floor mess and gifts sit on the floor, and the window fits.

`backgrounds/tower.png` is 960 × 540, twice the room size, so the walls carry fine detail while sprites stay chunky. The scene draws it at room size; the room screen scales it with smooth filtering (`.smooth`). The lesson scene shows the bottom 200 rows of the room (`ROOM_SHIFT`), so the beams are cut off there.

If the background is regenerated, re-measure the back wall and floor corners (overlay a polygon on the sliced PNG) and update `room.ts`.

## World map

`backgrounds/map.png` is 1376 × 768 and scales smoothly. Lesson nodes sit on `MAP_TRAIL` in `content/world/mapPath.ts`, a polyline traced by eye over the painted path; re-trace it when the map is regenerated. Stars on the map and in results are SVG shapes (`StarShape` in `ui/components/bits.tsx`) with a fixed black border, not sprites.

## Sizes and pixel scale

All sprites are drawn 1:1 in scene pixels. Sizes were tuned by re-slicing at different `scale` values in `art/sheets/*.json`:

| Thing | Approx. size (px) |
| --- | --- |
| Wizard (frame) | 96 × 96 (the kid is 84 tall), plus 40 px above for hats |
| Hats | about 50 wide |
| Big window | about 100 × 60 |
| Pets | 40 tall |
| Furniture | 40 to 80 tall |
| Little decor | 25 to 35 |
| Villagers | 90 tall |
| Dragon | 160 × 150 |

## Testing

- `src/game/*.test.ts`: typing, scoring, progress, saves.
- `src/content/content.test.ts`: validates all content. For each lesson it generates 30 runs and checks every prompt only uses keys learned so far, that new keys get practiced, that runs differ, and that every sprite file exists.
- Visual checks are manual: run `npm run dev` and play.

## Animation

- `content/world/animations.ts` lists frames by naming convention: creature idle loops (`IDLE`, keyed by the still sprite) and pet motion (`petMotion()`: sitting sprite plus move frames, and whether the species walks, hops or flies).
- The lesson scene swaps in the idle frame for any target that has one, and the pet sits while the wizard casts and moves along when the wizard walks.
- In the room, `RoomPet` runs a small loop: sit for 3 to 8 seconds, pick a spot on the floor, travel there (flipped when going left), sit again. Tapping it makes it hop. Clutter creatures and the lesson intro picture use `useIdleFrame()`.
- Frames of one animation can differ by a few pixels in size; everything is drawn from the bottom-center, so the feet stay put.

## Keyboard and hands

- `ui/components/Keyboard.tsx` draws the keyboard as SVG in key units (one letter key = 1 unit). Learned keys are white, unlearned keys dim, and only the key(s) to press are colored by finger.
- `ui/components/Hands.tsx` draws see-through hands in the same units: a rounded palm path and one capsule per finger from knuckle to fingertip. The reaching finger moves to its key and the whole hand leans 30% of the way. Outlines are drawn first and fills second so palm and fingers merge.
