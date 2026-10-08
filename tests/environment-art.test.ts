import { describe, expect, it } from 'vitest';
import { trailPoint } from '../apps/game/src/environment-art';
import {
  obstacles,
  forestFootprint,
  sceneryFits,
  lakeColliders,
  lakes,
  lakeSpan,
  collides,
  move,
  WORLD,
  createWorld,
} from '@panda/shared';

describe('forest illustration geometry', () => {
  it('keeps complete canopies and rock silhouettes outside the camp and gate', () => {
    for (const o of obstacles.filter(
      (o) => o.kind === 'tree' || o.kind === 'rock',
    ))
      expect(sceneryFits(forestFootprint(o))).toBe(true);
    // An outside trunk with a canopy extending over the roof must be rejected.
    expect(sceneryFits(forestFootprint({ x: 320, y: 770, w: 32, h: 30 }))).toBe(
      false,
    );
    for (const [x, y] of [
      [300, 840],
      [390, 990],
      [510, 990],
      [570, 1140],
      [475, 1160],
    ])
      expect(sceneryFits({ x: x!, y: y!, w: 16, h: 16 })).toBe(false);
  });

  it('blocks water along the drawn shoreline and allows movement on the bank', () => {
    for (const band of lakeColliders)
      expect(collides(band.x + band.w / 2, band.y + band.h / 2, 0)).toBe(true);
    const lake = lakes[0]!;
    const y = 1000;
    const span = lakeSpan(lake, y)!;
    const p = { x: span.left - 16, y };
    expect(collides(p.x, p.y)).toBe(false);
    move(p, 10, 0);
    expect(p.x).toBe(span.left - 16);
    move(p, -10, 0);
    expect(p.x).toBe(span.left - 26);
    // The notch between the inlet and bay remains dry, even when a scanline
    // crosses two separate water intervals.
    expect(collides(930, 908, 0)).toBe(false);
    // The old southeast rectangular lake is now open meadow.
    expect(lakeSpan(lakes[1]!, 1080)).toBeUndefined();
    expect(lakes[1]!.every((p) => p.x > 1350 && p.y > 1160)).toBe(true);
  });

  it('preserves safe fixed spawns and camp interaction positions', () => {
    for (const point of [
      WORLD.spawn,
      WORLD.npc,
      WORLD.smith,
      WORLD.boss,
      ...createWorld().enemies,
    ])
      expect(collides(point.x, point.y)).toBe(false);
  });
  it('keeps the authored path anchored to the same playable areas', () => {
    expect(trailPoint(0)).toEqual({ x: 200, y: 1150 });
    expect(trailPoint(1)).toEqual({ x: 1580, y: 340 });
    expect(trailPoint(-4)).toEqual(trailPoint(0));
    expect(trailPoint(7)).toEqual(trailPoint(1));
  });

  it('forms a continuously advancing path through the forest', () => {
    const values = Array.from({ length: 101 }, (_, i) => trailPoint(i / 100));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!.x).toBeGreaterThan(values[i - 1]!.x);
      expect(values[i]!.y).toBeLessThanOrEqual(values[i - 1]!.y);
      expect(
        Math.hypot(
          values[i]!.x - values[i - 1]!.x,
          values[i]!.y - values[i - 1]!.y,
        ),
      ).toBeLessThan(24);
    }
  });
});
