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
  - `wizard.ts`: builds the wizard from a base sprite per hair style. The bases are drawn with key colors (green hair, peach skin, grey robe); pixels are classified by color and re-tinted to the chosen skin, hair and robe. Robe patterns and hem trim are stamped onto robe pixels, then the hat is drawn at a fixed head anchor.
  - `portrait.ts`: cached data-URL portraits for menus.

## Scene layout

- Logical size 480 × 200, drawn at 2× into the canvas and scaled with CSS (`image-rendering: pixelated`).
- Indoor (tower): painted background, the kid's own room decorations, targets spread across the floor or wall.
- Outdoor: sky gradient, two procedural hill lines, hazy far props (parallax 0.55), ground strip, near props. Targets are spaced 240 px apart and the camera pans to the next one when a target is done, so the wizard appears to walk.
- Spells are shared evenly across a lesson's targets. Battles have a single target with a heart meter.

## Sizes and pixel scale

All sprites are drawn 1:1 in scene pixels. Sizes were tuned by re-slicing at different `scale` values in `art/sheets/*.json`:

| Thing | Approx. size (px) |
| --- | --- |
| Wizard (frame) | 96 × 96, plus 36 px above for hats |
| Hats | 40 wide |
| Pets | 40 tall |
| Furniture | 40 to 80 tall |
| Little decor | 25 to 35 |
| Villagers | 90 tall |
| Dragon | 160 × 150 |

## Testing

- `src/game/*.test.ts`: typing, scoring, progress, saves.
- `src/content/content.test.ts`: validates all content. For each lesson it generates 30 runs and checks every prompt only uses keys learned so far, that new keys get practiced, that runs differ, and that every sprite file exists.
- Visual checks are manual: run `npm run dev` and play.
