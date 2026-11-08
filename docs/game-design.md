# Game design

## Goal

A cozy typing game for ages 7 to 9. Kids learn touch typing a few keys at a time, and their typing visibly fixes up a wizard's tower and the world around it. Pictures and short labels over text.

## Core loop

1. Pick the next lesson on the map.
2. Intro card shows the new keys as big keycaps and one short line.
3. Each prompt is a **spell**. Typing it casts it at the target in the scene.
4. Results: 1 to 3 stars, gold, gifts, and items newly in the shop.
5. Spend gold on clothes and room decorations. Decorate the room.

## Typing rules

| Before Backspace is learned (lessons 1 to 7) | After (lesson 8 on) |
| --- | --- |
| A wrong key makes the spell go **poof**. The prompt starts over. | A wrong key shows in red and must be erased with Backspace (⌫). |
| | Each fixed mistake makes the spell weaker: potency drops 25% per mistake, minimum 25%. Weaker spells have smaller sparkles. |
| | While a mistake is waiting, other keys are blocked so mistakes can't pile up. |

Code: `src/game/spell.ts`.

## Stars

| Stars | Needs |
| --- | --- |
| ⭐ | Finish the lesson. |
| ⭐⭐ | Accuracy of 90% or better. |
| ⭐⭐⭐ | Accuracy of 96% or better **and** speed at or above the lesson's `goalWpm`. |

- Accuracy = correct keys ÷ (correct keys + wrong keys).
- Speed is standard WPM (5 characters = 1 word), timed from a spell's first key to its last, so scene animations don't count against the kid.
- Speed goals start at 4 WPM and rise to 11 WPM by the final lesson.
- The results screen shows two bars (Aim, Speed) with the 3-star goal marked, plus a one-line hint for the next star.

Code: `src/game/scoring.ts`.

## Gold and anti-grinding

| Source | Amount | Repeats? |
| --- | --- | --- |
| 1st star on a lesson | 20 | First time only |
| 2nd star | 30 | First time only |
| 3rd star | 50 | First time only |
| Each perfect spell (no mistakes) | 1 | Every play |

Replaying lesson 1 forever earns about 9 gold a run, so grinding is slow. The real limit is **level gating**: every shop item has an `unlock` lesson and stays locked until that lesson is finished. Kids see the locked item and which lesson opens it.

**3 stars on every lesson pays for everything in the shop.** Stars pay 2,700 gold in total; the shop holds 160 items for 2,680 gold. A test (`content.test.ts`) fails if the shop ever costs more than the stars pay, so new items need prices that fit. Perfect-spell gold is extra on top. Every lesson except the last opens at least one new shop item.

## Gifts and pets

- Every lesson gives a gift item the first time it's finished.
- Fixing lessons (chapter 2) put the fixed furniture back in the room where the broken one stood.
- Pets come from big moments: kitten (spider), owl (mouse), bunny (flowers), frog (bulldog), fox (goose), baby dragon (final dragon). The first pet is equipped automatically.
- Pet outfits (scarf, wizard hat, flower crown) are sold once you have the pet.
- Pets wander the room: they sit for a while, then walk (kitten, fox), hop (bunny, frog) or fly (owl, baby dragon) somewhere new. Tap a pet and it hops. In lessons the pet follows the wizard.

## The room

- Starts dusty: dust piles, dust bunnies, cobwebs, a grumpy spider, broken chair, table, bookshelf, a boarded-up window, a cauldron, and a mouse.
- Each piece of clutter belongs to one lesson (`src/content/world/room.ts`) and disappears when that lesson is done. Tapping clutter says which lesson fixes it.
- Tower lessons show the real room: the kid's furniture, the window, and every unfinished mess greyed out. The lesson's own mess is in full color, standing in the same spot, and is what the spells hit. The spider and mouse only appear in their own lessons.
- The big window is part of the wall. Fixing it gives the Meadow Window; other styles (sunset, mountains, frosty, starry) come from the shop and are switched in the room's Window tab.
- Kids place owned furniture, little things, wall hangings and rugs by tapping, then drag to move. Rugs draw under everything, little things draw on top of furniture, wall hangings always sit in front of the window.

## Curriculum

27 lessons in 5 chapters. Key order follows common touch-typing courses: home row from the index fingers out, then top row, bottom row, Shift, numbers, symbols.

| # | Lesson | New keys | Scene |
| --- | --- | --- | --- |
| **1** | **The Dusty Tower** | | |
| 1 | Wake the Wand | F J Space | Dust |
| 2 | Magic Broom | D K | Dust (broom helper) |
| 3 | Dust Bunnies | S L | Dust bunnies |
| 4 | First Words | A ; | First real words |
| 5 | Cobweb Sweep | G H | Cobwebs |
| 6 | Shoo, Spider! | review | Battle: spider |
| **2** | **Fix the Tower** | | |
| 7 | Fix the Chair | E I | Chair |
| 8 | Fix the Table | R U ⌫ | Table. Backspace arrives. |
| 9 | Fix the Shelf | T Y | Bookshelf |
| 10 | Fix the Window | W O | Window |
| 11 | Fix the Cauldron | Q P | Cauldron |
| 12 | Mischief Mouse | review | Battle: mouse |
| **3** | **Village Helper** | | |
| 13 | Fix the Well | V M | Well |
| 14 | Fix the Wagon | B N | Wagon |
| 15 | Grow Flowers | C , | Flower beds, comma lists |
| 16 | Light the Lanterns | X . | Lanterns, sentences with periods |
| 17 | Fix the Fence | Z | Fence |
| 18 | Grumpy Bulldog | review | Battle: bulldog on the bridge |
| **4** | **Big Letters** | | |
| 19 | Cheer the Scarecrow | Shift | Names, right-hand capitals (left Shift) |
| 20 | Stack the Hay | | Names, left-hand capitals (right Shift) |
| 21 | Pick Apples | | Capitalized sentences |
| 22 | Grumpy Goose | review | Battle: goose |
| **5** | **Dragon Mountain** | | |
| 23 | Raccoon Count | 1 to 5 | Battle: raccoon |
| 24 | Crow's Riddle | 6 to 0 | Battle: crow |
| 25 | Wake the Golem | ! ? | Battle: rock golem |
| 26 | Ghost Notes | ' " | Battle: ghost |
| 27 | The Dragon | everything | Final battle |

Battles are never failable: spells fill the creature's heart meter until it cheers up.

## Open ideas

- The wizard walking around the room.
- Daily "practice spell" bonus to reward short regular practice without big gold.
- A reading-free intro (audio voice-over) for younger kids.
- More chapters: punctuation like `:` `-` `( )`, longer paragraphs, timed challenges.
- Trophy shelf for 3-star chapters.
