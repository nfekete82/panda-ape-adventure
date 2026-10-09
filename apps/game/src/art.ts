import { CROP_IDS, RECIPE_IDS, RESOURCE_NODES } from '@panda/shared';
import { paintPlot, paintCrop, paintBuilding, paintCache } from './valley-art';
import { paintMiniFarmTree } from './mini-farm-tree';
import sheets from '../../../assets/hero-sheets.json';
import Phaser from 'phaser';
import { MINI_FARM_ATLAS } from './minifarm-atlas';
import { WORLD } from '@panda/shared';
import { paintForestWorld } from './environment-art';
import { paintBambooCrossing } from './bamboo-art';
import { paintBambooStand } from './bamboo-sprite';
import { conceptHero, conceptNpc } from './hero-design';
import {
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
  scene.load.image('minifarm-cc0-atlas', MINI_FARM_ATLAS);
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
  const mini = scene.textures.exists('minifarm-cc0-atlas')
    ? scene.textures.get('minifarm-cc0-atlas').getSourceImage() as HTMLImageElement
    : null;
  const sample = (ctx: CanvasRenderingContext2D, cell: number, width: number, height: number) => {
    if (!mini) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mini, (cell % 4) * 32, Math.floor(cell / 4) * 32, 32, 32, 0, 0, width, height);
  };
  const can = canvas(32, 32);
  can.ctx.fillStyle = '#304c46';
  can.ctx.fillRect(8, 10, 16, 18);
  can.ctx.fillStyle = '#8bb29b';
  can.ctx.fillRect(10, 12, 12, 13);
  can.ctx.fillRect(3, 8, 8, 4);
  can.ctx.fillRect(2, 6, 3, 7);
  can.ctx.strokeStyle = '#d8d1a2';
  can.ctx.lineWidth = 3;
  can.ctx.strokeRect(20, 9, 9, 12);
  scene.textures.addCanvas('valley-watering-can', can.c);
  for (const wet of [false, true]) {
    const a = canvas(32, 32);
    if (mini) {
      sample(a.ctx, 1, 32, 32);
      if (wet) { a.ctx.fillStyle = 'rgba(42,56,69,0.38)'; a.ctx.fillRect(0, 0, 32, 32); }
    } else paintPlot(a.ctx, wet);
    scene.textures.addCanvas(wet ? 'valley-soil-wet' : 'valley-soil', a.c);
  }
  for (const crop of CROP_IDS) {
    const a = canvas(96, 32);
    for (let frame = 0; frame < 3; frame++) {
      a.ctx.save();
      a.ctx.translate(frame * 32, 0);
      paintCrop(a.ctx, crop, frame);
      a.ctx.restore();
    }
    const texture = scene.textures.addCanvas(`valley-crop-${crop}`, a.c)!;
    scene.textures.addSpriteSheet(`valley-crop-${crop}`, texture, {
      frameWidth: 32,
      frameHeight: 32,
    });
  }
  for (const recipe of RECIPE_IDS) {
    const a = canvas(32, 48);
    if (mini && recipe === 'fence') sample(a.ctx, 6, 32, 48);
    else if (mini && recipe === 'shelter') sample(a.ctx, 9, 32, 48);
    else if (mini && recipe === 'chest') {
      sample(a.ctx, 7, 32, 48);
      a.ctx.fillStyle = '#d4b77b';
      a.ctx.fillRect(13, 28, 6, 5);
    } else if (mini && recipe === 'workbench') {
      sample(a.ctx, 10, 32, 48);
    } else paintBuilding(a.ctx, recipe);
    scene.textures.addCanvas(`valley-building-${recipe}`, a.c);
  }
  for (const node of RESOURCE_NODES) {
    const a = canvas(32, 32);
    if (mini && node.item === 'wood') sample(a.ctx, 7, 32, 32);
    else if (mini && node.item === 'fiber') sample(a.ctx, 5, 32, 32);
    else paintCache(a.ctx, node.item);
    scene.textures.addCanvas(`valley-cache-${node.item}`, a.c);
  }

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
  paintForestWorld(ctx, mini);
  paintBambooCrossing(ctx);
  scene.textures.addCanvas('forest', c);
  for (const [key, variant] of [
    ['tree-bamboo', 'leafy'],
    ['tree-bamboo-tall', 'tall'],
    ['tree-bamboo-young', 'young'],
  ] as const) {
    const bamboo = canvas(TREE_FRAME.width, TREE_FRAME.height);
    paintBambooStand(bamboo.ctx, variant);
    scene.textures.addCanvas(key, bamboo.c);
  }
  for (const kind of ['broadleaf', 'conifer'] as const) {
    const tree = canvas(TREE_FRAME.width, TREE_FRAME.height);
    paintMiniFarmTree(tree.ctx);
    scene.textures.addCanvas(
      kind === 'broadleaf' ? 'tree' : 'tree-conifer',
      tree.c,
    );
  }
}
