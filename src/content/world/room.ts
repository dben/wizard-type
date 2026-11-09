/**
 * The wizard's room: an octagonal tower seen from inside. A flat back wall
 * faces the player, two angled walls come forward on each side, and the floor
 * is a trapezoid that gets wider toward the player.
 *
 * Positions are in room pixels (480 x 270) and point at the bottom-center of a
 * sprite. The painted background (backgrounds/tower.png) is 960 x 540, twice
 * this, so the walls can have fine detail while sprites stay chunky.
 */
export const ROOM_W = 480;
export const ROOM_H = 270;

/** The flat wall at the back. Wall decor hangs here. */
export const BACK_WALL = { x0: 144, x1: 336, y0: 47, y1: 202 };
/** Where the floor meets the back wall. Furniture stands below this line. */
export const FLOOR_TOP = BACK_WALL.y1;

/** Floor edge on the left; the right side mirrors it. [y, x] pairs from the back wall to the front. */
const FLOOR_LEFT: [number, number][] = [[FLOOR_TOP, 144], [223, 58], [256, 0]];

/** The walkable floor at height y: [leftmost x, rightmost x]. */
export function floorSpan(y: number): [number, number] {
  let left = FLOOR_LEFT[0][1];
  if (y >= FLOOR_LEFT.at(-1)![0]) left = FLOOR_LEFT.at(-1)![1];
  else {
    for (let i = 1; i < FLOOR_LEFT.length; i++) {
      const [y0, x0] = FLOOR_LEFT[i - 1];
      const [y1, x1] = FLOOR_LEFT[i];
      if (y <= y1) {
        left = x0 + ((x1 - x0) * Math.max(0, y - y0)) / (y1 - y0);
        break;
      }
    }
  }
  return [left, ROOM_W - left];
}

/** The big window is part of the back wall: always here, only its style changes. */
export const WINDOW_SPOT = { x: 240, y: 152 };

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
  { sprite: 'clutter/cobweb', x: 304, y: 130, until: 'cobwebs' },
  { sprite: 'clutter/cobweb-corner', x: 174, y: 124, until: 'cobwebs' },
  { sprite: 'creatures/spider-grumpy', x: 292, y: 176, until: 'spider' },
  { sprite: 'fixtures/chair-broken', x: 165, y: 240, until: 'fix-chair' },
  { sprite: 'fixtures/table-broken', x: 235, y: 246, until: 'fix-table' },
  { sprite: 'fixtures/bookshelf-broken', x: 300, y: 234, until: 'fix-shelf' },
  { sprite: 'windows/broken', x: WINDOW_SPOT.x, y: WINDOW_SPOT.y, until: 'fix-window' },
  { sprite: 'fixtures/cauldron-broken', x: 395, y: 248, until: 'fix-cauldron' },
  { sprite: 'creatures/mouse-grumpy', x: 340, y: 266, until: 'mouse' },
];

/** Mess that hangs on the back wall instead of lying on the floor. */
export const isWallClutter = (c: StoryClutter) =>
  c.sprite.startsWith('windows/') || c.sprite.startsWith('clutter/cobweb') || c.sprite === 'creatures/spider-grumpy';

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
export const WIZARD_SPOT = { x: 440, y: 264 };
export const PET_SPOT = { x: 400, y: 266 };
