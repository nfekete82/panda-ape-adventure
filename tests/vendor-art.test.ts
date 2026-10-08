import { describe, expect, it } from 'vitest';
import {
  VENDOR_SPRITES,
  enemyFrame,
  sceneryFrame,
  vendorEnemyTexture,
} from '../apps/game/src/vendor-art';

describe('curated external forest art', () => {
  it('selects imported enemy textures with procedural fallback', () => {
    expect(vendorEnemyTexture('slime', () => true)).toBe('vendor-slime');
    expect(vendorEnemyTexture('wolf', () => true)).toBe('vendor-beast');
    expect(vendorEnemyTexture('wisp', () => true)).toBe('vendor-spirit');
    expect(vendorEnemyTexture('slime', () => false)).toBe('slime');
    expect(vendorEnemyTexture('guardian', () => true)).toBe('guardian');
  });

  it('uses the measured 16×16 frame grid for imported monsters', () => {
    expect(VENDOR_SPRITES.slime.width).toBe(16);
    expect(VENDOR_SPRITES.slime.height).toBe(16);
    expect(VENDOR_SPRITES.tree1.width).toBe(32);
    expect(VENDOR_SPRITES.tree1.height).toBe(34);
    expect(VENDOR_SPRITES.tree2.width).toBe(28);
    expect(VENDOR_SPRITES.tree2.height).toBe(43);
  });

  it('cycles stable four-frame animation poses', () => {
    expect(enemyFrame(0, 0)).toBe(0);
    expect(enemyFrame(180, 0)).toBe(1);
    expect(enemyFrame(720, 0)).toBe(0);
    expect(sceneryFrame(0, 0)).toBe(0);
    expect(sceneryFrame(300, 0)).toBe(1);
    expect(sceneryFrame(1200, 0)).toBe(0);
  });
});
