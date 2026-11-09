import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateSpells, isOnKeyboard, isTypeable } from '../game/generator';
import { createRng } from '../game/rng';
import { CHAPTERS, LESSONS } from './curriculum';
import { BACK_WALL, FLOOR_TOP, GIFT_SPOTS, PET_SPOT, ROOM_H, ROOM_W, STORY_CLUTTER, WINDOW_SPOT, WIZARD_SPOT, clutterFor, floorSpan, isWallClutter } from './world/room';
import { allAnimationSprites, petMotion } from './world/animations';
import { HAIR_STYLES } from './world/looks';
import { ITEMS, STARTER_ITEMS, item } from './items';
import { STAR_GOLD } from '../game/scoring';

const spriteExists = (s: string) => existsSync(resolve(__dirname, '../../public/sprites', `${s}.png`));
const lessonIds = new Set(LESSONS.map((l) => l.lesson.id));
/** Sprite size, read from the PNG header. */
const spriteSize = (s: string) => {
  const b = readFileSync(resolve(__dirname, '../../public/sprites', `${s}.png`));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

describe('curriculum', () => {
  it('has unique lesson ids', () => {
    expect(lessonIds.size).toBe(LESSONS.length);
  });

  it('has about 25 lessons', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(24);
  });

  it('introduces every key at most once', () => {
    const seen = new Set<string>();
    for (const { lesson } of LESSONS) {
      for (const k of lesson.newKeys) {
        expect(seen.has(k), `${k} introduced twice`).toBe(false);
        seen.add(k);
      }
    }
  });

  it('covers every letter by the end', () => {
    const last = LESSONS.at(-1)!;
    for (const c of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.!?\'" ') {
      expect(last.allowed.has(c), c).toBe(true);
    }
  });

  for (const info of LESSONS) {
    const { lesson } = info;
    describe(lesson.id, () => {
      it('generates typeable spells every time', () => {
        const expected = lesson.recipes.reduce((n, r) => n + r.count, 0);
        for (let seed = 1; seed <= 30; seed++) {
          const spells = generateSpells(lesson.recipes, { allowed: info.allowed, focus: info.focus, rng: createRng(seed) });
          expect(spells).toHaveLength(expected);
          for (const s of spells) {
            expect(isTypeable(s, info.allowed), `"${s}" uses unlearned keys`).toBe(true);
            expect(isOnKeyboard(s)).toBe(true);
            expect(s).toBe(s.trim());
          }
        }
      });

      it('practices its new keys', () => {
        const text = Array.from({ length: 10 }, (_, seed) =>
          generateSpells(lesson.recipes, { allowed: info.allowed, focus: info.focus, rng: createRng(seed) }).join(''),
        ).join('');
        for (const k of info.focus) expect(text.includes(k), `${k} never practiced`).toBe(true);
      });

      it('changes between runs', () => {
        const a = generateSpells(lesson.recipes, { allowed: info.allowed, focus: info.focus, rng: createRng(1) });
        const b = generateSpells(lesson.recipes, { allowed: info.allowed, focus: info.focus, rng: createRng(2) });
        expect(a).not.toEqual(b);
      });

      it('uses real sprites and items', () => {
        for (const t of lesson.scene.targets) {
          expect(spriteExists(t.sprite), t.sprite).toBe(true);
          if (t.done) expect(spriteExists(t.done), t.done).toBe(true);
          if (t.helper) expect(spriteExists(t.helper), t.helper).toBe(true);
        }
        if (lesson.scene.npc) expect(spriteExists(lesson.scene.npc)).toBe(true);
        for (const g of lesson.gifts ?? []) expect(item(g), `gift ${g}`).toBeDefined();
      });
    });
  }

  it('tower lessons have one room spot per target', () => {
    for (const { lesson } of LESSONS.filter((l) => l.lesson.scene.location === 'tower')) {
      const spots = clutterFor(lesson.id);
      expect(spots.map((s) => s.sprite), lesson.id).toEqual(lesson.scene.targets.map((t) => t.sprite));
    }
  });

  it('room clutter sprites exist and point at real lessons', () => {
    for (const c of STORY_CLUTTER) {
      expect(spriteExists(c.sprite), c.sprite).toBe(true);
      expect(lessonIds.has(c.until), c.until).toBe(true);
    }
  });

  it('puts wall mess on the back wall and floor mess on the floor', () => {
    for (const c of STORY_CLUTTER) {
      const { w, h } = spriteSize(c.sprite);
      if (isWallClutter(c)) {
        expect(c.x - w / 2, `${c.sprite} left`).toBeGreaterThanOrEqual(BACK_WALL.x0 - 12);
        expect(c.x + w / 2, `${c.sprite} right`).toBeLessThanOrEqual(BACK_WALL.x1 + 12);
        expect(c.y - h, `${c.sprite} top`).toBeGreaterThanOrEqual(BACK_WALL.y0 - 2);
        expect(c.y, `${c.sprite} bottom`).toBeLessThanOrEqual(BACK_WALL.y1);
      } else {
        const [lo, hi] = floorSpan(c.y);
        expect(c.y, c.sprite).toBeGreaterThan(FLOOR_TOP);
        expect(c.y, c.sprite).toBeLessThanOrEqual(ROOM_H);
        expect(c.x, c.sprite).toBeGreaterThanOrEqual(lo);
        expect(c.x, c.sprite).toBeLessThanOrEqual(hi);
      }
    }
  });

  it('keeps the window, gifts, wizard and pet inside the room', () => {
    const { w, h } = spriteSize('windows/meadow');
    expect(WINDOW_SPOT.x - w / 2).toBeGreaterThanOrEqual(BACK_WALL.x0);
    expect(WINDOW_SPOT.x + w / 2).toBeLessThanOrEqual(BACK_WALL.x1);
    expect(WINDOW_SPOT.y - h).toBeGreaterThanOrEqual(BACK_WALL.y0);
    expect(WINDOW_SPOT.y).toBeLessThanOrEqual(BACK_WALL.y1);
    for (const [id, spot] of Object.entries({ ...GIFT_SPOTS, wizard: WIZARD_SPOT, pet: PET_SPOT })) {
      const [lo, hi] = floorSpan(spot.y);
      expect(spot.x, id).toBeGreaterThanOrEqual(lo);
      expect(spot.x, id).toBeLessThanOrEqual(hi);
      expect(spot.y, id).toBeGreaterThan(FLOOR_TOP);
    }
  });

  it('floor gets wider toward the front and is symmetrical', () => {
    expect(floorSpan(FLOOR_TOP)).toEqual([BACK_WALL.x0, BACK_WALL.x1]);
    expect(floorSpan(ROOM_H)).toEqual([0, ROOM_W]);
    let last = 0;
    for (let y = FLOOR_TOP; y <= ROOM_H; y += 3) {
      const [lo, hi] = floorSpan(y);
      expect(hi - lo).toBeGreaterThanOrEqual(last);
      expect(lo + hi).toBe(ROOM_W);
      last = hi - lo;
    }
  });

  it('animation frames exist', () => {
    const pets = ITEMS.filter((i) => i.category === 'pet').map((i) => i.sprite!);
    for (const f of allAnimationSprites(pets)) expect(spriteExists(f), f).toBe(true);
    for (const p of pets) expect(petMotion(p), p).toBeDefined();
  });

  it('every hairstyle has a base sprite and a role mask', () => {
    for (const h of HAIR_STYLES) {
      expect(spriteExists(`wizard/base-${h}`), h).toBe(true);
      expect(spriteExists(`wizard/base-${h}-roles`), `${h} roles`).toBe(true);
    }
  });

  it('chapter icons exist', () => {
    for (const c of CHAPTERS) expect(spriteExists(c.icon), c.icon).toBe(true);
  });
});

