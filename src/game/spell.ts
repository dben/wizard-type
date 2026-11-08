/**
 * One spell = one prompt the player types.
 *
 * Two modes, picked by whether the player has learned Backspace yet:
 *  - "poof":  a wrong key fizzles the spell and it starts over.
 *  - "fix":   a wrong key shows in red and must be erased with Backspace.
 *             Each fixed mistake makes the spell weaker (lower potency).
 */
export type SpellMode = 'poof' | 'fix';

export type SpellEvent =
  | { type: 'correct' }
  | { type: 'wrong'; expected: string; got: string }
  | { type: 'poof'; expected: string; got: string }
  | { type: 'erase' }
  | { type: 'blocked' } // typed while a mistake is waiting to be erased
  | { type: 'cast'; result: SpellResult }
  | { type: 'ignored' };

export interface SpellResult {
  text: string;
  /** Wrong keys pressed (fixed mistakes and poofs). */
  mistakes: number;
  poofs: number;
  /** Correct keys pressed, including ones typed again after a poof. */
  correctKeys: number;
  /** Time from first key to the cast, in ms. */
  timeMs: number;
  /** 1 = full power. Drops with each fixed mistake. */
  potency: number;
}

export const POTENCY_STEP = 0.25;
export const MIN_POTENCY = 0.25;

export class Spell {
  readonly text: string;
  readonly mode: SpellMode;
  /** Characters typed so far (in fix mode the last one may be wrong). */
  typed = '';
  /** Index of a mistake waiting to be erased, or -1. */
  wrongAt = -1;
  mistakes = 0;
  poofs = 0;
  correctKeys = 0;
  private startedAt: number | null = null;
  done = false;

  constructor(text: string, mode: SpellMode) {
    this.text = text;
    this.mode = mode;
  }

  /** The character the player should type next, or "Backspace". */
  get expected(): string {
    if (this.wrongAt >= 0) return 'Backspace';
    return this.text[this.typed.length] ?? '';
  }

  get potency(): number {
    if (this.mode === 'poof') return 1;
    return Math.max(MIN_POTENCY, 1 - this.mistakes * POTENCY_STEP);
  }

  /** Feed a KeyboardEvent.key value. `now` is a timestamp in ms. */
  press(key: string, now: number): SpellEvent {
    if (this.done) return { type: 'ignored' };
    if (key === 'Backspace') return this.erase();
    if (key.length !== 1) return { type: 'ignored' };
    this.startedAt ??= now;

    if (this.wrongAt >= 0) return { type: 'blocked' };
    const expected = this.text[this.typed.length];

    if (key !== expected) {
      this.mistakes++;
      if (this.mode === 'poof') {
        this.poofs++;
        this.typed = '';
        return { type: 'poof', expected, got: key };
      }
      this.wrongAt = this.typed.length;
      this.typed += key;
      return { type: 'wrong', expected, got: key };
    }

    this.correctKeys++;
    this.typed += key;
    if (this.typed === this.text) {
      this.done = true;
      return {
        type: 'cast',
        result: {
          text: this.text,
          mistakes: this.mistakes,
          poofs: this.poofs,
          correctKeys: this.correctKeys,
          timeMs: Math.max(1, now - (this.startedAt ?? now)),
          potency: this.potency,
        },
      };
    }
    return { type: 'correct' };
  }

  private erase(): SpellEvent {
    if (this.mode === 'poof' || this.typed.length === 0) return { type: 'ignored' };
    this.typed = this.typed.slice(0, -1);
    if (this.wrongAt >= this.typed.length) this.wrongAt = -1;
    return { type: 'erase' };
  }
}
