/** Loads sprites from public/sprites and keeps them cached. */
const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

export const spriteUrl = (path: string) => `${import.meta.env.BASE_URL}sprites/${path}.png`;

export function loadSprite(path: string): Promise<HTMLImageElement> {
  const hit = cache.get(path);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(path);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        cache.set(path, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Missing sprite ${path}`));
      img.src = spriteUrl(path);
    });
    pending.set(path, p);
  }
  return p;
}

/** The sprite if it has finished loading. */
export const sprite = (path: string) => cache.get(path);

export const preload = (paths: Iterable<string>) => Promise.all([...new Set(paths)].map(loadSprite)).then(() => undefined);
