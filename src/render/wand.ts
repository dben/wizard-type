/**
 * Where a wand is held. Most wands are straight with the handle at the bottom
 * center, but some are drawn at an angle (the feather) or off to one side (the
 * candy cane). Measuring the sprite puts the grip in the wizard's hand for all
 * of them and straightens the ones that lean a lot.
 */

/** Pixels of handle that stick out below the hand. */
export const HOLD = 6;
/** Leans smaller than this are part of the art (hooks, crescents), not a tilted wand. */
const MAX_LEAN = (15 * Math.PI) / 180;

export interface WandShape {
  /** Sprite x of the handle. */
  grip: number;
  /** Radians the sprite leans clockwise from straight up. 0 for ordinary wands. */
  tilt: number;
  /** Hand to tip, in pixels. */
  length: number;
}

/** `alpha` is one value per pixel, row by row. */
export function measureWand(alpha: ArrayLike<number>, w: number, h: number): WandShape {
  const rowMean = (y0: number, y1: number) => {
    let sum = 0;
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = 0; x < w; x++) if (alpha[y * w + x] > 0) (sum += x, n++);
    return n ? sum / n : w / 2;
  };
  let top = 0;
  let bottom = h - 1;
  const empty = (y: number) => { for (let x = 0; x < w; x++) if (alpha[y * w + x] > 0) return false; return true; };
  while (top < bottom && empty(top)) top++;
  while (bottom > top && empty(bottom)) bottom--;

  const grip = rowMean(Math.max(top, bottom - 3), bottom);
  const tipX = rowMean(top, Math.min(bottom, top + 3));
  const vx = tipX - grip;
  const vy = top - (h - HOLD);
  const lean = Math.atan2(vx, -vy);
  const tilt = Math.abs(lean) < MAX_LEAN ? 0 : lean;
  return { grip, tilt, length: tilt === 0 ? -vy : Math.hypot(vx, vy) };
}

const cache = new WeakMap<HTMLImageElement, WandShape>();

export function wandShape(img: HTMLImageElement): WandShape {
  let s = cache.get(img);
  if (!s) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, img.width, img.height).data;
    const alpha = new Uint8Array(img.width * img.height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = px[i * 4 + 3];
    s = measureWand(alpha, img.width, img.height);
    cache.set(img, s);
  }
  return s;
}

/** Draw a wand with its handle at (x, y), pointing `angle` radians clockwise from straight up. */
export function drawWand(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, angle: number) {
  const s = wandShape(img);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle - s.tilt);
  ctx.drawImage(img, -Math.round(s.grip), -(img.height - HOLD));
  ctx.restore();
}

/** Where the tip ends up, relative to the hand. */
export function wandTipOffset(img: HTMLImageElement | undefined, angle: number): [number, number] {
  const len = img ? wandShape(img).length : 34;
  return [Math.sin(angle) * len, -Math.cos(angle) * len];
}
