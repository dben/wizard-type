/**
 * On-screen keyboard. Keys are colored by finger, the next key glows, and
 * pressed keys flash. Optional see-through hands show which finger to use.
 */
import { HOME_KEYS, ROWS, strokeFor, type Finger, type KeyDef } from '../../game/keyboard';

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

interface Placed {
  key: KeyDef;
  x: number;
  y: number;
}

const PLACED: Placed[] = ROWS.flatMap((row, r) => {
  let x = ROW_OFFSET[r];
  return row.map((key) => {
    const p = { key, x, y: r };
    x += key.width;
    return p;
  });
});
const byCode = new Map(PLACED.map((p) => [p.key.code, p]));
const center = (code: string): [number, number] => {
  const p = byCode.get(code)!;
  return [p.x + p.key.width / 2, p.y + 0.5];
};

function nextKeys(next: string): { key?: KeyDef; shift?: KeyDef } {
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

export function Keyboard({ next, pressed, allowed, canFix, hands, skin }: Props) {
  const target = nextKeys(next);
  return (
    <div class="keyboard" aria-hidden="true">
      <svg class="kb-svg" viewBox="-0.1 -0.1 15.2 6.6">
        {PLACED.map(({ key, x, y }) => {
          const isNext = key === target.key || key === target.shift;
          const learned = isLearned(key, allowed, canFix);
          const cls = [
            'key', `f-${key.finger}`, learned ? '' : 'unlearned', isNext ? 'next' : '', pressed.has(key.code) ? 'down' : '',
          ].join(' ');
          return (
            <g class={cls} key={key.code}>
              <rect x={x + 0.06} y={y + 0.06} width={key.width - 0.12} height={0.88} rx={0.16} />
              <text x={x + key.width / 2} y={y + 0.62} font-size={key.label.length > 1 ? 0.3 : 0.42}>{key.label}</text>
              {key.home && <rect class="bump" x={x + key.width / 2 - 0.13} y={y + 0.76} width={0.26} height={0.06} rx={0.03} />}
            </g>
          );
        })}
        {hands && <Hands target={target} skin={skin} />}
      </svg>
    </div>
  );
}

const KNUCKLES: Record<Exclude<Finger, 'thumb'>, [number, number]> = {
  L5: [2.5, 3.6], L4: [3.15, 3.4], L3: [3.85, 3.35], L2: [4.55, 3.5],
  R2: [10.45, 3.5], R3: [11.15, 3.35], R4: [11.85, 3.4], R5: [12.5, 3.6],
};

function Hands({ target, skin }: { target: ReturnType<typeof nextKeys>; skin: string }) {
  const active = new Map<Finger, string>();
  if (target.key) active.set(target.key.finger, target.key.code);
  if (target.shift) active.set(target.shift.finger, target.shift.code);
  const fingers = (Object.keys(KNUCKLES) as Exclude<Finger, 'thumb'>[]).map((f) => {
    const code = active.get(f) ?? HOME_KEYS[f];
    const [tx, ty] = center(code);
    const [kx, ky] = KNUCKLES[f];
    // Fingers rest a little below the key center so the letter stays readable.
    return { f, tx, ty: ty + 0.3, kx, ky: ky + 1.3, on: active.has(f) };
  });
  const thumbOn = active.has('thumb');
  return (
    <g class="hands" style={{ '--skin': skin }}>
      <ellipse class="palm" cx={3.7} cy={5.75} rx={1.5} ry={0.95} />
      <ellipse class="palm" cx={11.3} cy={5.75} rx={1.5} ry={0.95} />
      {fingers.map(({ f, tx, ty, kx, ky, on }) => (
        <g key={f}>
          <line class={`finger ${on ? 'on' : ''}`} x1={kx} y1={ky} x2={tx} y2={ty} />
          <circle class={`tip ${on ? 'on' : ''}`} cx={tx} cy={ty} r={on ? 0.2 : 0.14} />
        </g>
      ))}
      <line class={`finger ${thumbOn ? 'on' : ''}`} x1={5.1} y1={5.3} x2={6.4} y2={4.6} />
      <line class={`finger ${thumbOn ? 'on' : ''}`} x1={9.9} y1={5.3} x2={8.6} y2={4.6} />
    </g>
  );
}
