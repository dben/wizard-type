/**
 * Builds the wizard picture from layers:
 *   base sprite (one per hair style, drawn with green hair, peach skin, grey robe)
 *   -> recolor skin, hair and robe -> robe pattern and hem -> hat.
 * The wand and pet are drawn separately so scenes can animate them.
 */
import type { ItemDef, RobeStyle } from '../content/types';
import type { WizardLook } from '../game/save';
import { hex, tint, type RGB } from './color';
import { loadSprite } from './sprites';

/** Geometry of the 96x96 base sprites, measured from the art. */
export const WIZ = {
  size: 96,
  /** Extra space above the base frame for tall hats. */
  padTop: 36,
  headX: 47,
  hatY: 25,
  handX: 72,
  handY: 53,
  feetY: 92,
} as const;

export const WIZ_CANVAS = { w: WIZ.size, h: WIZ.size + WIZ.padTop };

const REF = { skin: 207, hair: 130, robe: 176 };

type Role = 'skin' | 'hair' | 'robe' | null;

function role(r: number, g: number, b: number): Role {
  if (g > r + 40 && g > b + 30) return 'hair';
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 32 && max > 100) return 'robe';
  if (r > 185 && r > g && g > b && g > 115 && r - g < 75) return 'skin';
  return null;
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
  const base = await loadSprite(`wizard/base-${look.hair}`);
  const c = document.createElement('canvas');
  c.width = WIZ_CANVAS.w;
  c.height = WIZ_CANVAS.h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, WIZ.padTop);

  const img = ctx.getImageData(0, WIZ.padTop, WIZ.size, WIZ.size);
  const d = img.data;
  const skin = hex(look.skin);
  const hair = hex(look.hairColor);
  const main = hex(robe.main);
  const trim = hex(robe.trim);
  const roles: Role[] = new Array(WIZ.size * WIZ.size).fill(null);

  for (let i = 0; i < roles.length; i++) {
    const o = i * 4;
    if (d[o + 3] === 0) continue;
    const r = role(d[o], d[o + 1], d[o + 2]);
    roles[i] = r;
    let out: RGB | null = null;
    if (r === 'skin') out = tint(d[o], d[o + 1], d[o + 2], skin, REF.skin);
    else if (r === 'hair') out = tint(d[o], d[o + 1], d[o + 2], hair, REF.hair);
    else if (r === 'robe') out = tint(d[o], d[o + 1], d[o + 2], main, REF.robe);
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
        const t = tint(d[o], d[o + 1], d[o + 2], trim, REF.robe);
        [d[o], d[o + 1], d[o + 2]] = t.map(Math.round);
      }
      hem++;
    }
  }
  ctx.putImageData(img, 0, WIZ.padTop);

  if (hat?.sprite) {
    const h = await loadSprite(hat.sprite);
    const x = Math.round(WIZ.headX - h.width / 2);
    const y = Math.round(WIZ.padTop + WIZ.hatY + (hat.hatOffset ?? 0) - h.height);
    ctx.drawImage(h, x, y);
  }
  return c;
}
