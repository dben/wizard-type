export type RGB = [number, number, number];

export function hex(c: string): RGB {
  const n = parseInt(c.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

export const shade = (c: string, f: number): string => {
  const [r, g, b] = hex(c).map((v) => Math.round(Math.max(0, Math.min(255, v * f))));
  return `rgb(${r},${g},${b})`;
};

/** f < 1 darkens toward a deep plum (keeps shadows from going grey), f > 1 lightens toward white. */
export function shadeRGB(c: RGB, f: number): RGB {
  if (f <= 1) {
    const shadow: RGB = [40, 20, 50];
    return c.map((v, i) => Math.round(v * f + shadow[i] * (1 - f) * 0.35)) as RGB;
  }
  const k = (f - 1) * 1.3;
  return c.map((v) => Math.round(v + (255 - v) * k)) as RGB;
}