describe('items', () => {
  const gifts = new Set(LESSONS.flatMap((l) => l.lesson.gifts ?? []));

  it('have unique ids', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
  });

  it('have sprites (except robes)', () => {
    for (const i of ITEMS) {
      if (i.category === 'robe') expect(i.robe).toBeDefined();
      else expect(i.sprite && spriteExists(i.sprite), `${i.id}: ${i.sprite}`).toBe(true);
    }
  });

  it('point at real lessons and items', () => {
    for (const i of ITEMS) {
      if (i.unlock) expect(lessonIds.has(i.unlock), `${i.id} unlock ${i.unlock}`).toBe(true);
      if (i.requires) expect(item(i.requires), `${i.id} requires ${i.requires}`).toBeDefined();
    }
  });

  it('can all be obtained', () => {
    for (const i of ITEMS) {
      const free = i.price === 0;
      if (free) expect(gifts.has(i.id) || STARTER_ITEMS.includes(i.id), `${i.id} is free but never given`).toBe(true);
    }
  });

  it('3 stars on every lesson pays for the whole shop', () => {
    const shop = ITEMS.reduce((n, i) => n + i.price, 0);
    const stars = LESSONS.length * STAR_GOLD.reduce((a, b) => a + b, 0);
    expect(shop).toBeLessThanOrEqual(stars);
  });

  it('every lesson opens something new in the shop', () => {
    for (const { lesson } of LESSONS.slice(0, -1)) {
      expect(ITEMS.some((i) => i.unlock === lesson.id), lesson.id).toBe(true);
    }
  });

  it('gifts are never also sold', () => {
    for (const g of gifts) expect(item(g)!.price, g).toBe(0);
  });
});
