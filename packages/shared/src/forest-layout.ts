/** Authored scenery geometry. Pure data/math used by collision and rendering. */
export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface ShorePoint {
  x: number;
  y: number;
}
export const sceneryKeepOut: readonly Bounds[] = [
  // Includes the smithy roof/chimney, woodpile, both NPCs and their labels,
  // bench, lantern, fire and the open space between them.
  { x: 195, y: 790, w: 440, h: 420 },
  // Gate pillars and sign.
  { x: 1748, y: 190, w: 160, h: 205 },
];
export function sceneryFits(bounds: Bounds): boolean {
  return !sceneryKeepOut.some(
    (zone) =>
      bounds.x < zone.x + zone.w &&
      bounds.x + bounds.w > zone.x &&
      bounds.y < zone.y + zone.h &&
      bounds.y + bounds.h > zone.y,
  );
}
/** Conservative canopy envelope, including shadow and the small sway. */
export function forestFootprint(o: Bounds): Bounds {
  return { x: o.x + o.w / 2 - 66, y: o.y + o.h - 153, w: 132, h: 170 };
}
function roundedShore(points: readonly ShorePoint[]): ShorePoint[] {
  return points.flatMap((p, i) => {
    const prev = points[(i + points.length - 1) % points.length]!;
    const next = points[(i + 1) % points.length]!;
    const start = { x: (prev.x + p.x) / 2, y: (prev.y + p.y) / 2 };
    const end = { x: (next.x + p.x) / 2, y: (next.y + p.y) / 2 };
    return Array.from({ length: 6 }, (_, step) => {
      const t = step / 6,
        u = 1 - t;
      return {
        x: u * u * start.x + 2 * u * t * p.x + t * t * end.x,
        y: u * u * start.y + 2 * u * t * p.y + t * t * end.y,
      };
    });
  });
}
const authoredLakes: readonly (readonly ShorePoint[])[] = [
  // Broad western bay, narrow northern inlet and a rounded eastern shoulder.
  [
    { x: 810, y: 960 },
    { x: 829, y: 925 },
    { x: 873, y: 908 },
    { x: 930, y: 918 },
    { x: 970, y: 886 },
    { x: 1015, y: 890 },
    { x: 1039, y: 925 },
    { x: 1090, y: 935 },
    { x: 1137, y: 969 },
    { x: 1150, y: 1007 },
    { x: 1134, y: 1050 },
    { x: 1100, y: 1087 },
    { x: 1050, y: 1112 },
    { x: 987, y: 1120 },
    { x: 939, y: 1106 },
    { x: 903, y: 1080 },
    { x: 847, y: 1066 },
    { x: 815, y: 1035 },
    { x: 798, y: 994 },
  ],
  // A quiet little pond well southeast of the main lake.
  [
    { x: 1372, y: 1210 },
    { x: 1396, y: 1176 },
    { x: 1440, y: 1168 },
    { x: 1465, y: 1185 },
    { x: 1501, y: 1195 },
    { x: 1520, y: 1225 },
    { x: 1508, y: 1260 },
    { x: 1470, y: 1289 },
    { x: 1422, y: 1295 },
    { x: 1389, y: 1274 },
    { x: 1367, y: 1240 },
  ],
];
export const lakes: readonly (readonly ShorePoint[])[] =
  authoredLakes.map(roundedShore);
/** Scan the same polygon used to draw water. No hidden rectangular lake wall. */
export function lakeSpans(points: readonly ShorePoint[], y: number) {
  const crossings: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y))
      crossings.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
  }
  crossings.sort((a, b) => a - b);
  const spans: { left: number; right: number }[] = [];
  for (let i = 0; i + 1 < crossings.length; i += 2)
    spans.push({ left: crossings[i]!, right: crossings[i + 1]! });
  return spans;
}
/** Reflections use a single continuous patch, never crossing a dry inlet. */
export function lakeSpan(points: readonly ShorePoint[], y: number) {
  return lakeSpans(points, y).sort(
    (a, b) => b.right - b.left - (a.right - a.left),
  )[0];
}
/** Four-pixel bands keep the existing rectangle collision/sliding algorithm. */
export const lakeColliders: Bounds[] = lakes.flatMap((points) => {
  const result: Bounds[] = [];
  const top = Math.min(...points.map((p) => p.y));
  const bottom = Math.max(...points.map((p) => p.y));
  for (let y = top; y < bottom; y += 4) {
    const h = Math.min(4, bottom - y);
    for (const span of lakeSpans(points, y + h / 2))
      result.push({ x: span.left, y, w: span.right - span.left, h });
  }
  return result;
});
