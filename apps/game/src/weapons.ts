import type Phaser from 'phaser';

export type WeaponHero = 'panda' | 'ape';
export interface WeaponPose {
  dx: number;
  dy: number;
  rotation: number;
  facingAngle: number;
  progress: number;
  sweep: number;
  active: boolean;
  special: boolean;
  trail: boolean;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Rendering-only pose based on the authoritative action/cooldown/facing.
 * The animation never decides whether an attack hit or spends any mana.
 */
export function weaponPose(
  hero: WeaponHero,
  facing: { x: number; y: number },
  action: string,
  cooldown: number,
  normalCooldown: number,
  time: number,
  sustainedSpecial?: boolean,
): WeaponPose {
  const magnitude = Math.hypot(facing.x, facing.y) || 1;
  const fx = facing.x / magnitude;
  const fy = facing.y / magnitude;
  const facingAngle = Math.atan2(fy, fx);
  const active = cooldown > 0 && (action === 'attack' || action === 'special');
  const special =
    active &&
    (sustainedSpecial ??
      (action === 'special' || cooldown > normalCooldown + 0.08));
  const duration = special ? 1.1 : Math.max(0.1, normalCooldown);
  const progress = active ? clamp01(1 - cooldown / duration) : 0;
  // Wind-up, strike and recovery are visible without altering combat timings.
  const t = clamp01((progress - 0.2) / 0.56);
  const sweep = t * t * (3 - 2 * t);
  const rotation =
    facingAngle +
    Math.PI / 2 +
    (hero === 'panda'
      ? active
        ? -1.12 + sweep * 2.25
        : -0.18
      : active
        ? -0.55 + sweep * 1.1
        : 0.06 + Math.sin(time * 0.003) * 0.045);
  const reach =
    active && hero === 'ape' ? 23 + sweep * 9 : hero === 'panda' ? 20 : 19;
  return {
    dx: fx * reach - fy * 7,
    dy: fy * reach + fx * 7 - 10,
    rotation,
    facingAngle,
    progress,
    sweep,
    active,
    special,
    trail: active && progress >= 0.26 && progress <= 0.83,
  };
}

const canvas = (width: number, height: number) => {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  const ctx = element.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { element, ctx };
};
const pixel = (
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
};

/** Original procedural weapon art; generated locally without remote assets. */
export function makeWeaponTextures(scene: Phaser.Scene): void {
  const sword = canvas(26, 70);
  const s = sword.ctx;
  // Pointed steel blade, cool highlight, brass guard and leather grip.
  pixel(s, '#26353f', 10, 5, 7, 40);
  pixel(s, '#d4e3dc', 11, 6, 5, 37);
  pixel(s, '#f8f5db', 12, 7, 2, 31);
  pixel(s, '#8ba7ac', 15, 10, 2, 33);
  pixel(s, '#d3dfd2', 12, 2, 3, 5);
  pixel(s, '#f9eed4', 13, 0, 1, 5);
  pixel(s, '#654624', 4, 44, 18, 6);
  pixel(s, '#dfb760', 5, 45, 16, 3);
  pixel(s, '#f5d38c', 6, 45, 6, 1);
  pixel(s, '#422b22', 11, 50, 5, 13);
  pixel(s, '#9e633e', 12, 52, 2, 9);
  pixel(s, '#d3a65e', 10, 62, 7, 5);
  pixel(s, '#f4d58f', 12, 63, 3, 2);
  scene.textures.addCanvas('panda-sword', sword.element);

  const staff = canvas(28, 76);
  const t = staff.ctx;
  // Organic bamboo staff with a wrapped grip and a glowing leaf crystal.
  pixel(t, '#264d34', 11, 12, 8, 57);
  pixel(t, '#7c9b47', 12, 10, 5, 59);
  pixel(t, '#bed073', 13, 18, 2, 46);
  pixel(t, '#5e6d30', 11, 32, 8, 3);
  pixel(t, '#5e6d30', 11, 51, 8, 3);
  pixel(t, '#e8d4a0', 10, 46, 10, 4);
  pixel(t, '#b99a68', 12, 46, 3, 4);
  pixel(t, '#e8d4a0', 10, 59, 10, 4);
  pixel(t, '#a48f63', 12, 60, 3, 2);
  pixel(t, '#355e36', 8, 9, 5, 11);
  pixel(t, '#80b25f', 4, 5, 9, 9);
  pixel(t, '#a9d575', 15, 7, 9, 7);
  pixel(t, '#37653e', 18, 12, 6, 5);
  pixel(t, '#458679', 12, 2, 7, 11);
  pixel(t, '#a4e7c6', 13, 0, 5, 8);
  pixel(t, '#eaffdc', 14, 2, 2, 5);
  pixel(t, '#345c35', 12, 69, 6, 4);
  scene.textures.addCanvas('ape-staff', staff.element);
}
