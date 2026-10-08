import type Phaser from 'phaser';
import { lakes, lakeSpan, random, WORLD } from '@panda/shared';

/** Resolve spans once. Animation never scans polygons or allocates particles. */
export const waterHighlights = lakes.flatMap((lake) => {
  const top = Math.min(...lake.map((p) => p.y));
  const bottom = Math.max(...lake.map((p) => p.y));
  return Array.from({ length: 9 }, (_, n) => {
    const y = top + 22 + (n * (bottom - top - 44)) / 9;
    const span = lakeSpan(lake, y);
    return span && span.right - span.left > 65
      ? [
          {
            x: span.left + 16,
            y,
            travel: span.right - span.left - 54,
            phase: n * 37,
          },
        ]
      : [];
  }).flat();
});

export function treePresentation(x: number, y: number) {
  const seed = Math.abs(Math.floor(x * 7 + y * 11));
  return {
    // Fir groves belong mainly to the cooler northern ridge. Variety follows
    // region and small groups rather than independent species scatter.
    texture:
      x >= 1930
        ? ['tree-bamboo', 'tree-bamboo-tall', 'tree-bamboo-young'][seed % 3]
        : (y < 620 && x > 920) || Math.floor(x / 240 + y / 180) % 5 === 0
          ? 'tree-conifer'
          : 'tree',
    scale: 0.91 + (seed % 4) * 0.03,
    flip: seed % 2 === 0,
    tint: x >= 1930 ? 0xf4f7e1 : y < 520 ? 0xe1e9d7 : 0xffffff,
  };
}

export class WorldAtmosphere {
  private readonly water: Phaser.GameObjects.Graphics;
  private readonly air: Phaser.GameObjects.Graphics;
  private readonly motes;
  constructor(scene: Phaser.Scene) {
    this.water = scene.add.graphics().setDepth(1);
    this.air = scene.add.graphics().setDepth(2100);
    const rng = random(7342);
    this.motes = Array.from({ length: 64 }, () => ({
      x: rng() * WORLD.width,
      y: rng() * WORLD.height,
      phase: rng() * Math.PI * 2,
      speed: 0.003 + rng() * 0.004,
    }));
    // Small pools of hearth/lantern light, baked into scene objects once.
    for (const [x, y, w, h] of [
      [570, 1141, 76, 35],
      [480, 1145, 43, 24],
      [253, 1020, 55, 24],
    ] as const) {
      scene.add.ellipse(x, y, w, h, 0xffc275, 0.07).setDepth(2);
      scene.add.ellipse(x, y, w * 0.6, h * 0.6, 0xffdba2, 0.08).setDepth(2);
    }
  }
  get moteCount(): number {
    return this.motes.length;
  }
  get reflectionCount(): number {
    return waterHighlights.length;
  }
  draw(time: number, reducedMotion: boolean) {
    const clock = reducedMotion ? 0 : time;
    this.water.clear();
    for (const p of waterHighlights) {
      const x = p.x + ((clock * 0.003 + p.phase) % p.travel);
      const alpha = 0.16 + Math.sin(clock * 0.0007 + p.phase) * 0.07;
      this.water.lineStyle(1, 0xb3e3d0, alpha);
      this.water.lineBetween(x, p.y, x + 17, p.y);
      this.water.lineBetween(x + 4, p.y + 3, x + 10, p.y + 3);
    }
    this.air.clear();
    for (const p of this.motes) {
      const x = (p.x + clock * p.speed) % WORLD.width;
      const y = p.y + Math.sin(clock * 0.0004 + p.phase) * 9;
      this.air.fillStyle(
        0xf1e9b7,
        0.12 + (1 + Math.sin(clock * 0.001 + p.phase)) * 0.1,
      );
      this.air.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
    // Six small translucent chimney puffs; no emitter growth or allocations.
    for (let n = 0; n < 6; n++) {
      const age = (clock * 0.00007 + n / 6) % 1;
      this.air.fillStyle(0xc3cbb6, (1 - age) * 0.15);
      this.air.fillRect(
        Math.round(351 + Math.sin(age * 5 + n) * 6 + age * 15),
        Math.round(788 - age * 65),
        5 + Math.round(age * 7),
        4 + Math.round(age * 4),
      );
    }
  }
}
