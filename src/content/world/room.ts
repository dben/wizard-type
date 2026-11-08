/**
 * The wizard's room. Positions are in room pixels (480 x 270) and point at the
 * bottom-center of a sprite.
 */
export const ROOM_W = 480;
export const ROOM_H = 270;
/** Where the wooden floor starts. Furniture stands below this line. */
export const FLOOR_TOP = 212;

export interface StoryClutter {
  sprite: string;
  x: number;
  y: number;
  /** Disappears once this lesson is finished. */
  until: string;
}

/** Mess that is in the room at the start and gets cleaned up by lessons. */
export const STORY_CLUTTER: StoryClutter[] = [
  { sprite: 'clutter/dust-3', x: 120, y: 250, until: 'broom' },
  { sprite: 'clutter/dust-2', x: 300, y: 262, until: 'broom' },
  { sprite: 'clutter/dust-4', x: 410, y: 245, until: 'broom' },
  { sprite: 'clutter/dust-bunny-1', x: 220, y: 236, until: 'dust-bunnies' },
  { sprite: 'clutter/dust-bunny-2', x: 360, y: 264, until: 'dust-bunnies' },
  { sprite: 'clutter/paper-pile', x: 60, y: 262, until: 'first-words' },
  { sprite: 'clutter/plate-broken', x: 260, y: 266, until: 'first-words' },
  { sprite: 'clutter/cobweb-corner', x: 26, y: 50, until: 'cobwebs' },
  { sprite: 'clutter/cobweb', x: 250, y: 70, until: 'cobwebs' },
  { sprite: 'creatures/spider-grumpy', x: 250, y: 120, until: 'spider' },
  { sprite: 'fixtures/chair-broken', x: 170, y: 232, until: 'fix-chair' },
  { sprite: 'fixtures/table-broken', x: 230, y: 236, until: 'fix-table' },
  { sprite: 'fixtures/bookshelf-broken', x: 70, y: 226, until: 'fix-shelf' },
  { sprite: 'fixtures/window-broken', x: 160, y: 140, until: 'fix-window' },
  { sprite: 'fixtures/cauldron-broken', x: 330, y: 236, until: 'fix-cauldron' },
  { sprite: 'creatures/mouse-grumpy', x: 440, y: 262, until: 'mouse' },
];

/** Fixed things go back where the broken ones stood. */
export const GIFT_SPOTS: Record<string, { x: number; y: number }> = {
  'furniture-chair': { x: 170, y: 232 },
  'furniture-table': { x: 230, y: 236 },
  'furniture-old-bookshelf': { x: 70, y: 226 },
  'wall-window': { x: 160, y: 140 },
  'furniture-cauldron': { x: 330, y: 236 },
};
