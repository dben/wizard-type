/**
 * The trail on the world map, from the tower through the village, past the
 * farm and the windmill, over the bridge, through the forest and up the steps
 * to the dragon's cave. Lessons are spaced evenly along it.
 *
 * Points are in map units (688 x 384). backgrounds/map.png is drawn at twice
 * that, so re-plot the trail whenever the map is regenerated.
 */
export const MAP_W = 688;
export const MAP_H = 384;

export const MAP_TRAIL: [number, number][] = [
  [92, 326], [120, 310], [150, 297], [190, 298], [235, 300], [278, 297], [268, 264], [255, 240],
  [225, 228], [195, 228], [172, 245], [150, 212], [135, 185], [126, 160], [148, 146], [178, 131],
  [215, 122], [258, 125], [285, 150], [305, 178], [328, 200], [352, 194], [385, 185], [410, 175],
  [440, 170], [465, 182], [490, 205], [520, 220], [552, 222], [572, 205], [576, 180], [584, 160],
  [586, 130], [596, 112], [612, 98],
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
