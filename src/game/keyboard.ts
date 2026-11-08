/**
 * US QWERTY layout with finger assignments.
 * The on-screen keyboard, the hand overlay and the lesson key checks all read from here.
 */
export type Finger = 'L5' | 'L4' | 'L3' | 'L2' | 'R2' | 'R3' | 'R4' | 'R5' | 'thumb';

export interface KeyDef {
  /** KeyboardEvent.code, e.g. "KeyA". */
  code: string;
  /** Character without shift ("a"), or a name for special keys. */
  base: string;
  /** Character with shift ("A"). */
  shifted?: string;
  label: string;
  width: number;
  finger: Finger;
  /** Home-row resting key (F and J get a bump). */
  home?: boolean;
}

const letters = (codes: string, fingers: Finger[]) =>
  [...codes].map((c, i) => ({ c, f: fingers[i] }));

function charKey(base: string, shifted: string, finger: Finger, code: string, home = false): KeyDef {
  const label = /[a-z]/.test(base) ? base.toUpperCase() : base;
  return { code, base, shifted, label, width: 1, finger, home };
}

const letterCode = (c: string) => `Key${c.toUpperCase()}`;

export const ROWS: KeyDef[][] = [
  [
    charKey('`', '~', 'L5', 'Backquote'),
    ...letters('1234567890', ['L5', 'L4', 'L3', 'L2', 'L2', 'R2', 'R2', 'R3', 'R4', 'R5']).map(({ c, f }) =>
      charKey(c, '!@#$%^&*()'['1234567890'.indexOf(c)], f, `Digit${c}`),
    ),
    charKey('-', '_', 'R5', 'Minus'),
    charKey('=', '+', 'R5', 'Equal'),
    { code: 'Backspace', base: 'Backspace', label: '⌫', width: 2, finger: 'R5' },
  ],
  [
    { code: 'Tab', base: 'Tab', label: 'Tab', width: 1.5, finger: 'L5' },
    ...letters('qwertyuiop', ['L5', 'L4', 'L3', 'L2', 'L2', 'R2', 'R2', 'R3', 'R4', 'R5']).map(({ c, f }) =>
      charKey(c, c.toUpperCase(), f, letterCode(c)),
    ),
    charKey('[', '{', 'R5', 'BracketLeft'),
    charKey(']', '}', 'R5', 'BracketRight'),
    { ...charKey('\\', '|', 'R5', 'Backslash'), width: 1.5 },
  ],
  [
    { code: 'CapsLock', base: 'CapsLock', label: 'Caps', width: 1.75, finger: 'L5' },
    ...letters('asdfghjkl', ['L5', 'L4', 'L3', 'L2', 'L2', 'R2', 'R2', 'R3', 'R4']).map(({ c, f }) =>
      charKey(c, c.toUpperCase(), f, letterCode(c), 'fj'.includes(c)),
    ),
    charKey(';', ':', 'R5', 'Semicolon'),
    charKey("'", '"', 'R5', 'Quote'),
    { code: 'Enter', base: 'Enter', label: 'Enter', width: 2.25, finger: 'R5' },
  ],
  [
    { code: 'ShiftLeft', base: 'Shift', label: 'Shift', width: 2.25, finger: 'L5' },
    ...letters('zxcvbnm', ['L5', 'L4', 'L3', 'L2', 'L2', 'R2', 'R2']).map(({ c, f }) =>
      charKey(c, c.toUpperCase(), f, letterCode(c)),
    ),
    charKey(',', '<', 'R3', 'Comma'),
    charKey('.', '>', 'R4', 'Period'),
    charKey('/', '?', 'R5', 'Slash'),
    { code: 'ShiftRight', base: 'Shift', label: 'Shift', width: 2.75, finger: 'R5' },
  ],
  [{ code: 'Space', base: ' ', label: '', width: 6, finger: 'thumb' }],
];

export const ALL_KEYS: KeyDef[] = ROWS.flat();

/** Keys the fingers rest on, in finger order L5..R5. */
export const HOME_KEYS: Record<Exclude<Finger, 'thumb'>, string> = {
  L5: 'KeyA', L4: 'KeyS', L3: 'KeyD', L2: 'KeyF', R2: 'KeyJ', R3: 'KeyK', R4: 'KeyL', R5: 'Semicolon',
};

export interface KeyStroke {
  key: KeyDef;
  /** Which shift key to hold, if any (always the opposite hand). */
  shift?: KeyDef;
}

const byCode = new Map(ALL_KEYS.map((k) => [k.code, k]));
export const keyByCode = (code: string) => byCode.get(code);

const isLeft = (f: Finger) => f.startsWith('L');

/** How to type one character: the key, and the opposite-hand shift if needed. */
export function strokeFor(char: string): KeyStroke | undefined {
  for (const key of ALL_KEYS) {
    if (key.base === char && char.length === 1) return { key };
    if (key.shifted === char) {
      const shift = byCode.get(isLeft(key.finger) ? 'ShiftRight' : 'ShiftLeft')!;
      return { key, shift };
    }
  }
  return undefined;
}

export const needsShift = (char: string) => !!strokeFor(char)?.shift;
