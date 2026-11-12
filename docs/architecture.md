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
  - `portrait.ts`: cached data-URL portraits for menus.

## Scene layout

- Logical size 480 × 200, drawn at 2× into the canvas and scaled with CSS (`image-rendering: pixelated`).
- Indoor (tower): the room is 1032 × 256, wider than the view, so the camera pans to each target and stops at the side walls. The view shows the bottom 200 rows. Painted background, the chosen window, the kid's own room decorations, other lessons' mess greyed out, and this lesson's targets standing where its mess is in the room (`clutterFor()` in `content/world/room.ts`).
- Outdoor: sky gradient, two procedural hill lines, hazy far props (parallax 0.55), ground strip, near props. Targets are spaced 180 px apart (a finished one stays in view beside the wizard) and the camera pans to the next one when a target is done, so the wizard appears to walk.
- Spells are shared evenly across a lesson's targets. Battles have a single target with a heart meter.

## Sizes and pixel scale

All sprites are drawn 1:1 in scene pixels. Sizes were tuned by re-slicing at different `scale` values in `art/sheets/*.json`:

| Thing | Approx. size (px) |
| --- | --- |
| Wizard (frame) | 96 × 96 (the kid is 84 tall), plus 40 px above for hats |
| Hats | about 50 wide |
| Big window | about 195 × 120 |
| Pets | 40 tall |
| Furniture | 40 to 80 tall |
| Little decor | 25 to 35 |
| Villagers | 90 tall |
| Dragon | 160 × 150 |

The two backgrounds are the exception: `tower.png` (2064 × 512) and `map.png` (1376 × 768) are stored at twice their logical size (room 1032 × 256, map 688 × 384) for finer detail. Positions stay in logical units.

## Testing

- `src/game/*.test.ts`: typing, scoring, progress, saves.
- `src/content/content.test.ts`: validates all content. For each lesson it generates 30 runs and checks every prompt only uses keys learned so far, that new keys get practiced, that runs differ, and that every sprite file exists.
- Visual checks are manual: run `npm run dev` and play.

## Animation

- `content/world/animations.ts` lists frames by naming convention: creature idle loops (`IDLE`, keyed by the still sprite) and pet motion (`petMotion()`: sitting sprite plus move frames, and whether the species walks, hops or flies).
- The lesson scene swaps in the idle frame for any target that has one, and the pet sits while the wizard casts and moves along when the wizard walks.
- In the room, `RoomPet` runs a small loop: sit for 3 to 8 seconds, pick a spot on the floor near the wizard, travel there (flipped when going left), sit again. Tapping it makes it hop. The lesson intro picture uses `useIdleFrame()`.
- The wizard's walk has no extra art. `walkFrames()` in `render/wizard.ts` cuts the two boots out of the finished wizard and steps them back and forth under the robe (4 frames, 8 per second), lifting the body 1 px on the passing steps. Used when walking in the room and when the lesson view pans. The boot rows and split column are in `WIZ`; check them if the bases are re-sliced.
- Frames of one animation can differ by a few pixels in size; everything is drawn from the bottom-center, so the feet stay put.

## The room screen

- `.room` is the viewport and `.room-world` inside it is the whole hall, moved with `translateX`. The camera centers on the wizard and stops at the walls.
- One `requestAnimationFrame` loop reads the walk direction (keys, corner buttons, or a drag held at the edge) and moves the wizard. It only sets state while moving.
- A dragged item's position is worked out from the pointer and the camera on every render, so it stays under the pointer while the view scrolls.
- `ROOM_VERSION` in `content/world/room.ts` marks the layout. `save.ts` shifts placements from older saves by `ROOM_MOVE` once, so furniture keeps its place on the floor.

## Wands in the hand

`drawWand()` in `render/wizard.ts` measures each wand sprite once: the grip (middle of the solid pixels near the handle), the tip, and how far the art leans. Wands are turned so they all point the same way from the hand. Staffs (`staff: true`) stand upright with the foot at the wizard's feet and tip forward a little to cast.

## Stars

`Stars` in `ui/components/bits.tsx` draws SVG stars with a dark outline (gold when earned, grey when not), so they read at any size on any background. The `ui/star` sprites are no longer used.

## Keyboard and hands

- `ui/components/Keyboard.tsx` draws the keyboard as SVG in key units (one letter key = 1 unit). Learned keys are white, unlearned keys dim, and only the key(s) to press are colored by finger.
- `ui/components/Hands.tsx` draws see-through hands in the same units: a rounded palm path and one capsule per finger from knuckle to fingertip. The reaching finger moves to its key and the whole hand leans 30% of the way. Outlines are drawn first and fills second so palm and fingers merge.
