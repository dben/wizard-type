/**
 * Builds the wizard picture from layers:
 *   base sprite (one per hair style, drawn with green hair, peach skin, grey robe)
 *   -> recolor skin, hair and robe -> robe pattern and hem -> hat.
 * The wand and pet are drawn separately so scenes can animate them; drawWand()
 * puts a wand or staff in the hand.
 */
import type { ItemDef, RobeStyle } from '../content/types';
import type { WizardLook } from '../game/save';
import { hex, lum, shadeRGB, type RGB } from './color';
import { loadSprite } from './sprites';

/** Geometry of the 96x96 base sprites, measured from the art. */
export const WIZ = {
  size: 96,
  /** Extra space above the base frame for tall hats. */
  padTop: 40,
  /** Center of the head, and where the bottom of a hat's brim sits. */
  headX: 48,
  hatY: 21,
  handX: 73,
  handY: 42,
  feetY: 90,
  /** The boots: everything from this row down, split into back and front boot at bootSplit. */
  bootTop: 83,
  bootSplit: 48,
} as const;

export const WIZ_CANVAS = { w: WIZ.size, h: WIZ.size + WIZ.padTop };

/** Walk cycle: where the [back, front] boot goes in each frame, and how far the body lifts. */
const STEPS: { boots: [dx: number, dy: number][]; lift: number }[] = [
  { boots: [[3, 0], [-3, 0]], lift: 0 },
  { boots: [[1, 0], [-1, -3]], lift: 1 },
  { boots: [[-3, 0], [3, 0]], lift: 0 },
  { boots: [[-1, -3], [1, 0]], lift: 1 },
];
export const WALK_FPS = 8;

/**
 * Walking frames made from a finished wizard: the two boots are cut out and
 * stepped back and forth under the robe, which hides a lifted boot's top.
 * No extra art, so it works for every hair style, robe and hat.
 */
export function walkFrames(wizard: HTMLCanvasElement): HTMLCanvasElement[] {
  const top = WIZ.padTop + WIZ.bootTop;
  const h = wizard.height - top;
  return STEPS.map((step) => {
    const c = document.createElement('canvas');
    c.width = wizard.width;
    c.height = wizard.height;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    [[0, WIZ.bootSplit], [WIZ.bootSplit, wizard.width - WIZ.bootSplit]].forEach(([x, w], i) => {
      const [dx, dy] = step.boots[i];
      ctx.drawImage(wizard, x, top, w, h, x + dx, top + dy, w, h);
      // When the body lifts, stretch the boot's top row up so no gap opens under the hem.
      for (let k = 1; k <= step.lift; k++) ctx.drawImage(wizard, x, top, w, 1, x + dx, top + dy - k, w, 1);
    });
    ctx.drawImage(wizard, 0, 0, wizard.width, top, 0, -step.lift, wizard.width, top);
    return c;
  });
}

/** Where the hand holds a wand sprite, measured from its pixels. */
interface WandGrip {
  /** Grip point in sprite pixels. */
  x: number;
  y: number;
  /** Top of the wand, where sparkles come out. */
  tipX: number;
  /** How far the art itself leans to the right, in radians (a feather is drawn slanted). */
  lean: number;
}

const grips = new WeakMap<HTMLImageElement, WandGrip>();

function wandGrip(img: HTMLImageElement, staff: boolean): WandGrip {
  let g = grips.get(img);
  if (g) return g;
  const c = document.createElement('canvas').getContext('2d')!;
  c.canvas.width = img.width;
  c.canvas.height = img.height;
  c.drawImage(img, 0, 0);
  const a = c.getImageData(0, 0, img.width, img.height).data;
  /** Middle of the solid pixels in a band of rows. */
  const middle = (y0: number, y1: number) => {
    let lo = img.width;
    let hi = -1;
    for (let y = Math.max(0, y0); y <= Math.min(img.height - 1, y1); y++)
      for (let x = 0; x < img.width; x++)
        if (a[(y * img.width + x) * 4 + 3] > 0) {
          lo = Math.min(lo, x);
          hi = Math.max(hi, x + 1);
        }
    return hi < 0 ? img.width / 2 : (lo + hi) / 2;
  };
  // Wands are held near the bottom. Staffs are held where the hand is when the foot rests on the ground.
  const y = img.height - (staff ? WIZ.feetY - WIZ.handY : 6);
  const x = middle(y - 2, y + 2);
  const tipX = middle(0, 5);
  g = { x, y, tipX, lean: staff ? 0 : Math.atan2(tipX - x, y) };
  grips.set(img, g);
  return g;
}

