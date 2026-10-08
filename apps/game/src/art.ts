import sheets from '../../../assets/hero-sheets.json';
import Phaser from 'phaser';
import { obstacles, random, WORLD, type Hero } from '@panda/shared';
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
export function heroArt(
  ctx: CanvasRenderingContext2D,
  hero: Hero,
  frame: number,
  dir: number,
) {
  const bounce = frame % 2;
  const back = dir >= 5;
  const side = dir === 0 || dir === 4;
  ctx.save();
  ctx.translate(0, -bounce);
  rect(ctx, '#16252c', 8, 27, 6, 4);
  rect(ctx, '#16252c', 18, 27, 6, 4);
  rect(ctx, hero === 'panda' ? '#496874' : '#65478b', 9, 17, 14, 12);
  rect(ctx, hero === 'panda' ? '#9eb1b0' : '#9b7bca', 10, 17, 12, 3);
  // Shared red adventurer scarf and leather harness from concept art.
  rect(ctx, '#75251f', 9, 15, 16, 5);
  rect(ctx, '#c74330', 8, 14, 17, 4);
  rect(ctx, '#f06740', 10, 14, 11, 1);
  rect(ctx, '#a62c25', back ? 21 : 6, 18, 5, 8);
  rect(ctx, '#704b32', 13, 19, 3, 8);
  rect(ctx, '#b78248', 14, 22, 3, 3);
  rect(ctx, '#d3af65', 9, 26, 14, 2);
  rect(ctx, '#856039', 18, 26, 5, 6);
  rect(ctx, '#c29852', 19, 27, 3, 2);
  if (hero === 'panda') {
    rect(ctx, '#192c34', 6, 4, 7, 7);
    rect(ctx, '#192c34', 20, 4, 7, 7);
    rect(ctx, '#e6e9d3', 8, 7, 16, 13);
    rect(ctx, '#faf1d6', 10, 7, 12, 3);
    if (!back) {
      rect(ctx, '#20313a', side ? 18 : 10, 11, 4, 5);
      if (!side) rect(ctx, '#20313a', 19, 11, 4, 5);
      rect(ctx, '#d1e6db', side ? 19 : 11, 12, 2, 2);
      rect(ctx, '#26343c', 15, 17, 3, 2);
    }
    rect(ctx, '#253d48', 6, 20, 5, 7);
    rect(ctx, '#d0a65b', 5, 21, 5, 5);
    rect(ctx, '#263744', 24, 18, 3, 10);
    rect(ctx, '#bbd9d7', 26, 12, 3, 13);
    rect(ctx, '#eff8e5', 27, 10, 2, 9);
    rect(ctx, '#d6b565', 24, 24, 7, 2);
    // Bamboo staff, wrapped in pale cloth with green leaf tip.
    rect(ctx, '#284b26', 27, 5, 3, 22);
    rect(ctx, '#72a842', 28, 4, 3, 20);
    rect(ctx, '#d9d1ac', 27, 17, 4, 2);
    rect(ctx, '#d9d1ac', 27, 22, 4, 2);
    rect(ctx, '#74a13d', 24, 5, 5, 3);
    rect(ctx, '#a7c857', 27, 3, 4, 4);
  } else {
    rect(ctx, '#734b37', 6, 7, 6, 9);
    rect(ctx, '#734b37', 21, 7, 6, 9);
    rect(ctx, '#734b37', 8, 5, 16, 14);
    rect(ctx, '#bc8c60', 10, 9, 12, 10);
    rect(ctx, '#d6aa72', 12, 12, 8, 6);
    rect(ctx, '#53392e', 9, 4, 15, 5);
    rect(ctx, '#845638', 11, 2, 9, 4);
    if (!back) {
      rect(ctx, '#252c35', side ? 18 : 11, 10, 2, 3);
      if (!side) rect(ctx, '#252c35', 19, 10, 2, 3);
      rect(ctx, '#6c3e32', 14, 16, 5, 2);
    }
    rect(ctx, '#bc8c60', 6, 20, 4, 6);
    rect(ctx, '#bc8c60', 23, 20, 4, 6);
    rect(ctx, '#ad8652', 27, 10, 2, 21);
    rect(ctx, '#58467c', 25, 6, 6, 6);
    rect(ctx, '#a6f1e9', 26, 5, 4, 5);
    rect(ctx, '#f1ffff', 27, 5, 2, 2);
    // Tail and wooden staff, matching the companion's silhouette.
    rect(ctx, '#52362b', 2, 23, 4, 3);
    rect(ctx, '#895536', 1, 18, 3, 6);
    rect(ctx, '#a67444', 2, 16, 4, 3);
    rect(ctx, '#76492c', 26, 8, 4, 21);
    rect(ctx, '#bd8c4f', 27, 7, 2, 20);
    rect(ctx, '#6e9d44', 24, 7, 5, 3);
  }
  ctx.restore();
}
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
  return (
    block * 32 +
    direction * 4 +
    (state === 'idle' || state === 'downed' ? 0 : Math.floor(time / 130) % 4)
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
        ctx.scale(2, 2);
        heroArt(ctx, hero, frame, dir);
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
  for (const kind of ['slime', 'wolf', 'wisp', 'guardian', 'npc']) {
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
    if (kind === 'npc') {
      rect(ctx, '#352e35', 10, 24, 4, 7);
      rect(ctx, '#352e35', 20, 24, 4, 7);
      rect(ctx, '#b18a55', 8, 15, 17, 13);
      rect(ctx, '#e4bd87', 11, 5, 12, 13);
      rect(ctx, '#77775b', 8, 4, 18, 6);
      rect(ctx, '#adad86', 10, 2, 13, 4);
      rect(ctx, '#4a4038', 13, 11, 2, 2);
      rect(ctx, '#4a4038', 20, 11, 2, 2);
      rect(ctx, '#dad7b8', 14, 15, 7, 6);
      rect(ctx, '#6e7653', 5, 16, 5, 10);
    }
    scene.textures.addCanvas(kind, c);
  }
  const { c, ctx } = canvas(WORLD.width, WORLD.height);
  const rng = random(93);
  rect(ctx, '#314c38', 0, 0, c.width, c.height);
  for (let i = 0; i < 19000; i++) {
    const x = Math.floor((rng() * c.width) / 4) * 4,
      y = Math.floor((rng() * c.height) / 4) * 4;
    rect(
      ctx,
      ['#3c593c', '#38533a', '#45623e', '#2c4435'][Math.floor(rng() * 4)]!,
      x,
      y,
      4 + rng() * 6,
      2 + rng() * 4,
    );
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#273e31';
  ctx.lineWidth = 112;
  ctx.beginPath();
  ctx.moveTo(200, 1150);
  ctx.bezierCurveTo(700, 1150, 850, 650, 1580, 340);
  ctx.stroke();
  ctx.strokeStyle = '#8a8053';
  ctx.lineWidth = 78;
  ctx.stroke();
  ctx.strokeStyle = '#a29662';
  ctx.lineWidth = 58;
  ctx.stroke();
  for (let i = 0; i < 2400; i++) {
    const x = rng() * c.width,
      y = rng() * c.height;
    const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    if (pixel[0]! > 90 && pixel[1]! > 80) {
      rect(ctx, rng() > 0.5 ? '#b0a16b' : '#7e7953', x, y, 4, 2);
    }
  }
  // Camp clearing and guardian arena.
  for (const [x, y, r] of [
    [450, 1030, 150],
    [1580, 340, 155],
  ]) {
    ctx.fillStyle = '#778057';
    ctx.beginPath();
    ctx.ellipse(x!, y!, r!, r! * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 250; i++) {
      const px = x! + (rng() - 0.5) * r! * 1.6,
        py = y! + (rng() - 0.5) * r! * 1.1;
      rect(ctx, '#889061', px, py, 4, 2);
    }
  }
  for (const o of obstacles) {
    if (o.kind === 'water') {
      rect(ctx, '#223f3e', o.x - 10, o.y - 10, o.w + 20, o.h + 20);
      rect(ctx, '#466b5c', o.x - 5, o.y - 5, o.w + 10, o.h + 10);
      rect(ctx, '#366b75', o.x, o.y, o.w, o.h);
      for (let i = 0; i < 70; i++)
        rect(
          ctx,
          rng() > 0.5 ? '#589195' : '#427d83',
          o.x + rng() * o.w,
          o.y + rng() * o.h,
          12 + rng() * 22,
          3,
        );
      for (let i = 0; i < 8; i++) {
        const x = o.x + rng() * o.w,
          y = o.y + rng() * o.h;
        rect(ctx, '#5f915d', x, y, 12, 8);
        rect(ctx, '#e3b6b5', x + 3, y + 1, 4, 4);
      }
    } else if (o.kind === 'rock') {
      rect(ctx, '#243a32', o.x - 6, o.y + 10, o.w + 12, o.h + 9);
      rect(ctx, '#687369', o.x - 4, o.y - 12, o.w + 7, o.h + 17);
      rect(ctx, '#929888', o.x + 1, o.y - 12, o.w - 3, 10);
      rect(ctx, '#7a856c', o.x + 4, o.y - 7, 12, 8);
      rect(ctx, '#455749', o.x + 4, o.y + o.h - 3, o.w - 8, 7);
    }
  }
  // Seeded forest-floor detailing: flowers, moss, mushrooms and pebble clusters.
  // Purely visual decorations do not affect authoritative collision geometry.
  for (let i = 0; i < 1650; i++) {
    const x = Math.floor((rng() * c.width) / 4) * 4;
    const y = Math.floor((rng() * c.height) / 4) * 4;
    const blocked = obstacles.some(
      (o) =>
        x >= o.x - 6 &&
        x <= o.x + o.w + 6 &&
        y >= o.y - 6 &&
        y <= o.y + o.h + 6,
    );
    if (blocked) continue;
    const type = Math.floor(rng() * 5);
    if (type === 0) {
      rect(ctx, '#244d35', x + 2, y + 3, 2, 7);
      rect(ctx, '#e4cc85', x, y, 6, 3);
      rect(ctx, '#f9e5b0', x + 2, y - 1, 2, 2);
    } else if (type === 1) {
      rect(ctx, '#233f33', x, y + 5, 11, 3);
      rect(ctx, '#7c9c61', x + 1, y, 5, 5);
      rect(ctx, '#b3be72', x + 6, y + 2, 4, 3);
    } else if (type === 2) {
      rect(ctx, '#e0d3ab', x + 3, y + 3, 3, 5);
      rect(ctx, '#bc694c', x, y, 10, 4);
      rect(ctx, '#f2d69a', x + 2, y + 1, 2, 1);
    } else if (type === 3) {
      rect(ctx, '#79867a', x, y + 2, 9, 4);
      rect(ctx, '#aab49b', x + 1, y, 5, 2);
    } else {
      rect(ctx, '#1f4936', x, y + 5, 12, 2);
      rect(ctx, '#679054', x + 2, y, 2, 7);
      rect(ctx, '#8eae66', x + 7, y + 2, 2, 5);
    }
  }
  // Tent, camp fire, sign and a sealed extension gate.
  rect(ctx, '#233c33', 290, 1025, 115, 35);
  for (let n = 0; n < 15; n++)
    rect(
      ctx,
      n < 9 ? '#d5b984' : '#a18c65',
      342 - n * 4,
      950 + n * 5,
      8 + n * 8,
      6,
    );
  rect(ctx, '#544735', 327, 999, 32, 43);
  rect(ctx, '#e5c794', 340, 1003, 3, 35);
  rect(ctx, '#5b4940', 444, 1090, 48, 12);
  rect(ctx, '#a77b48', 446, 1086, 44, 5);
  rect(ctx, '#a6956f', 1780, 240, 35, 135);
  rect(ctx, '#a6956f', 1850, 240, 35, 135);
  rect(ctx, '#c6ba93', 1775, 225, 115, 22);
  rect(ctx, '#2c463d', 1814, 248, 37, 126);
  rect(ctx, '#6e8d74', 1818, 255, 29, 105);
  rect(ctx, '#cab887', 1827, 270, 8, 64);
  for (let i = 0; i < 650; i++) {
    const x = rng() * c.width,
      y = rng() * c.height;
    if (
      !obstacles.some(
        (o) =>
          x > o.x - 20 &&
          x < o.x + o.w + 20 &&
          y > o.y - 20 &&
          y < o.y + o.h + 20,
      )
    ) {
      rect(ctx, '#77925d', x, y, 2, 6);
      rect(ctx, rng() > 0.5 ? '#d8cc87' : '#a5bcc0', x - 2, y - 2, 6, 3);
    }
  }
  scene.textures.addCanvas('forest', c);
  const tree = canvas(128, 160);
  const t = tree.ctx;
  rect(t, '#684f35', 57, 84, 16, 65);
  rect(t, '#a07744', 59, 84, 5, 55);
  rect(t, '#533f2e', 48, 137, 36, 8);
  const tr = random(44);
  for (let i = 0; i < 130; i++) {
    const angle = tr() * Math.PI * 2,
      r = Math.sqrt(tr()) * 49;
    const x = 64 + Math.cos(angle) * r,
      y = 64 + Math.sin(angle) * r * 0.9;
    const sz = 14 + tr() * 20;
    rect(
      t,
      ['#1c3d32', '#244c36', '#32603d', '#426e42', '#59814b'][
        Math.floor(tr() * 5)
      ]!,
      x - sz / 2,
      y - sz / 2,
      Math.floor(sz / 4) * 4,
      Math.floor(sz / 4) * 4,
    );
  }
  rect(t, '#739450', 42, 28, 16, 4);
  rect(t, '#6a914e', 35, 32, 20, 6);
  scene.textures.addCanvas('tree', tree.c);
}
