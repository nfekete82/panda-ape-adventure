import { CROP_IDS, RECIPE_IDS, RESOURCE_NODES } from '@panda/shared';
import {
  paintPlot,
  paintCrop,
  paintBuilding,
  paintCache,
  paintGarden,
  paintCottage,
} from './valley-art';
import sheets from '../../../assets/hero-sheets.json';
import Phaser from 'phaser';
import { MINI_FARM_HOUSE_DATA } from './mini-farm-house';
import { MINI_FARM_ATLAS } from './minifarm-atlas';
import { WORLD } from '@panda/shared';
import { paintForestWorld } from './environment-art';
import { paintBambooCrossing } from './bamboo-art';
import { paintBambooStand } from './bamboo-sprite';
import { conceptHero, conceptNpc } from './hero-design';
import {
  paintWoodlandEnemy,
  paintWoodlandTree,
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
  scene.load.image('mini-farm-cottage-source', MINI_FARM_HOUSE_DATA);
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
  const miniSource = scene.textures.exists('minifarm-cc0-atlas')
    ? scene.textures.get('minifarm-cc0-atlas').getSourceImage()
    : null;
  const mini = miniSource instanceof HTMLImageElement ? miniSource : null;
  const sample = (
    ctx: CanvasRenderingContext2D,
    cell: number,
    width: number,
    height: number,
  ) => {
    if (!mini) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      mini,
      (cell % 4) * 32,
      Math.floor(cell / 4) * 32,
      32,
      32,
      0,
      0,
      width,
      height,
    );
  };
  // Native decorative tiles from the CC0 sheet are kept separate from
  // gameplay sprites so the farm can use original pixels without collision.
  if (mini)
    for (const [name, cell] of [
      ['minifarm-flowers', 4],
      ['minifarm-shrub', 5],
      ['minifarm-barrel', 7],
      ['minifarm-garden', 8],
    ] as const) {
      const art = canvas(32, 32);
      sample(art.ctx, cell, 32, 32);
      scene.textures.addCanvas(name, art.c);
    }
  const cottage = canvas(96, 92);
  const houseSource = scene.textures
    .get('mini-farm-cottage-source')
    .getSourceImage();
  if (houseSource instanceof HTMLImageElement)
    paintCottage(cottage.ctx, houseSource);
  scene.textures.addCanvas('mini-farm-cottage', cottage.c);
  const garden = canvas(352, 208);
  paintGarden(garden.ctx);
  // Selected native CC0 accents stay outside plots and leave the fibre/ore
  // cache footprints clear on the east apron.
  if (mini)
    for (const [cell, x, y] of [
      [4, 4, 112],
      [5, 7, 153],
      [7, 316, 9],
      [4, 318, 80],
    ] as const) {
      garden.ctx.save();
      garden.ctx.translate(x, y);
      sample(garden.ctx, cell, 32, 32);
      garden.ctx.restore();
    }
  scene.textures.addCanvas('valley-garden', garden.c);
  // Equipped tools use dedicated crisp pixel textures, not the old RPG weapons.
  for (const tool of ['axe', 'pickaxe', 'water'] as const) {
    const a = canvas(32, 32);
    const c = a.ctx;
    if (tool === 'water') {
      c.fillStyle = '#5c7470'; c.fillRect(8, 13, 18, 15);
      c.fillStyle = '#b7d5cf'; c.fillRect(10, 14, 14, 3);
      c.fillStyle = '#5c7470'; c.fillRect(22, 8, 8, 5);
      c.fillStyle = '#b7d5cf'; c.fillRect(24, 7, 5, 2);
      c.fillStyle = '#d0b57b'; c.fillRect(11, 8, 11, 3);
    } else {
      c.fillStyle = '#694932'; c.fillRect(14, 6, 5, 25);
      c.fillStyle = '#c19760'; c.fillRect(15, 7, 2, 23);
      c.fillStyle = '#536c70';
      if (tool === 'axe') {
        c.fillRect(3, 5, 20, 5); c.fillRect(3, 10, 15, 6);
        c.fillStyle = '#b8cfcb'; c.fillRect(3, 5, 16, 2);
      } else {
        c.fillRect(2, 5, 28, 5); c.fillRect(5, 10, 5, 5);
        c.fillStyle = '#bed1c9'; c.fillRect(2, 5, 28, 2);
      }
    }
    scene.textures.addCanvas(`valley-held-${tool}`, a.c);
  }
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
    paintPlot(a.ctx, wet);
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
    paintWoodlandTree(tree.ctx, kind);
    scene.textures.addCanvas(
      kind === 'broadleaf' ? 'tree' : 'tree-conifer',
      tree.c,
    );
  }
}
