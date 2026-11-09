import { item } from '../content/items';
import type { Equipped, WizardLook } from '../game/save';
import { loadSprite } from './sprites';
import { drawWand } from './wand';
import { buildWizard, WIZ, WIZ_CANVAS } from './wizard';

const cache = new Map<string, Promise<string>>();
const DEFAULT_ROBE = { main: '#5b8fd6', trim: '#f2d36b' };

/** The wizard with hat and wand as a data URL (for <img>), cached by look + outfit. */
export function portraitUrl(look: WizardLook, eq: Pick<Equipped, 'hat' | 'robe' | 'wand'>): Promise<string> {
  const key = JSON.stringify([look, eq.hat, eq.robe, eq.wand]);
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      const robe = item(eq.robe)?.robe ?? DEFAULT_ROBE;
      const body = await buildWizard(look, robe, eq.hat ? item(eq.hat) : null);
      const c = document.createElement('canvas');
      c.width = WIZ_CANVAS.w + 16;
      c.height = WIZ_CANVAS.h;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(body, 0, 0);
      const wandPath = item(eq.wand)?.sprite;
      if (wandPath) {
        const wand = await loadSprite(wandPath);
        drawWand(ctx, wand, WIZ.handX, WIZ.padTop + WIZ.handY, 0.45);
      }
      return c.toDataURL();
    })();
    cache.set(key, p);
  }
  return p;
}

/** Same as the portrait but as a canvas, for scenes that animate the wand themselves. */
export async function bodyCanvas(look: WizardLook, eq: Pick<Equipped, 'hat' | 'robe'>) {
  const robe = item(eq.robe)?.robe ?? DEFAULT_ROBE;
  return buildWizard(look, robe, eq.hat ? item(eq.hat) : null);
}
