/**
 * The wizard's room. Positions are in room pixels (480 x 270) and point at the
 * bottom-center of a sprite.
 */
export const ROOM_W = 480;
export const ROOM_H = 270;
/** Where the wooden floor starts. Furniture stands below this line. */
export const FLOOR_TOP = 212;
/** The big window is part of the wall: always here, only its style changes. */
export const WINDOW_SPOT = { x: 172, y: 172 };

export interface StoryClutter {
  sprite: string;
  x: number;
  y: number;
  /** The lesson that cleans this up. In that lesson it is the spell target. */
  until: string;
}

/**
 * Mess in the room at the start. Each tower lesson's targets stand at the
 * spots listed here for that lesson, in the same order as the lesson's targets.
 */
export const STORY_CLUTTER: StoryClutter[] = [
  { sprite: 'clutter/dust-2', x: 250, y: 250, until: 'wake-wand' },
  { sprite: 'clutter/dust-1', x: 305, y: 264, until: 'wake-wand' },
  { sprite: 'clutter/dust-3', x: 372, y: 252, until: 'wake-wand' },
  { sprite: 'clutter/dust-3', x: 165, y: 262, until: 'broom' },
  { sprite: 'clutter/dust-4', x: 428, y: 262, until: 'broom' },
  { sprite: 'clutter/dust-2', x: 215, y: 238, until: 'broom' },
  { sprite: 'clutter/dust-bunny-1', x: 285, y: 236, until: 'dust-bunnies' },
  { sprite: 'clutter/dust-bunny-2', x: 400, y: 243, until: 'dust-bunnies' },
  { sprite: 'clutter/paper-pile', x: 338, y: 266, until: 'first-words' },
  { sprite: 'clutter/plate-broken', x: 195, y: 266, until: 'first-words' },
  { sprite: 'clutter/cobweb', x: 300, y: 122, until: 'cobwebs' },
  { sprite: 'clutter/cobweb-corner', x: 30, y: 118, until: 'cobwebs' },
  { sprite: 'creatures/spider-grumpy', x: 362, y: 150, until: 'spider' },
  { sprite: 'fixtures/chair-broken', x: 165, y: 240, until: 'fix-chair' },
  { sprite: 'fixtures/table-broken', x: 235, y: 246, until: 'fix-table' },
  { sprite: 'fixtures/bookshelf-broken', x: 300, y: 234, until: 'fix-shelf' },
  { sprite: 'windows/broken', x: WINDOW_SPOT.x, y: WINDOW_SPOT.y, until: 'fix-window' },
  { sprite: 'fixtures/cauldron-broken', x: 395, y: 248, until: 'fix-cauldron' },
  { sprite: 'creatures/mouse-grumpy', x: 440, y: 264, until: 'mouse' },
];

/** Creatures only appear in the room, not greyed out in other lessons. */
export const isCreature = (c: StoryClutter) => c.sprite.startsWith('creatures/');

export const clutterFor = (lessonId: string) => STORY_CLUTTER.filter((c) => c.until === lessonId);

/** Fixed things go back where the broken ones stood. */
export const GIFT_SPOTS: Record<string, { x: number; y: number }> = {
  'furniture-chair': { x: 165, y: 240 },
  'furniture-table': { x: 235, y: 246 },
  'furniture-old-bookshelf': { x: 300, y: 234 },
  'furniture-cauldron': { x: 395, y: 248 },
};

/** Where the wizard and pet stand in the room. */
export const WIZARD_SPOT = { x: 445, y: 266 };
export const PET_SPOT = { x: 405, y: 266 };
