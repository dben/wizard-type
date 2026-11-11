/**
 * The wizard's room: a long hall, wider than the screen. Positions are in room
 * pixels (1032 x 256) and point at the bottom-center of a sprite.
 * backgrounds/tower.png is drawn at twice that size for extra detail.
 */
export const ROOM_W = 1032;
export const ROOM_H = 256;
/** Where the wooden floor starts. Furniture stands below this line. */
export const FLOOR_TOP = 186;
/** The big window is part of the wall: always here, only its style changes. */
export const WINDOW_SPOT = { x: 372, y: 146 };

/**
 * Bump when the room's size changes. Saves from an older layout are shifted by
 * ROOM_MOVE so furniture keeps its place on the floor (see game/save.ts).
 */
export const ROOM_VERSION = 2;
export const ROOM_MOVE = { dx: 200, dy: -26 };

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
 * Keep each lesson's spots in left-to-right order (the scene pans along them)
 * and keep tops below y = 60, the top edge of the lesson view.
 */
export const STORY_CLUTTER: StoryClutter[] = [
  { sprite: 'clutter/dust-2', x: 450, y: 224, until: 'wake-wand' },
  { sprite: 'clutter/dust-1', x: 520, y: 240, until: 'wake-wand' },
  { sprite: 'clutter/dust-3', x: 600, y: 226, until: 'wake-wand' },
  { sprite: 'clutter/dust-3', x: 330, y: 238, until: 'broom' },
  { sprite: 'clutter/dust-4', x: 690, y: 240, until: 'broom' },
  { sprite: 'clutter/dust-2', x: 790, y: 214, until: 'broom' },
  { sprite: 'clutter/dust-bunny-1', x: 490, y: 208, until: 'dust-bunnies' },
  { sprite: 'clutter/dust-bunny-2', x: 740, y: 224, until: 'dust-bunnies' },
  { sprite: 'clutter/paper-pile', x: 560, y: 246, until: 'first-words' },
  { sprite: 'clutter/plate-broken', x: 650, y: 216, until: 'first-words' },
  { sprite: 'clutter/cobweb-corner', x: 200, y: 122, until: 'cobwebs' },
  { sprite: 'clutter/cobweb', x: 560, y: 126, until: 'cobwebs' },
  { sprite: 'creatures/spider-grumpy', x: 640, y: 128, until: 'spider' },
  { sprite: 'fixtures/chair-broken', x: 300, y: 214, until: 'fix-chair' },
  { sprite: 'fixtures/table-broken', x: 450, y: 220, until: 'fix-table' },
  { sprite: 'fixtures/bookshelf-broken', x: 545, y: 206, until: 'fix-shelf' },
  { sprite: 'windows/broken', x: WINDOW_SPOT.x, y: WINDOW_SPOT.y, until: 'fix-window' },
  { sprite: 'fixtures/cauldron-broken', x: 800, y: 222, until: 'fix-cauldron' },
  { sprite: 'creatures/mouse-grumpy', x: 700, y: 244, until: 'mouse' },
];

/** Creatures only appear in the room, not greyed out in other lessons. */
export const isCreature = (c: StoryClutter) => c.sprite.startsWith('creatures/');

export const clutterFor = (lessonId: string) => STORY_CLUTTER.filter((c) => c.until === lessonId);

/** Fixed things go back where the broken ones stood. */
export const GIFT_SPOTS: Record<string, { x: number; y: number }> = {
  'furniture-chair': { x: 300, y: 214 },
  'furniture-table': { x: 450, y: 220 },
  'furniture-old-bookshelf': { x: 545, y: 206 },
  'furniture-cauldron': { x: 800, y: 222 },
};

/** Where the wizard and pet start in the room. The wizard walks along this line. */
export const WIZARD_SPOT = { x: 225, y: 248 };
export const PET_SPOT = { x: 185, y: 248 };
/** How close to the side walls the wizard can walk. */
export const WALK_MARGIN = 34;
