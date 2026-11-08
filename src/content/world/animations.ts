/**
 * Sprite animations. Frame sprites live next to the base sprite:
 *   creatures/<name>-<mood>, -2, -3      idle loop (art/sheets/anim-<name>.json)
 *   pets/<species>-<outfit>, -walk-1..3  sitting, then moving (art/sheets/anim-pet-<species>.json)
 */
export interface Anim {
  frames: string[];
  fps: number;
}

export const CREATURES = ['spider', 'mouse', 'crow', 'raccoon', 'bulldog', 'goose', 'golem', 'ghost', 'dragon'] as const;

/** Idle loops, keyed by the base sprite. Played 1-2-3-2 so the loop is smooth. */
export const IDLE: Record<string, Anim> = {};
for (const c of CREATURES) {
  for (const mood of ['grumpy', 'happy']) {
    const base = `creatures/${c}-${mood}`;
    IDLE[base] = { frames: [base, `${base}-2`, `${base}-3`, `${base}-2`], fps: mood === 'happy' ? 5 : 3 };
  }
}

export type PetMove = 'walk' | 'hop' | 'fly';

export const PET_MOVES: Record<string, PetMove> = {
  kitten: 'walk', fox: 'walk', bunny: 'hop', frog: 'hop', owl: 'fly', dragon: 'fly',
};

export interface PetMotion {
  /** Sitting sprite (also the item's sprite). */
  sit: string;
  /** Frames while moving to the right; flip the sprite to go left. */
  move: string[];
  style: PetMove;
  fps: number;
}

/** Motion frames for a pet sprite like "pets/kitten-scarf". */
export function petMotion(sprite: string): PetMotion | undefined {
  const m = /^pets\/(\w+)-(\w+)$/.exec(sprite);
  if (!m || !PET_MOVES[m[1]]) return undefined;
  const style = PET_MOVES[m[1]];
  const walk = [1, 2, 3].map((i) => `${sprite}-walk-${i}`);
  return {
    sit: sprite,
    // A hop is crouch, leap, land; a walk or flap cycles back and forth.
    move: style === 'hop' ? walk : [...walk, walk[1]],
    style,
    fps: style === 'fly' ? 8 : style === 'hop' ? 6 : 8,
  };
}

/** The frame of an idle animation to show at time t (seconds), or the sprite itself. */
export function idleFrame(sprite: string, t: number, phase = 0): string {
  const a = IDLE[sprite];
  if (!a) return sprite;
  return a.frames[Math.floor((t + phase) * a.fps) % a.frames.length];
}

export const allAnimationSprites = (petSprites: string[]) => [
  ...Object.values(IDLE).flatMap((a) => a.frames),
  ...petSprites.flatMap((s) => petMotion(s)?.move ?? []),
];
