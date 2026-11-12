# Lessons, words and sentences

## Where things live

| File | Holds |
| --- | --- |
| `src/content/lessons/ch*.ts` | One chapter per file. |
| `src/content/curriculum.ts` | Chapter order. Works out each lesson's allowed keys. |
| `src/content/words/words.ts` | Master word list and names for Shift practice. |
| `src/content/words/sentences.ts` | Sentence templates and their fill-in words. |
| `src/content/types.ts` | The `LessonDef` and `Recipe` types. |

## Lesson format

```ts
{
  id: 'fix-well',              // stored in saves: never rename once shipped
  title: 'Fix the Well',       // 2-4 words
  newKeys: ['v', 'm'],         // characters, or 'Shift' / 'Backspace'
  intro: 'Reach down for V and M.',   // one short line
  outro: 'Fresh water for everyone!', // shown after the first win
  scene: {
    location: 'village',       // tower | village | farm | bridge | forest | mountain
    mode: 'help',              // chore | help | battle
    npc: 'villagers/farmer',   // optional watcher
    targets: [{ sprite: 'village/well-broken', done: 'village/well-fixed' }],
  },
  recipes: [
    { kind: 'keys', count: 3, keys: 'vm', size: [1, 2], groups: [1, 2] },
    { kind: 'words', count: 6 },
    { kind: 'words', count: 3, perSpell: [2, 2] },
  ],
  goalWpm: 9,                  // speed for the third star
  gifts: ['decor-flower-pot'], // given on the first win (price 0 items)
}
```

A lesson can only ask for keys introduced in it or earlier lessons. Uppercase letters are allowed once any lesson has introduced `'Shift'`. Symbols that need Shift (`!`, `?`, `"`) must still be introduced on their own.

### Targets

| Field | Meaning |
| --- | --- |
| `sprite` | What the spells hit. |
| `done` | Sprite after the last hit. Leave out to make it vanish. |
| `glow` | Warm glow behind the `done` sprite (lanterns). |
| `helper` | Sprite that swoops in when done (the broom). |

Spells are shared evenly across targets. Battles use one target with a `-grumpy` and a `-happy` sprite.

**Tower lessons** take their target positions from the room: list the lesson's mess in `STORY_CLUTTER` (`src/content/world/room.ts`) with `until: '<lesson id>'`, in the same order and with the same sprites as the lesson's targets. A test checks they match. List each lesson's spots left to right (the view pans along them) and keep sprite tops below y = 60, the top edge of the lesson view. Outdoors, targets are spaced along the path automatically.

## Recipes

Every recipe makes `count` spells. A run gets fresh random prompts every time.

| Kind | Makes | Options |
| --- | --- | --- |
| `keys` | Drills like `fj jf`. | `keys` (defaults to the lesson's new keys), `size` letters per group, `groups` per spell |
| `words` | Words from the master list using only learned keys. | `perSpell`, `focus` (share of words containing a new key, default 0.7), `maxLength` |
| `list` | Picks from a hand-written list. | `items` |
| `names` | Capitalized names. | `hand`: `right` (left Shift), `left` (right Shift) or `any`; `perSpell` |
| `sentences` | Filled-in templates. | `set`: a key of `SENTENCE_SETS` |

## Words

Add words anywhere in the `RAW` block in `words.ts`: lowercase, letters only, safe and familiar for 7 to 9 year olds. The generator decides which lessons can use each word, so there are no per-lesson word lists to keep in sync.

The early home-row lessons have few possible words. If you add a lesson with a small key set, check its words with `npm test` (it fails if a recipe can't produce enough spells).

## Sentence templates

```ts
'{Name} has {n} {animals}.'
```

- `{slot}` picks from `FILLS[slot]`. `{Slot}` capitalizes it.
- `{n}` is a number made only from learned digits, never exactly 1.
- Results that use unlearned keys are thrown away, so templates can be written freely.
- Adjectives start with a consonant so `a {adj}` reads right.

## Checklist for a new lesson

1. Add it to a chapter file (or a new chapter, then list the chapter in `curriculum.ts`).
2. Make sure every sprite exists in `public/sprites/`.
3. Give it a gift and, if it unlocks shop items, point those items' `unlock` at it.
4. Add it to the curriculum table in `docs/game-design.md`.
5. Run `npm run check`.
