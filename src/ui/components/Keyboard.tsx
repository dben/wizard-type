/**
 * On-screen keyboard. Learned keys are plain white; only the key(s) to press
 * light up, in the color of the finger that should press them. Optional
 * see-through hands show the fingers resting on the home row and reaching.
 */
import { ROWS, strokeFor, type KeyDef } from '../../game/keyboard';
import { Hands } from './Hands';

interface Props {
  /** Next character to type, or "Backspace". */
  next: string;
  /** KeyboardEvent.code values currently held down. */
  pressed: ReadonlySet<string>;
  /** Characters learned so far; other keys are dimmed. */
  allowed: ReadonlySet<string>;
  canFix: boolean;
  hands: boolean;
  skin: string;
}

const ROW_OFFSET = [0, 0, 0, 0, 4.5];

export interface PlacedKey {
  key: KeyDef;
  x: number;
  y: number;
}

export const PLACED: PlacedKey[] = ROWS.flatMap((row, r) => {
  let x = ROW_OFFSET[r];
  return row.map((key) => {
    const p = { key, x, y: r };
    x += key.width;
    return p;
  });
});
const byCode = new Map(PLACED.map((p) => [p.key.code, p]));

/** Center of a key in keyboard units (1 unit = one letter key). */
export const keyCenter = (code: string): [number, number] => {
  const p = byCode.get(code)!;
  return [p.x + p.key.width / 2, p.y + 0.5];
};

export interface Target {
  key?: KeyDef;
  shift?: KeyDef;
}

function nextKeys(next: string): Target {
  if (next === 'Backspace') return { key: byCode.get('Backspace')!.key };
  if (!next) return {};
  const s = strokeFor(next);
  return s ? { key: s.key, shift: s.shift } : {};
}

function isLearned(k: KeyDef, allowed: ReadonlySet<string>, canFix: boolean) {
  if (k.code === 'Backspace') return canFix;
  if (k.base === 'Shift') return [...allowed].some((c) => c !== c.toLowerCase());
  return allowed.has(k.base) || (!!k.shifted && allowed.has(k.shifted));
}

const KEY_H = 0.86;
const DEPTH = 0.1;

export function Keyboard({ next, pressed, allowed, canFix, hands, skin }: Props) {
  const target = nextKeys(next);
  return (
    <div class="keyboard" aria-hidden="true">
      <svg class="kb-svg" viewBox="-0.25 -0.25 15.5 7.15">
        <rect class="kb-board" x={-0.2} y={-0.2} width={15.4} height={5.45} rx={0.35} />
        {PLACED.map(({ key, x, y }) => {
          const isNext = key === target.key || key === target.shift;
          const learned = isLearned(key, allowed, canFix);
          const down = pressed.has(key.code);
          const cls = ['key', isNext ? `next f-${key.finger}` : '', learned ? '' : 'unlearned', down ? 'down' : ''].join(' ');
          const w = key.width - 0.12;
          const top = y + 0.05 + (down ? DEPTH * 0.8 : 0);
          return (
            <g class={cls} key={key.code}>
              <rect class="key-edge" x={x + 0.06} y={y + 0.05 + DEPTH} width={w} height={KEY_H} rx={0.16} />
              <rect class="key-top" x={x + 0.06} y={top} width={w} height={KEY_H} rx={0.16} />
              <text x={x + key.width / 2} y={top + 0.57} font-size={key.label.length > 1 ? 0.28 : 0.42}>
                {key.label}
              </text>
              {key.home && <rect class="bump" x={x + key.width / 2 - 0.13} y={top + 0.7} width={0.26} height={0.06} rx={0.03} />}
            </g>
          );
        })}
        {hands && <Hands target={target} skin={skin} />}
      </svg>
    </div>
  );
}