/** Resting angle: wands point up and forward, staffs stand upright like a walking stick. */
export const wandRest = (staff: boolean) => (staff ? 0.04 : 0.45);

/** Draw a wand held in the hand at (handX, handY), turned by `angle` (0 = straight up). */
export function drawWand(ctx: CanvasRenderingContext2D, img: HTMLImageElement, handX: number, handY: number, angle: number, staff: boolean) {
  const g = wandGrip(img, staff);
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(angle - g.lean);
  ctx.drawImage(img, -Math.round(g.x), -Math.round(g.y));
  ctx.restore();
}

/** Where the tip of that wand ends up. */
export function wandTipAt(img: HTMLImageElement | undefined, handX: number, handY: number, angle: number, staff: boolean): [number, number] {
  if (!img) return [handX + 12, handY - 30];
  const g = wandGrip(img, staff);
  const a = angle - g.lean;
  const dx = g.tipX - g.x;
  return [handX + dx * Math.cos(a) + g.y * Math.sin(a), handY + dx * Math.sin(a) - g.y * Math.cos(a)];
}

/** Most common color of each role in the base art; shading is measured against these. */
type Role = 'skin' | 'hair' | 'robe' | null;

const REF = { skin: lum(243, 181, 137), hair: lum(36, 188, 46), robe: lum(178, 181, 186) };

/**
 * Snap a shade to one of five steps of the target color. Pixel art reads
 * clean with a few flat tones; smooth tinting made skin look blotchy.
 */
function ramp(r: number, g: number, b: number, target: RGB, refLum: number): RGB {
  const k = lum(r, g, b) / refLum;
  const step = k < 0.6 ? 0.5 : k < 0.78 ? 0.7 : k < 0.96 ? 0.86 : k < 1.07 ? 1 : 1.14;
  return shadeRGB(target, step);
}

const STAR = ['.#.', '###', '.#.'];
const MOON = ['##.', '#..', '##.'];
const DOT = ['##', '##'];
const HEART = ['#.#', '###', '.#.'];
const LEAF = ['.#', '##', '#.'];

function patternAt(pattern: RobeStyle['pattern'], x: number, y: number): boolean {
  if (!pattern) return false;
  if (pattern === 'stripes') return y % 8 < 2;
  const shape = { stars: STAR, moons: MOON, dots: DOT, hearts: HEART, leaves: LEAF }[pattern];
  const cell = 11;
  const row = Math.floor(y / cell);
  const ox = (x + (row % 2) * 5) % cell;
  const oy = y % cell;
  return shape[oy]?.[ox] === '#';
}

