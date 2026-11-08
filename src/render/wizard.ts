/**
 * Builds the wizard picture from layers:
 *   base sprite (one per hair style, drawn with green hair, peach skin, grey robe)
 *   -> recolor skin, hair and robe -> robe pattern and hem -> hat.
 * The wand and pet are drawn separately so scenes can animate them.
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
} as const;

export const WIZ_CANVAS = { w: WIZ.size, h: WIZ.size + WIZ.padTop };

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
