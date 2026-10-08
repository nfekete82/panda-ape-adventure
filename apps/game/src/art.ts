import sheets from '../../../assets/hero-sheets.json';
import Phaser from 'phaser';
import { random, WORLD } from '@panda/shared';
import { paintForestWorld } from './environment-art';
import { conceptHero, conceptNpc } from './hero-design';
const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
};
const rect = (
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};
export const heroArt = conceptHero;
export const HERO_FRAME = { width: 64, height: 64, columns: 4, directions: 8 };
const activeStates: Record<'panda' | 'ape', string[]> = {
  panda: ['walk'],
  ape: ['walk'],
};
export function preloadHeroSheets(scene: Phaser.Scene) {
  for (const hero of ['panda', 'ape'] as const) {
    const source = sheets[hero].source;
    if (typeof source === 'string') scene.load.image(`${hero}-source`, source);
  }
}
export function heroFrame(
  hero: 'panda' | 'ape',
  state: string,
  direction: number,
  time: number,
): number {
  const block = Math.max(0, activeStates[hero].indexOf(state));
  const plantedAttack =
    (state === 'attack' || state === 'special') &&
    !activeStates[hero].includes(state);
  return (
    block * 32 +
    direction * 4 +
    (state === 'idle' || state === 'downed' || plantedAttack
      ? 0
      : Math.floor(time / 130) % 4)
  );
}
export function makeAssets(scene: Phaser.Scene) {
  for (const hero of ['panda', 'ape'] as const) {
    const external = scene.textures.exists(`${hero}-source`);
    const { c, ctx } = canvas(
      64 * 4,
      64 * 8 * (external ? sheets[hero].states.length : 1),
    );
    for (let dir = 0; dir < 8; dir++)
      for (let frame = 0; frame < 4; frame++) {
        ctx.save();
        ctx.translate(frame * 64, dir * 64);
        heroArt(ctx, hero, frame, dir, false);
        ctx.restore();
      }
    if (external) {
      const source: unknown = scene.textures
        .get(`${hero}-source`)
        .getSourceImage();
      if (source instanceof HTMLImageElement) {
        ctx.drawImage(source, 0, 0);
        activeStates[hero] = sheets[hero].states;
      }
    }
    const texture = scene.textures.addCanvas(hero, c)!;
    scene.textures.addSpriteSheet(hero, texture, {
      frameWidth: 64,
      frameHeight: 64,
    });
  }
  for (const kind of ['slime', 'wolf', 'wisp', 'guardian']) {
    const { c, ctx } = canvas(64, 64);
    ctx.scale(2, 2);
    if (kind === 'slime') {
      rect(ctx, '#213d34', 4, 21, 24, 8);
      rect(ctx, '#5eac77', 5, 15, 22, 12);
      rect(ctx, '#91cf81', 8, 11, 16, 12);
      rect(ctx, '#b9e59a', 10, 12, 8, 3);
      rect(ctx, '#213b39', 11, 20, 3, 4);
      rect(ctx, '#213b39', 21, 20, 3, 4);
      rect(ctx, '#fff2c1', 11, 20, 1, 1);
    }
    if (kind === 'wolf') {
      rect(ctx, '#364353', 5, 15, 21, 12);
      rect(ctx, '#647a8b', 8, 12, 17, 11);
      rect(ctx, '#839aaa', 17, 8, 11, 11);
      rect(ctx, '#354451', 18, 5, 3, 7);
      rect(ctx, '#354451', 25, 5, 3, 7);
      rect(ctx, '#e3a769', 22, 13, 2, 2);
      rect(ctx, '#d9dcce', 24, 18, 6, 4);
      rect(ctx, '#293641', 5, 25, 5, 5);
      rect(ctx, '#293641', 20, 25, 5, 5);
      rect(ctx, '#7c93a2', 1, 12, 7, 5);
    }
    if (kind === 'wisp') {
      rect(ctx, '#5a4480', 7, 9, 18, 16);
      rect(ctx, '#ab7dc3', 10, 5, 12, 21);
      rect(ctx, '#dfb5e0', 12, 9, 8, 12);
      rect(ctx, '#faf1e9', 14, 11, 4, 5);
      rect(ctx, '#8f659f', 5, 25, 5, 3);
      rect(ctx, '#8f659f', 23, 25, 4, 3);
    }
    if (kind === 'guardian') {
      rect(ctx, '#354338', 5, 12, 23, 18);
      rect(ctx, '#68754e', 8, 7, 17, 19);
      rect(ctx, '#849565', 10, 7, 13, 5);
      rect(ctx, '#ae9365', 11, 12, 11, 9);
      rect(ctx, '#eff398', 12, 14, 3, 3);
      rect(ctx, '#eff398', 19, 14, 3, 3);
      rect(ctx, '#3e4a32', 2, 14, 6, 14);
      rect(ctx, '#3e4a32', 26, 13, 5, 15);
      rect(ctx, '#8b7652', 6, 3, 4, 8);
      rect(ctx, '#8b7652', 23, 2, 4, 9);
      rect(ctx, '#8b7652', 3, 1, 7, 3);
      rect(ctx, '#8b7652', 23, 0, 8, 3);
      rect(ctx, '#b0c574', 9, 1, 4, 5);
      rect(ctx, '#b0c574', 27, 4, 5, 4);
    }
    scene.textures.addCanvas(kind, c);
  }
  for (const [key, kind] of [
    ['npc', 'rowan'],
    ['bramble', 'bramble'],
  ] as const) {
    const { c, ctx } = canvas(64, 64);
    conceptNpc(ctx, kind);
    scene.textures.addCanvas(key, c);
  }
  const { c, ctx } = canvas(WORLD.width, WORLD.height);
  const worldAtlas: unknown = scene.textures.exists('vendor-world-tiles')
    ? scene.textures.get('vendor-world-tiles').getSourceImage()
    : undefined;
  paintForestWorld(
    ctx,
    worldAtlas instanceof HTMLImageElement ? worldAtlas : undefined,
  );
  scene.textures.addCanvas('forest', c);
  const tree = canvas(128, 160);
  const t = tree.ctx;
  rect(t, '#684f35', 57, 84, 16, 65);
  rect(t, '#a07744', 59, 84, 5, 55);
  rect(t, '#533f2e', 48, 137, 36, 8);
  // Original broadleaf: stepped leaf lobes, shadowed undersides and a warm
  // sunward crown. Draw on a 2px grid, keeping the existing 128x160 contract.
  const lobes = [
    [39, 71, 27],
    [85, 72, 29],
    [64, 85, 30],
    [31, 52, 23],
    [94, 51, 23],
    [62, 50, 38],
    [61, 30, 25],
  ] as const;
  for (const [x, y, radius] of lobes) {
    for (let row = -radius; row <= radius; row += 2) {
      const width = Math.floor(Math.sqrt(radius * radius - row * row) / 2) * 2;
      const height = y + row;
      const shade =
        height > 94
          ? '#2e5740'
          : height > 76
            ? '#3e7248'
            : height > 44
              ? '#50854c'
              : '#659651';
      rect(t, shade, x - width, y + row, width * 2, 2);
    }
    for (let i = 0; i < 12; i++) {
      const px = x + Math.sin(i * 2.4) * radius * 0.68;
      const py = y - radius * 0.35 + Math.cos(i * 3.1) * radius * 0.35;
      rect(t, i % 3 ? '#689957' : '#88ac68', px, py, 6, 2);
      rect(t, '#487c49', px + 2, py + 3, 5, 2);
    }
  }
  // Leaf clusters break up the canopy's broad colour bands. Lighting follows
  // the whole crown, so overlapping lobes do not leave concentric dark disks.
  const leaves = random(4492);
  for (let i = 0; i < 190; i++) {
    const angle = leaves() * Math.PI * 2,
      radius = Math.sqrt(leaves());
    const x = Math.round((64 + Math.cos(angle) * radius * 43) / 2) * 2;
    const y = Math.round((60 + Math.sin(angle) * radius * 39) / 2) * 2;
    const light = y + x * 0.22;
    const color = light > 96 ? '#427549' : light > 75 ? '#5a8c4f' : '#79a45b';
    const width = 4 + Math.floor(leaves() * 3) * 2;
    rect(t, color, x - width / 2, y, width, 2);
    rect(
      t,
      light > 92 ? '#376944' : '#518149',
      x - width / 2 + 2,
      y + 2,
      width,
      2,
    );
    if (i % 5 === 0) rect(t, '#9db870', x, y - 2, 4, 2);
  }
  rect(t, '#b49357', 60, 106, 3, 28);
  rect(t, '#3f6140', 49, 137, 8, 3);
  scene.textures.addCanvas('tree', tree.c);
}
