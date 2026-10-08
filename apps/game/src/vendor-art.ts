import type Phaser from 'phaser';

const BASE = '/assets/vendor';

/** Sizes are taken from the imported PNG IHDRs, not inferred from the filenames. */
export const VENDOR_SPRITES = {
  slime: { key: 'vendor-slime', path: 'ninja/slime.png', width: 16, height: 16 },
  wolf: { key: 'vendor-beast', path: 'ninja/beast.png', width: 16, height: 16 },
  wisp: { key: 'vendor-spirit', path: 'ninja/spirit.png', width: 16, height: 16 },
  tree1: {
    key: 'vendor-tree-01',
    path: 'sunnyside/tree-01-strip4.png',
    width: 32,
    height: 34,
  },
  tree2: {
    key: 'vendor-tree-02',
    path: 'sunnyside/tree-02-strip4.png',
    width: 28,
    height: 43,
  },
  mushroomRed: {
    key: 'vendor-mushroom-red',
    path: 'sunnyside/mushroom-red-strip4.png',
    width: 16,
    height: 16,
  },
  mushroomBlue: {
    key: 'vendor-mushroom-blue',
    path: 'sunnyside/mushroom-blue-strip4.png',
    width: 16,
    height: 16,
  },
} as const;

export type ImportedEnemy = 'slime' | 'wolf' | 'wisp';

export function preloadVendorArt(scene: Phaser.Scene): void {
  for (const item of Object.values(VENDOR_SPRITES))
    scene.load.spritesheet(item.key, `${BASE}/${item.path}`, {
      frameWidth: item.width,
      frameHeight: item.height,
    });
  scene.load.image('vendor-world-tiles', `${BASE}/sunnyside/world-16.png`);
  scene.load.image('vendor-forest-tiles', `${BASE}/sunnyside/forest-32.png`);
}

/** Direction rows in this 4x4 Ninja sheet are not the Panda/Ape 8-way format. */
export function enemyFrame(time: number, x: number): number {
  return Math.floor((time + Math.abs(x) * 5) / 180) % 4;
}

export function sceneryFrame(time: number, x: number, speed = 300): number {
  return Math.floor((time + Math.abs(x) * 13) / speed) % 4;
}

export function vendorEnemyTexture(
  kind: string,
  textureExists: (key: string) => boolean,
): string {
  if (kind !== 'slime' && kind !== 'wolf' && kind !== 'wisp') return kind;
  const key = VENDOR_SPRITES[kind].key;
  return textureExists(key) ? key : kind;
}

export function createForestGroundTexture(
  scene: Phaser.Scene,
  width: number,
  height: number,
): boolean {
  if (!scene.textures.exists('vendor-world-tiles')) return false;
  const source: unknown = scene.textures
    .get('vendor-world-tiles')
    .getSourceImage();
  if (!(source instanceof HTMLImageElement)) return false;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.imageSmoothingEnabled = false;
  // Subtle moss scatter over the existing floor. The original road, pond and
  // camp geometry stay visible, and no authoritative collider is modified.
  let seed = 70831;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 300; i++) {
    const x = 24 + Math.floor(rand() * (width - 48));
    const y = 24 + Math.floor(rand() * (height - 48));
    // Keep interaction hubs, the primary road and the boss arena uncluttered.
    if (Math.abs(y - (1120 - x * 0.46)) < 105) continue;
    if (Math.hypot(x - 450, y - 1030) < 180) continue;
    if (Math.hypot(x - 1580, y - 340) < 175) continue;
    // The moss-green patch in the upper-left 16x16 grid of world-16.png.
    const cropX = 16 + Math.floor(rand() * 3) * 16;
    const cropY = 16 + Math.floor(rand() * 3) * 16;
    ctx.drawImage(source, cropX, cropY, 16, 16, x, y, 32, 32);
  }
  ctx.globalAlpha = 1;
  scene.textures.addCanvas('vendor-ground-accents', canvas);
  return true;
}
