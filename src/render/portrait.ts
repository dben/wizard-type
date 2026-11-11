import { item } from '../content/items';
import type { Equipped, WizardLook } from '../game/save';
import { loadSprite } from './sprites';
import { buildWizard, drawWand, walkFrames, wandRest, WIZ, WIZ_CANVAS } from './wizard';

const cache = new Map<string, Promise<string[]>>();
const DEFAULT_ROBE = { main: '#5b8fd6', trim: '#f2d36b' };

type Outfit = Pick<Equipped, 'hat' | 'robe' | 'wand'>;

/** The wizard with hat and wand as data URLs (for <img>): standing first, then the walk cycle. Cached by look + outfit. */
function frames(look: WizardLook, eq: Outfit): Promise<string[]> {
  const key = JSON.stringify([look, eq.hat, eq.robe, eq.wand]);
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      const robe = item(eq.robe)?.robe ?? DEFAULT_ROBE;
      const body = await buildWizard(look, robe, eq.hat ? item(eq.hat) : null);
      const wand = item(eq.wand);
      const wandImg = wand?.sprite ? await loadSprite(wand.sprite) : null;
      const staff = !!wand?.staff;
      return [body, ...walkFrames(body)].map((b, i) => {
        const c = document.createElement('canvas');
        c.width = WIZ_CANVAS.w + 16;
        c.height = WIZ_CANVAS.h;
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(b, 0, 0);
        // The hand lifts with the body on the passing steps (every second walk frame).
        const lift = i > 0 && i % 2 === 0 ? 1 : 0;
        if (wandImg) drawWand(ctx, wandImg, WIZ.handX, WIZ.padTop + WIZ.handY - lift, wandRest(staff), staff);
        return c.toDataURL();
      });
    })();
    cache.set(key, p);
  }
  return p;
}

export const portraitUrl = (look: WizardLook, eq: Outfit): Promise<string> => frames(look, eq).then((f) => f[0]);

/** Standing picture plus the walk cycle, for the room. */
export const walkUrls = (look: WizardLook, eq: Outfit) => frames(look, eq).then(([stand, ...walk]) => ({ stand, walk }));

/** Same as the portrait but as a canvas, for scenes that animate the wand themselves. */
export async function bodyCanvas(look: WizardLook, eq: Pick<Equipped, 'hat' | 'robe'>) {
  const robe = item(eq.robe)?.robe ?? DEFAULT_ROBE;
  return buildWizard(look, robe, eq.hat ? item(eq.hat) : null);
}
