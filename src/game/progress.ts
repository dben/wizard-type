/**
 * Progression rules: which lessons are open, what a finished lesson pays,
 * what the shop sells, and what the room looks like.
 * Everything here is pure: it takes a Profile and returns a new one.
 */
import { LESSONS, lessonInfo } from '../content/curriculum';
import { ITEMS, item } from '../content/items';
import type { ItemDef } from '../content/types';
import { GIFT_SPOTS, STORY_CLUTTER } from '../content/world/room';
import type { Placement, Profile } from './save';
import { payout, type LessonScore, type Payout } from './scoring';

export const isDone = (p: Profile, lessonId: string) => (p.lessons[lessonId]?.stars ?? 0) > 0;

/** A lesson is open when it's the first one or the one before it is finished. */
export function isOpen(p: Profile, lessonId: string): boolean {
  const info = lessonInfo(lessonId);
  if (!info) return false;
  return info.index === 0 || isDone(p, LESSONS[info.index - 1].lesson.id);
}

/** The first lesson that isn't finished yet (or the last lesson). */
export function nextLesson(p: Profile) {
  return LESSONS.find((l) => !isDone(p, l.lesson.id)) ?? LESSONS.at(-1)!;
}

export const totalStars = (p: Profile) => Object.values(p.lessons).reduce((n, r) => n + r.stars, 0);

export interface LessonOutcome {
  profile: Profile;
  payout: Payout;
  /** Items given for the first time. */
  gifts: string[];
  firstWin: boolean;
}

export function finishLesson(p: Profile, lessonId: string, score: LessonScore): LessonOutcome {
  const info = lessonInfo(lessonId)!;
  const before = p.lessons[lessonId];
  const pay = payout(score, before?.stars ?? 0);
  const firstWin = !before || before.stars === 0;
  const gifts = firstWin ? (info.lesson.gifts ?? []).filter((g) => !p.owned.includes(g)) : [];

  const room: Placement[] = [...p.room];
  for (const g of gifts) {
    const spot = GIFT_SPOTS[g];
    if (spot) room.push({ uid: `${g}-${Date.now()}`, item: g, ...spot });
  }

  const equipped = { ...p.equipped };
  // The first pet follows you around right away.
  const pet = gifts.find((g) => item(g)?.category === 'pet');
  if (pet && !equipped.pet) equipped.pet = pet;

  const profile: Profile = {
    ...p,
    gold: p.gold + pay.total,
    owned: [...p.owned, ...gifts],
    room,
    equipped,
    lessons: {
      ...p.lessons,
      [lessonId]: {
        stars: Math.max(before?.stars ?? 0, score.stars),
        bestAccuracy: Math.max(before?.bestAccuracy ?? 0, score.accuracy),
        bestWpm: Math.max(before?.bestWpm ?? 0, score.wpm),
        plays: (before?.plays ?? 0) + 1,
      },
    },
  };
  return { profile, payout: pay, gifts, firstWin };
}

export type ShopState = 'owned' | 'buy' | 'poor' | 'locked';

export function shopState(p: Profile, it: ItemDef): ShopState {
  if (p.owned.includes(it.id)) return 'owned';
  if ((it.unlock && !isDone(p, it.unlock)) || (it.requires && !p.owned.includes(it.requires))) return 'locked';
  return p.gold >= it.price ? 'buy' : 'poor';
}

/** Items the shop lists: everything that can be bought, plus gifts you already have. */
export const shopItems = () => ITEMS.filter((i) => i.price > 0);

export function buy(p: Profile, itemId: string): Profile {
  const it = item(itemId);
  if (!it || shopState(p, it) !== 'buy') return p;
  return { ...p, gold: p.gold - it.price, owned: [...p.owned, it.id] };
}

export function equip(p: Profile, itemId: string | null, slot: keyof Profile['equipped']): Profile {
  if (itemId !== null && !p.owned.includes(itemId)) return p;
  if (itemId === null && (slot === 'robe' || slot === 'wand')) return p;
  return { ...p, equipped: { ...p.equipped, [slot]: itemId } };
}

/** Clutter still lying around the room. */
export const roomClutter = (p: Profile) => STORY_CLUTTER.filter((c) => !isDone(p, c.until));

/** The big window's sprite, or null while it's still broken (the clutter shows the broken one). */
export const windowSprite = (p: Profile) => (isDone(p, 'fix-window') ? (item(p.window)?.sprite ?? 'windows/meadow') : null);

export function chooseWindow(p: Profile, id: string): Profile {
  return p.owned.includes(id) && item(id)?.category === 'window' ? { ...p, window: id } : p;
}
