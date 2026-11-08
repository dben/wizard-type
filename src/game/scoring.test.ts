import { describe, expect, it } from 'vitest';
import { payout, scoreLesson } from './scoring';
import type { SpellResult } from './spell';

const spell = (text: string, mistakes: number, timeMs: number): SpellResult => ({
  text, mistakes, poofs: 0, correctKeys: text.length, timeMs, potency: 1,
});

describe('scoreLesson', () => {
  it('gives 3 stars for accurate and fast typing', () => {
    // 50 chars in 60s = 10 wpm
    const s = scoreLesson([spell('a'.repeat(25), 0, 30000), spell('b'.repeat(25), 0, 30000)], 8);
    expect(s.wpm).toBeCloseTo(10);
    expect(s.stars).toBe(3);
  });

  it('gives 2 stars when accurate but slow', () => {
    expect(scoreLesson([spell('a'.repeat(25), 0, 60000)], 8).stars).toBe(2);
  });

  it('gives 1 star when there are many mistakes', () => {
    expect(scoreLesson([spell('abcde', 3, 1000)], 1).stars).toBe(1);
  });
});

describe('payout', () => {
  const score = { accuracy: 1, wpm: 10, stars: 3 as const, perfectSpells: 4, spells: 5 };
  it('pays every star the first time', () => {
    expect(payout(score, 0)).toMatchObject({ starGold: 50, spellGold: 4, newStars: [1, 2, 3] });
  });
  it('pays only new stars on replay', () => {
    expect(payout(score, 2)).toMatchObject({ starGold: 25, newStars: [3] });
    expect(payout(score, 3)).toMatchObject({ starGold: 0, total: 4 });
  });
});
