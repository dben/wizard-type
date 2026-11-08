/**
 * The trail on the world map (backgrounds/map.png, 688 x 384), from the tower
 * through the village, the farm fields, over the bridge, through the forest
 * and up to the dragon's cave. Lessons are spaced evenly along it.
 */
export const MAP_W = 688;
export const MAP_H = 384;

export const MAP_TRAIL: [number, number][] = [
  [110, 340], [160, 352], [210, 342], [250, 322], [282, 296], [262, 262], [222, 252], [188, 236],
  [160, 205], [128, 172], [100, 140], [118, 104], [165, 100], [212, 126], [258, 160], [312, 196],
  [366, 210], [412, 202], [454, 196], [496, 214], [534, 236], [566, 214], [552, 178], [528, 146],
  [538, 112], [560, 88], [578, 66],
];

/** n points spaced evenly along the trail. */
export function trailPoints(n: number): [number, number][] {
  const seg = MAP_TRAIL.slice(1).map((p, i) => Math.hypot(p[0] - MAP_TRAIL[i][0], p[1] - MAP_TRAIL[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  return Array.from({ length: n }, (_, k) => {
    let d = (total * k) / (n - 1);
    let i = 0;
    while (i < seg.length - 1 && d > seg[i]) d -= seg[i++];
    const t = Math.min(1, d / seg[i]);
    const [a, b] = [MAP_TRAIL[i], MAP_TRAIL[i + 1]];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  });
}