export async function buildWizard(look: WizardLook, robe: RobeStyle, hat?: ItemDef | null): Promise<HTMLCanvasElement> {
  const [base, roleImg] = await Promise.all([loadSprite(`wizard/base-${look.hair}`), loadSprite(`wizard/base-${look.hair}-roles`)]);
  const c = document.createElement('canvas');
  c.width = WIZ_CANVAS.w;
  c.height = WIZ_CANVAS.h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, WIZ.padTop);

  const img = ctx.getImageData(0, WIZ.padTop, WIZ.size, WIZ.size);
  const d = img.data;
  // Role masks (tools/art/wizard_roles.py): red = skin, green = hair, blue = robe.
  const rc = document.createElement('canvas').getContext('2d')!;
  rc.canvas.width = WIZ.size;
  rc.canvas.height = WIZ.size;
  rc.drawImage(roleImg, 0, 0);
  const m = rc.getImageData(0, 0, WIZ.size, WIZ.size).data;
  const skin = hex(look.skin);
  const hair = hex(look.hairColor);
  const main = hex(robe.main);
  const trim = hex(robe.trim);
  const roles: Role[] = new Array(WIZ.size * WIZ.size).fill(null);

  for (let i = 0; i < roles.length; i++) {
    const o = i * 4;
    if (d[o + 3] === 0) continue;
    const r: Role = m[o + 3] < 128 ? null : m[o] > 128 ? 'skin' : m[o + 1] > 128 ? 'hair' : m[o + 2] > 128 ? 'robe' : null;
    roles[i] = r;
    let out: RGB | null = null;
    if (r === 'skin') out = ramp(d[o], d[o + 1], d[o + 2], skin, REF.skin);
    else if (r === 'hair') out = ramp(d[o], d[o + 1], d[o + 2], hair, REF.hair);
    else if (r === 'robe') out = ramp(d[o], d[o + 1], d[o + 2], main, REF.robe);
    if (out) [d[o], d[o + 1], d[o + 2]] = out.map(Math.round);
  }

  // Robe pattern, plus a 2px trim along the hem.
  for (let x = 0; x < WIZ.size; x++) {
    let hem = 0;
    for (let y = WIZ.size - 1; y >= 0; y--) {
      const i = y * WIZ.size + x;
      if (roles[i] !== 'robe') {
        if (hem > 0) hem = 3; // only the lowest run of robe pixels in this column
        continue;
      }
      const o = i * 4;
      const isHem = hem < 2 && y > 70;
      if (isHem || patternAt(robe.pattern, x, y)) {
        const t = ramp(d[o], d[o + 1], d[o + 2], trim, REF.robe * 0.86);
        [d[o], d[o + 1], d[o + 2]] = t.map(Math.round);
      }
      hem++;
    }
  }
  ctx.putImageData(img, 0, WIZ.padTop);

  if (hat?.sprite) {
    const h = await loadSprite(hat.sprite);
    const x = Math.round(WIZ.headX - h.width / 2);
    const bottom = WIZ.padTop + WIZ.hatY + (hat.hatOffset ?? 0);
    clearAroundHat(ctx, h, x, bottom - h.height, bottom - 5);
    ctx.drawImage(h, x, bottom - h.height);
  }
  return c;
}

/**
 * Hair can't poke out through a hat. Above the brim line, erase wizard pixels
 * around the hat's outline. Pixels inside the outline are kept, so a see-through
 * gap inside a brim still shows the head instead of a hole.
 */
function clearAroundHat(ctx: CanvasRenderingContext2D, hat: HTMLImageElement, left: number, top: number, limitY: number) {
  const w = hat.width;
  const h = hat.height;
  const t = document.createElement('canvas').getContext('2d')!;
  t.canvas.width = w;
  t.canvas.height = h;
  t.drawImage(hat, 0, 0);
  const a = t.getImageData(0, 0, w, h).data;
  const solid = (x: number, y: number) => a[(y * w + x) * 4 + 3] > 0;

  // Flood-fill the transparent area reachable from the edges: that's "outside".
  const outside = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    const y = (i / w) | 0;
    if (outside[i] || solid(x, y)) continue;
    outside[i] = 1;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }

  const img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const d = img.data;
  for (let x = Math.max(0, left + 2); x < Math.min(ctx.canvas.width, left + w - 2); x++) {
    // Only clear above the hat's lowest pixel in this column, so hair under an overhang (mushroom cap) stays.
    let lowest = -1;
    for (let hy = h - 1; hy >= 0; hy--) if (solid(x - left, hy)) { lowest = hy; break; }
    if (lowest < 0) continue;
    for (let y = 0; y < Math.min(limitY, top + lowest); y++) {
      const hy = y - top;
      const inHat = hy >= 0 && hy < h && !outside[hy * w + (x - left)];
      if (!inHat) d[(y * ctx.canvas.width + x) * 4 + 3] = 0;
    }
  }
  ctx.putImageData(img, 0, 0);
}
