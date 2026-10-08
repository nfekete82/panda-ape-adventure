import { describe, expect, it } from 'vitest';
import {
  paintWoodlandTree,
  paintWoodlandEnemy,
  WOODLAND,
} from '../apps/game/src/world-style';

/** Minimal software raster verifies the production painters without DOM/Phaser. */
class Raster {
  fillStyle = '';
  readonly pixels: string[];
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.pixels = Array.from({ length: width * height }, () => '');
  }
  fillRect(x: number, y: number, w: number, h: number) {
    expect([x, y, w, h].every(Number.isInteger)).toBe(true);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + w).toBeLessThanOrEqual(this.width);
    expect(y + h).toBeLessThanOrEqual(this.height);
    for (let py = y; py < y + h; py++)
      for (let px = x; px < x + w; px++)
        this.pixels[py * this.width + px] = this.fillStyle;
  }
  at(x: number, y: number) {
    return this.pixels[y * this.width + x];
  }
}

describe('woodland art contracts and silhouette readability', () => {
  it('fits both related tree species inside their existing canopy envelope', () => {
    for (const kind of ['broadleaf', 'conifer'] as const) {
      const raster = new Raster(128, 160);
      paintWoodlandTree(raster, kind);
      expect(raster.pixels.filter(Boolean).length).toBeGreaterThan(4500);
      // Shared substantial trunk/root grounding and a transparent perimeter.
      expect(raster.at(60, 130)).toBe(WOODLAND.barkLight);
      expect(raster.at(64, 144)).toBe(WOODLAND.barkDark);
      expect(raster.at(0, 80)).toBe('');
      expect(raster.at(127, 80)).toBe('');
      expect(raster.at(64, 159)).toBe('');
    }
  });
  it('keeps four instantly distinct enemy silhouettes, readable faces and no clipping', () => {
    const silhouettes = new Set<string>();
    for (const kind of ['slime', 'wolf', 'wisp', 'guardian'] as const) {
      const raster = new Raster(64, 64);
      paintWoodlandEnemy(raster, kind);
      expect(raster.pixels.filter(Boolean).length).toBeGreaterThan(650);
      expect(
        raster.pixels.filter((color) => color === WOODLAND.ink).length,
      ).toBeGreaterThan(70);
      const face =
        kind === 'slime'
          ? [23, 39]
          : kind === 'wolf'
            ? [36, 26]
            : kind === 'wisp'
              ? [25, 29]
              : [24, 25];
      expect(raster.at(face[0]!, face[1]!)).toBe(
        kind === 'guardian' ? '#e0d998' : WOODLAND.cream,
      );
      silhouettes.add(
        raster.pixels.map((color) => (color ? '1' : '0')).join(''),
      );
    }
    expect(silhouettes.size).toBe(4);
  });
});
