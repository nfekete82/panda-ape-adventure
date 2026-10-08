import { describe, expect, it } from 'vitest';
import {
  bambooRiverColliders,
  bambooRiverSpan,
  bambooObstacles,
  bambooStands,
  BAMBOO_WORLD_WIDTH,
  BAMBOO_BRIDGE,
  BAMBOO_SHRINE,
  worldRegion,
  WORLD,
  obstacles,
  collides,
  move,
  createWorld,
} from '@panda/shared';
import { bambooGroundBlend, bambooTrailY } from '../apps/game/src/bamboo-art';
import { treePresentation } from '../apps/game/src/world-atmosphere';

describe('Bamboo Crossing world extension', () => {
  it('expands the world east without moving the original forest landmarks', () => {
    expect(WORLD.width).toBe(BAMBOO_WORLD_WIDTH);
    expect(WORLD.spawn).toEqual({ x: 430, y: 1040 });
    expect(WORLD.boss).toEqual({ x: 1580, y: 340 });
    expect(worldRegion(1880)).toBe('forest');
    expect(worldRegion(1980)).toBe('bamboo');
  });

  it('uses the exact authoritative river bounds, leaving only the walkable bridge corridor', () => {
    expect(bambooRiverColliders.length).toBeGreaterThan(120);
    for (const band of bambooRiverColliders) {
      const span = bambooRiverSpan(band.y + band.h / 2);
      expect(band.x).toBe(span.left);
      expect(band.w).toBe(span.right - span.left);
      expect(collides(band.x + band.w / 2, band.y + 4, 0)).toBe(true);
      expect(
        band.y < BAMBOO_BRIDGE.y || band.y >= BAMBOO_BRIDGE.y + BAMBOO_BRIDGE.h,
      ).toBe(true);
    }
    expect(collides(2280, 350)).toBe(true);
    expect(collides(2280, 460)).toBe(false);
    expect(collides(2280, 550)).toBe(true);
  });

  it('allows both characters to traverse the drawn road and wooden bridge', () => {
    for (let x = 1920; x <= 2670; x += 10) {
      const y = bambooTrailY(x);
      expect(collides(x, y, 14)).toBe(false);
    }
    const hero = { x: 2120, y: 460 };
    for (let n = 0; n < 28; n++) move(hero, 10, 0);
    expect(hero.x).toBe(2400);
    expect(collides(BAMBOO_SHRINE.x, BAMBOO_SHRINE.y, 14)).toBe(false);
  });

  it('places new bamboo in coherent groves clear of the crossing and shrine', () => {
    expect(bambooObstacles).toHaveLength(bambooStands.length);
    for (const o of bambooObstacles) {
      expect(o.x).toBeGreaterThan(1920);
      expect(o.x + o.w).toBeLessThan(WORLD.width);
      expect(Math.abs(o.y + o.h - bambooTrailY(o.x + o.w / 2))).toBeGreaterThan(
        90,
      );
      expect(
        obstacles.some((t) => t.kind === 'tree' && t.x === o.x && t.y === o.y),
      ).toBe(true);
      expect([
        'tree-bamboo',
        'tree-bamboo-tall',
        'tree-bamboo-young',
      ]).toContain(treePresentation(o.x, o.y).texture);
    }
  });

  it('awards two discoverable crystals in new adventures with no schema change', () => {
    const world = createWorld();
    expect(world.loot.find((item) => item.id === 'shrine-crystals')).toEqual({
      id: 'shrine-crystals',
      x: 2640,
      y: 498,
      kind: 'crystal',
      quantity: 2,
    });
  });
  it('blends the two biomes smoothly rather than drawing a hard vertical seam', () => {
    expect(bambooGroundBlend(1725)).toBe(0);
    expect(bambooGroundBlend(2110)).toBe(1);
    const samples = Array.from({ length: 40 }, (_, i) =>
      bambooGroundBlend(1730 + i * 9),
    );
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!).toBeGreaterThanOrEqual(samples[i - 1]!);
      expect(samples[i]! - samples[i - 1]!).toBeLessThan(0.05);
    }
  });

  it('curves the river visibly while keeping the bridge exactly where it was', () => {
    const upper = bambooRiverSpan(100);
    const below = bambooRiverSpan(940);
    const bridge = bambooRiverSpan(463);
    expect(bridge.left).toBe(2219);
    expect(bridge.right).toBe(2351);
    expect(Math.abs(upper.left - below.left)).toBeGreaterThan(15);
    const widths = [100, 230, 460, 700, 940, 1200].map((y) => {
      const span = bambooRiverSpan(y);
      return span.right - span.left;
    });
    expect(Math.max(...widths) - Math.min(...widths)).toBeGreaterThan(18);
    expect(collides((upper.left + upper.right) / 2, 100, 10)).toBe(true);
    expect(collides(2280, 460, 14)).toBe(false);
  });

  it('uses several deterministic bamboo silhouettes without modifying their footprints', () => {
    const textures = new Set(
      bambooObstacles.map((o) => treePresentation(o.x, o.y).texture),
    );
    expect(textures).toEqual(
      new Set(['tree-bamboo', 'tree-bamboo-tall', 'tree-bamboo-young']),
    );
    for (const [index, o] of bambooObstacles.entries()) {
      expect(o.w).toBe(34);
      expect(o.h).toBe(34);
      expect(treePresentation(o.x, o.y)).toEqual(treePresentation(o.x, o.y));
      expect(index).toBeGreaterThanOrEqual(0);
    }
  });
});
