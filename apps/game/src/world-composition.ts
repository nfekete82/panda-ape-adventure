import { WORLD, type Bounds } from '@panda/shared';

/** Quiet open centres and darker framed groves; these are colour fields only. */
export const forestRegions = [
  { x: 300, y: 350, rx: 320, ry: 260, light: -0.8 },
  { x: 760, y: 500, rx: 245, ry: 210, light: 1.0 },
  { x: 1240, y: 230, rx: 360, ry: 230, light: -0.9 },
  { x: 1540, y: 850, rx: 290, ry: 280, light: -0.6 },
  { x: 640, y: 1310, rx: 300, ry: 170, light: 0.7 },
] as const;
export function regionLight(x: number, y: number): number {
  let light = 0;
  for (const region of forestRegions) {
    const distance = Math.hypot(
      (x - region.x) / region.rx,
      (y - region.y) / region.ry,
    );
    if (distance < 1) light += (1 - distance) * region.light;
  }
  return light;
}
export const FORGE_BOUNDS: Bounds = { x: 228, y: 790, w: 186, h: 199 };
/** Presentation envelopes reserve head/label/feet space and the forge foundation. */
export function hubFurnitureFits(bounds: Bounds): boolean {
  const overlaps = (other: Bounds) =>
    bounds.x < other.x + other.w &&
    bounds.x + bounds.w > other.x &&
    bounds.y < other.y + other.h &&
    bounds.y + bounds.h > other.y;
  return (
    ![WORLD.npc, WORLD.smith, WORLD.spawn].some((point) =>
      overlaps({
        x: point.x - 35,
        y: point.y - 65,
        w: 70,
        h: 95,
      }),
    ) && !overlaps(FORGE_BOUNDS)
  );
}
