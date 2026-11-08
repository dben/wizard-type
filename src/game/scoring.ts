import type { SpellResult } from './spell';

/** Gold for earning each star on a lesson for the first time. */
export const STAR_GOLD = [10, 15, 25] as const;
/** Gold for each spell cast with no mistakes (every play, including replays). */
export const PERFECT_SPELL_GOLD = 1;
export const TWO_STAR_ACCURACY = 0.9;
export const THREE_STAR_ACCURACY = 0.96;

export interface LessonScore {
  accuracy: number; // 0..1
  wpm: number;
  stars: 1 | 2 | 3;
  perfectSpells: number;
  spells: number;
}

export function scoreLesson(results: SpellResult[], goalWpm: number): LessonScore {
  const correct = results.reduce((n, r) => n + r.correctKeys, 0);
  const mistakes = results.reduce((n, r) => n + r.mistakes, 0);
  const chars = results.reduce((n, r) => n + r.text.length, 0);
  const ms = results.reduce((n, r) => n + r.timeMs, 0);
  const accuracy = correct + mistakes === 0 ? 1 : correct / (correct + mistakes);
  // Standard WPM: five characters = one word.
  const wpm = ms > 0 ? chars / 5 / (ms / 60000) : 0;
  let stars: 1 | 2 | 3 = 1;
  if (accuracy >= TWO_STAR_ACCURACY) stars = 2;
  if (accuracy >= THREE_STAR_ACCURACY && wpm >= goalWpm) stars = 3;
  return {
    accuracy,
    wpm,
    stars,
    perfectSpells: results.filter((r) => r.mistakes === 0).length,
    spells: results.length,
  };
}

export interface Payout {
  starGold: number;
  spellGold: number;
  total: number;
  /** Stars earned for the first time this play (e.g. [2, 3]). */
  newStars: number[];
}

/** Star gold only pays once per star, so replaying an old lesson can't farm big rewards. */
export function payout(score: LessonScore, bestStarsBefore: number): Payout {
  const newStars: number[] = [];
  let starGold = 0;
  for (let s = bestStarsBefore + 1; s <= score.stars; s++) {
    newStars.push(s);
    starGold += STAR_GOLD[s - 1];
  }
  const spellGold = score.perfectSpells * PERFECT_SPELL_GOLD;
  return { starGold, spellGold, total: starGold + spellGold, newStars };
}
