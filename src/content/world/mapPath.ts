/**
 * The trail on the world map (backgrounds/map.png, 1376 x 768), from the tower
 * through the village, over the bridge, around the bend to the mountain and up
 * to the dragon's cave. Lessons are spaced evenly along it. Traced by eye from
 * the painted path, so re-trace it if the map is regenerated.
 */
export const MAP_W = 1376;
export const MAP_H = 768;

export const MAP_TRAIL: [number, number][] = [
  [215, 650], [265, 632], [300, 595], [322, 545], [340, 500], [385, 462], [450, 448], [520, 462],
  [590, 470], [650, 452], [705, 425], [765, 408], [830, 395], [880, 388], [915, 400], [950, 425],
  [990, 470], [1030, 505], [1075, 515], [1110, 495], [1125, 455], [1110, 420], [1085, 400], [1065, 380],
  [1070, 360], [1100, 345], [1112, 322], [1085, 290], [1065, 255], [1045, 230], [1045, 205], [1070, 195],
  [1110, 180], [1135, 165], [1152, 140],
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
