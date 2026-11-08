export type RGB = [number, number, number];

export function hex(c: string): RGB {
  const n = parseInt(c.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Recolor a pixel to `target`, keeping its light/shade relative to `refLum`. */
export function tint(r: number, g: number, b: number, target: RGB, refLum: number): RGB {
  const f = lum(r, g, b) / refLum;
  if (f <= 1) return [target[0] * f, target[1] * f, target[2] * f];
  const k = Math.min(1, (f - 1) * 2);
  return [target[0] + (255 - target[0]) * k, target[1] + (255 - target[1]) * k, target[2] + (255 - target[2]) * k];
}

export const shade = (c: string, f: number): string => {
  const [r, g, b] = hex(c).map((v) => Math.round(Math.max(0, Math.min(255, v * f))));
  return `rgb(${r},${g},${b})`;
};
