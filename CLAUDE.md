# CLAUDE.md

Guidance for AI agents working in this repo.

## What this is

Wizard Type: a cozy browser typing game for kids aged 7 to 9. Vite + TypeScript + Preact, deployed to GitHub Pages at https://dben.github.io/wizard-type/.

## Commands

```bash
npm run dev        # local server at http://localhost:5173/wizard-type/
npm run check      # typecheck + all tests (run before every commit)
npm run build      # production build into dist/
npm run art:slice -- <sheet-id>             # raw sheet -> sprites
npm run art:slice -- <sheet-id> --preview   # numbered preview for mapping cells
npm run art:generate -- <sheet-id>          # costs money (OpenRouter), see docs/art-pipeline.md
```

## Layout

| Path | What lives there |
| --- | --- |
| `src/content/` | All game data: lessons, items, words, sentences, world layout. No logic. |
| `src/content/lessons/` | One file per chapter. Order is set in `curriculum.ts`. |
| `src/content/items/` | Item catalogs (wardrobe, room). |
| `src/content/words/` | Master word list and sentence templates. |
| `src/content/world/` | Room layout, map trail, locations, look options. |
| `src/game/` | Pure rules: typing, scoring, generator, progress, save. Unit tested. |
| `src/render/` | Canvas scene, wizard compositing, sprite loading. |
| `src/ui/` | Preact screens and components. |
| `src/app/` | App shell and the small global store. |
| `public/sprites/<category>/` | Game-ready sprites (output of the art pipeline). |
| `art/sheets/` | Sheet specs (prompt, slicing, cell names). Source of truth for art. |
| `art/raw/` | Raw generated sheets (lossless WebP). Re-slice from these. |
| `tools/art/` | Python generation and slicing scripts. |
| `docs/` | Design and technical docs. Index: `docs/README.md`. |

## Rules

- Content is data. Add lessons/items by editing `src/content/`, not game code. Follow the types in `src/content/types.ts`.
- `src/content/content.test.ts` checks every lesson and item: ids, sprites on disk, gifts, unlocks, and that generated spells only use learned keys. Keep it green.
- Lesson and item `id`s are stored in save files. Never rename or remove one that has shipped; add a new one instead.
- Words in `src/content/words/` must be safe and familiar for 7 to 9 year olds.
- UI copy is short and picture-first. Kids should not need to read a paragraph.
- Sprites are pixel art drawn at whole-pixel positions. Keep `image-rendering: pixelated` and avoid smoothing.
- `src/game/` stays free of DOM and Preact so it can be tested in Node.
- Image generation spends a shared $10/month OpenRouter budget. Check the budget log in `docs/art-pipeline.md` and update it after generating.

## Docs hygiene

- Keep `README.md` for players and parents, written for an 8 year old. Technical notes go in `docs/`.
- Update the relevant doc in the same change as the code. Delete docs that go stale instead of piling up new ones.
- Keep `docs/README.md` as the index; every doc should be listed there.
