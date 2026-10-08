import { BAMBOO_SHRINE, type ShrineStage } from '@panda/shared';
import type Phaser from 'phaser';

/** Restrained pixel-art altar animation; visual only, even in multiplayer. */
export function drawShrineAura(
  graphics: Phaser.GameObjects.Graphics,
  stage: ShrineStage,
  time: number,
  reducedMotion: boolean,
): void {
  graphics.clear();
  const x = BAMBOO_SHRINE.x;
  const y = BAMBOO_SHRINE.y - 18;
  const t = reducedMotion ? 0 : time * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.45);
  const wake = stage !== 'dormant';
  const brightness = stage === 'blessed' ? 0.85 : wake ? 0.56 : 0.16;
  graphics.fillStyle(0x56caa1, brightness * (0.11 + pulse * 0.09));
  graphics.fillCircle(x, y, 29 + pulse * 10);
  graphics.lineStyle(2, stage === 'blessed' ? 0xe3efaa : 0x80d3ad, brightness * 0.52);
  graphics.strokeEllipse(x, y + 43, 91 + pulse * 8, 23 + pulse * 4);
  if (stage === 'dormant') return;
  // Two concentric rune arcs revolve very slowly without covering the altar.
  graphics.lineStyle(2, 0x8de4b9, brightness * 0.6);
  graphics.beginPath();
  graphics.arc(x, y, 39, t * 0.2, t * 0.2 + Math.PI * 0.72, false);
  graphics.strokePath();
  graphics.beginPath();
  graphics.arc(x, y, 39, t * 0.2 + Math.PI, t * 0.2 + Math.PI * 1.72, false);
  graphics.strokePath();
  const moteCount = stage === 'blessed' ? 12 : 7;
  for (let i = 0; i < moteCount; i++) {
    const a = (i / moteCount) * Math.PI * 2 + t * (i % 2 ? 0.13 : -0.1);
    const radius = 24 + (i % 3) * 11;
    const drift = reducedMotion ? 0 : Math.sin(t * 0.7 + i * 4.6) * 12;
    const px = Math.round(x + Math.cos(a) * radius);
    const py = Math.round(y + Math.sin(a) * 16 - 12 + drift);
    graphics.fillStyle(i % 3 ? 0xb4e8b5 : 0xf3d89e, brightness * 0.8);
    graphics.fillRect(px, py, i % 3 ? 3 : 4, i % 3 ? 3 : 4);
  }
}

/** New unique spirit made of jade plates, a glowing core and bamboo antlers. */
export function paintJadeWarden(ctx: CanvasRenderingContext2D): void {
  const px = (color: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  // Grounded 64px original spirit silhouette, compatible with enemy depth rules.
  px('#173d37', 15, 51, 36, 7);
  px('#285b52', 12, 31, 41, 23);
  px('#487e66', 9, 25, 47, 23);
  px('#7fbc8b', 14, 19, 36, 27);
  px('#b9d5a4', 18, 16, 27, 9);
  // Antlers branch outward rather than copying the forest wisp.
  for (const sign of [-1, 1]) {
    const anchor = sign < 0 ? 19 : 41;
    px('#2c5d47', anchor, 7, 6, 17);
    px('#83b687', anchor + sign * 9, 7, 12, 5);
    px('#c0d6a0', anchor + sign * 13, 3, 4, 8);
    px('#4a8f70', anchor + sign * 4, 11, 9, 6);
  }
  px('#234942', 20, 29, 24, 15);
  px('#d7ead1', 22, 31, 7, 5);
  px('#d7ead1', 37, 31, 7, 5);
  px('#1d3839', 25, 32, 4, 4);
  px('#1d3839', 39, 32, 4, 4);
  px('#d9f4ac', 31, 40, 5, 7);
  px('#64af91', 18, 47, 31, 4);
  px('#d7e4a9', 28, 20, 10, 3);
  px('#395b4f', 17, 51, 31, 4);
}
