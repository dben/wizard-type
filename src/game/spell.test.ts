import { describe, expect, it } from 'vitest';
import { Spell } from './spell';

const typeAll = (s: Spell, keys: string[], t0 = 0) => keys.map((k, i) => s.press(k, t0 + i * 100));

describe('Spell in poof mode', () => {
  it('casts when typed correctly', () => {
    const s = new Spell('sad', 'poof');
    const ev = typeAll(s, ['s', 'a', 'd']);
    expect(ev.at(-1)).toMatchObject({ type: 'cast', result: { mistakes: 0, potency: 1, timeMs: 200 } });
  });

  it('starts over on a wrong key', () => {
    const s = new Spell('sad', 'poof');
    expect(typeAll(s, ['s', 'x']).at(-1)).toMatchObject({ type: 'poof', expected: 'a', got: 'x' });
    expect(s.typed).toBe('');
    const ev = typeAll(s, ['s', 'a', 'd']);
    expect(ev.at(-1)).toMatchObject({ type: 'cast', result: { mistakes: 1, poofs: 1, potency: 1 } });
  });

  it('ignores backspace and special keys', () => {
    const s = new Spell('a', 'poof');
    expect(s.press('Backspace', 0).type).toBe('ignored');
    expect(s.press('Shift', 0).type).toBe('ignored');
  });
});

describe('Spell in fix mode', () => {
  it('blocks until the mistake is erased, then loses potency', () => {
    const s = new Spell('hall', 'fix');
    typeAll(s, ['h', 'x']);
    expect(s.expected).toBe('Backspace');
    expect(s.press('a', 0).type).toBe('blocked');
    expect(s.press('Backspace', 0).type).toBe('erase');
    const ev = typeAll(s, ['a', 'l', 'l']);
    expect(ev.at(-1)).toMatchObject({ type: 'cast', result: { mistakes: 1, potency: 0.75 } });
  });

  it('never drops below minimum potency', () => {
    const s = new Spell('ab', 'fix');
    for (let i = 0; i < 6; i++) {
      s.press('z', 0);
      s.press('Backspace', 0);
    }
    expect(s.potency).toBe(0.25);
  });

  it('allows erasing correct letters without penalty', () => {
    const s = new Spell('ab', 'fix');
    s.press('a', 0);
    s.press('Backspace', 0);
    s.press('a', 0);
    expect(s.press('b', 0)).toMatchObject({ type: 'cast', result: { potency: 1 } });
  });
});
