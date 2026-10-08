import { describe, expect, it } from 'vitest';
import { trailPoint } from '../apps/game/src/environment-art';

describe('forest illustration geometry', () => {
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
