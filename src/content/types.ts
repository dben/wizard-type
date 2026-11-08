/**
 * Content formats. Lessons, chapters and items are plain data that follow these
 * types; see docs/content/ for how to add more.
 */
import type { SentenceSet } from './words/sentences';

// ---------- Lessons ----------

/** A key the lesson introduces: one character, or a special key name. */
export type NewKey = string | 'Shift' | 'Backspace';

/**
 * A recipe makes `count` spells (prompts). Lessons list several recipes,
 * usually going from easy to harder.
 */
export type Recipe =
  /** Random key groups like "fj jf". Uses `keys` or else the lesson's new keys. */
  | { kind: 'keys'; count: number; keys?: string; size?: [number, number]; groups?: [number, number] }
  /** Words from the master list that only use learned keys. */
  | { kind: 'words'; count: number; perSpell?: [number, number]; focus?: number; maxLength?: number }
  /** A hand-written list (each entry must only use learned keys). */
  | { kind: 'list'; count: number; items: readonly string[] }
  /** Capitalized names; `hand` picks names whose first letter is typed by that hand. */
  | { kind: 'names'; count: number; hand: 'left' | 'right' | 'any'; perSpell?: [number, number] }
  /** Filled-in sentence templates from content/words/sentences.ts. */
  | { kind: 'sentences'; count: number; set: SentenceSet };

export type LocationId = 'tower' | 'village' | 'farm' | 'bridge' | 'forest' | 'mountain';

export interface TargetDef {
  /** Sprite path under public/sprites, without ".png". */
  sprite: string;
  /** Sprite after the last spell hits it. Omit to make it vanish. */
  done?: string;
  /** Draw a warm glow on the finished target (lanterns). */
  glow?: boolean;
  /** A helper that swoops in when the target is finished (e.g. the broom). */
  helper?: string;
}

export interface SceneDef {
  location: LocationId;
  /** chore = tidy things up, help = fix something for someone, battle = cheer up a grumpy creature. */
  mode: 'chore' | 'help' | 'battle';
  /**
   * Spells are shared out evenly across the targets, left to right.
   * In the tower, targets stand where the lesson's clutter is in the room (content/world/room.ts).
   */
  targets: TargetDef[];
  /** A villager who watches and cheers. */
  npc?: string;
}

export interface LessonDef {
  /** Stable id used in save files. Never rename once released. */
  id: string;
  /** 2-4 words, shown under the lesson picture. */
  title: string;
  newKeys: NewKey[];
  scene: SceneDef;
  recipes: Recipe[];
  /** Words per minute needed for the third star. */
  goalWpm: number;
  /** One short line shown before the lesson. */
  intro: string;
  /** One short line shown after the first win. */
  outro: string;
  /** Items given the first time the lesson is finished. */
  gifts?: string[];
}

export interface ChapterDef {
  id: string;
  title: string;
  /** Sprite shown on the map. */
  icon: string;
  lessons: LessonDef[];
}

// ---------- Items ----------

export type ItemCategory = 'hat' | 'robe' | 'wand' | 'pet' | 'furniture' | 'decor' | 'wall' | 'rug' | 'window';

export interface RobeStyle {
  main: string;
  trim: string;
  pattern?: 'stars' | 'moons' | 'dots' | 'stripes' | 'hearts' | 'leaves';
}

export interface ItemDef {
  /** Stable id used in save files, e.g. "hat-crown". Never rename once released. */
  id: string;
  name: string;
  category: ItemCategory;
  /** Sprite path under public/sprites, without ".png". Robes have none. */
  sprite?: string;
  /** Gold cost in the shop. 0 = gift only (never sold). */
  price: number;
  /** Shown in the shop only after this lesson is finished. */
  unlock?: string;
  /** Must already own this item (pet outfits need the pet). */
  requires?: string;
  robe?: RobeStyle;
  /** Hats: nudge the hat down (positive) or up so it sits on the head. */
  hatOffset?: number;
}
