/**
 * See-through hands over the keyboard, drawn in keyboard units.
 * Each finger is a capsule from its knuckle to its fingertip. A finger that
 * needs to press a key reaches for it, and its whole hand leans that way a bit.
 * All outlines are drawn first and all fills second, so palm and fingers merge.
 */
import { HOME_KEYS, type Finger } from '../../game/keyboard';
import { hex } from '../../render/color';
import { keyCenter, type Target } from './Keyboard';

type HandFinger = Exclude<Finger, 'thumb'>;

/** Knuckle positions relative to the resting fingertip. */
const KNUCKLE: Record<HandFinger, [dx: number, dy: number, width: number]> = {
  L5: [0.75, 1.7, 0.46], L4: [0.4, 1.75, 0.52], L3: [0.12, 1.75, 0.55], L2: [-0.12, 1.65, 0.55],
  R2: [0.12, 1.65, 0.55], R3: [-0.12, 1.75, 0.55], R4: [-0.4, 1.75, 0.52], R5: [-0.75, 1.7, 0.46],
};
const LEFT: HandFinger[] = ['L5', 'L4', 'L3', 'L2'];
const RIGHT: HandFinger[] = ['R2', 'R3', 'R4', 'R5'];
/** Fingertips sit a little below the key center so the letter stays readable. */
const TIP_DROP = 0.32;

interface Pose {
  finger: HandFinger;
  knuckle: [number, number];
  tip: [number, number];
  width: number;
  active: boolean;
}

function handPose(fingers: HandFinger[], active: Map<Finger, string>) {
  const reach = fingers.find((f) => active.has(f));
  let shift: [number, number] = [0, 0];
  if (reach) {
    const [hx, hy] = keyCenter(HOME_KEYS[reach]);
    const [tx, ty] = keyCenter(active.get(reach)!);
    shift = [(tx - hx) * 0.3, (ty - hy) * 0.3];
  }
  const poses: Pose[] = fingers.map((f) => {
    const [hx, hy] = keyCenter(HOME_KEYS[f]);
    const [dx, dy, width] = KNUCKLE[f];
    const knuckle: [number, number] = [hx + dx + shift[0], hy + dy + shift[1]];
    let tip: [number, number] = [hx + shift[0], hy + TIP_DROP + shift[1]];
    if (active.has(f)) {
      const [tx, ty] = keyCenter(active.get(f)!);
      tip = [tx, ty + TIP_DROP];
    }
    return { finger: f, knuckle, tip, width, active: active.has(f) };
  });
  return { poses };
}

function palmPath(poses: Pose[], left: boolean) {
  const k = poses.map((p) => p.knuckle);
  const outer = left ? k[0] : k[k.length - 1];
  const inner = left ? k[k.length - 1] : k[0];
  const s = left ? 1 : -1;
  const f = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;
  const top = (left ? k : [...k].reverse()).map(([x, y]) => f(x, y - 0.2));
  const wristY = Math.max(outer[1], inner[1]) + 2.4;
  // Rounded palm: along the knuckles, a soft bulge down the thumb side, the wrist, and back up the outer edge.
  return [
    `M${f(outer[0] - s * 0.3, outer[1] + 0.05)}`,
    `L${top.join(' L')}`,
    `C${f(inner[0] + s * 0.55, inner[1])} ${f(inner[0] + s * 0.75, inner[1] + 1.1)} ${f(inner[0] + s * 0.25, inner[1] + 1.7)}`,
    `C${f(inner[0], wristY - 0.5)} ${f(inner[0] - s * 0.2, wristY)} ${f(inner[0] - s * 0.35, wristY)}`,
    `L${f(outer[0] + s * 0.45, wristY)}`,
    `C${f(outer[0] + s * 0.2, wristY - 0.6)} ${f(outer[0] - s * 0.45, outer[1] + 1.2)} ${f(outer[0] - s * 0.3, outer[1] + 0.05)}`,
    'Z',
  ].join(' ');
}

export function Hands({ target, skin }: { target: Target; skin: string }) {
  const active = new Map<Finger, string>();
  if (target.key) active.set(target.key.finger, target.key.code);
  if (target.shift) active.set(target.shift.finger, target.shift.code);
  const thumbOn = active.has('thumb');
  const [r, g, b] = hex(skin);
  const outline = `rgb(${Math.round(r * 0.45)},${Math.round(g * 0.35)},${Math.round(b * 0.4)})`;

  const hands = [
    { left: true, ...handPose(LEFT, active) },
    { left: false, ...handPose(RIGHT, active) },
  ];
  const thumbs = hands.map(({ left, poses }) => {
    const inner = poses[left ? poses.length - 1 : 0].knuckle;
    const s = left ? 1 : -1;
    return { base: [inner[0] + s * 0.3, inner[1] + 1.1] as [number, number], tip: [inner[0] + s * 1.25, 4.7] as [number, number] };
  });

  const capsule = (a: [number, number], z: [number, number], w: number, cls: string) => (
    <line class={cls} x1={a[0]} y1={a[1]} x2={z[0]} y2={z[1]} stroke-width={w} />
  );

  return (
    <g class="hands" style={{ '--skin': skin, '--outline': outline }}>
      {/* outlines */}
      {hands.map((h) => (
        <path key={`po${h.left}`} class="hand-outline" d={palmPath(h.poses, h.left)} />
      ))}
      {thumbs.map((t, i) => capsule(t.base, t.tip, 0.62 + 0.09, `finger-outline t${i}`))}
      {hands.flatMap((h) => h.poses.map((p) => capsule(p.knuckle, p.tip, p.width + 0.09, `finger-outline ${p.finger}`)))}
      {/* fills */}
      {hands.map((h) => (
        <path key={`pf${h.left}`} class="hand-fill" d={palmPath(h.poses, h.left)} />
      ))}
      {thumbs.map((t, i) => capsule(t.base, t.tip, 0.62, `finger-fill ${thumbOn ? 'on' : ''} th${i}`))}
      {hands.flatMap((h) => h.poses.map((p) => capsule(p.knuckle, p.tip, p.width, `finger-fill ${p.active ? 'on' : ''} f${p.finger}`)))}
      {/* nails and the "press here" ring */}
      {hands.flatMap((h) =>
        h.poses.map((p) => {
          const ang = Math.atan2(p.tip[1] - p.knuckle[1], p.tip[0] - p.knuckle[0]);
          const nx = p.tip[0] - Math.cos(ang) * 0.08;
          const ny = p.tip[1] - Math.sin(ang) * 0.08;
          return (
            <g key={`n${p.finger}`}>
              <ellipse class="nail" cx={nx} cy={ny} rx={p.width * 0.3} ry={p.width * 0.36} transform={`rotate(${(ang * 180) / Math.PI + 90} ${nx} ${ny})`} />
              {p.active && <circle class="press-ring" cx={p.tip[0]} cy={p.tip[1] - TIP_DROP} r={0.46} />}
            </g>
          );
        }),
      )}
      {thumbOn && <circle class="press-ring" cx={7.5} cy={4.5} r={0.46} />}
    </g>
  );
}
