import sheets from '../../../assets/hero-sheets.json';
import Phaser from 'phaser';
import { WORLD } from '@panda/shared';
import { paintForestWorld } from './environment-art';
import { conceptHero, conceptNpc } from './hero-design';
import {
  paintWoodlandTree,
  paintWoodlandEnemy,
  TREE_FRAME,
  ENEMY_FRAME,
} from './world-style';
const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
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
  for (const kind of ['slime', 'wolf', 'wisp', 'guardian'] as const) {
    const { c, ctx } = canvas(ENEMY_FRAME.width, ENEMY_FRAME.height);
    paintWoodlandEnemy(ctx, kind);
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
  paintForestWorld(ctx);
  scene.textures.addCanvas('forest', c);
  for (const kind of ['broadleaf', 'conifer'] as const) {
    const tree = canvas(TREE_FRAME.width, TREE_FRAME.height);
    paintWoodlandTree(tree.ctx, kind);
    scene.textures.addCanvas(
      kind === 'broadleaf' ? 'tree' : 'tree-conifer',
      tree.c,
    );
  }
}
