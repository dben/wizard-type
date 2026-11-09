import { describe, expect, it } from 'vitest';
import { HOLD, measureWand } from './wand';

/** Build alpha data from rows of '#' (solid) and '.' (empty). */
const art = (rows: string[]) => ({ alpha: rows.flatMap((r) => [...r].map((ch) => (ch === '#' ? 255 : 0))), w: rows[0].length, h: rows.length });

describe('measureWand', () => {
  it('holds a straight wand by its handle', () => {
    const { alpha, w, h } = art(['..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..']);
    const s = measureWand(alpha, w, h);
    expect(s.grip).toBe(2);
    expect(s.tilt).toBe(0);
    expect(s.length).toBe(h - HOLD);
  });

  it('finds an off-center handle (candy cane: stem on the left, hook curls right)', () => {
    const rows = ['.#####..', '.#...#..', '.#....#.', ...Array.from({ length: 24 }, () => '.#......')];
    const { alpha, w, h } = art(rows);
    const s = measureWand(alpha, w, h);
    expect(s.grip).toBe(1);
    expect(s.tilt).toBe(0); // a hook is part of the art, not a leaning wand
  });

  it('straightens a wand drawn at an angle (feather)', () => {
    // A diagonal from the bottom left to the top right, 2 columns for every 4 rows.
    const rows = Array.from({ length: 24 }, (_, y) => {
      const x = Math.round((23 - y) / 2);
      return '.'.repeat(x) + '#' + '.'.repeat(12 - x);
    });
    const { alpha, w, h } = art(rows);
    const s = measureWand(alpha, w, h);
    expect(s.grip).toBeLessThan(2);
    expect(s.tilt).toBeGreaterThan(0.3);
    expect(s.length).toBeGreaterThan(h - HOLD);
  });
});
