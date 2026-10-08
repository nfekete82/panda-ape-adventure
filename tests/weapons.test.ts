import { describe, expect, it } from 'vitest';
import { weaponPose } from '../apps/game/src/weapons';

describe('directional weapon animation', () => {
  it('draws Panda sword in the facing direction at rest', () => {
    const east = weaponPose('panda', { x: 1, y: 0 }, 'idle', 0, 0.38, 0);
    const south = weaponPose('panda', { x: 0, y: 1 }, 'idle', 0, 0.38, 0);
    expect(east.active).toBe(false);
    expect(east.trail).toBe(false);
    expect(south.rotation - east.rotation).toBeCloseTo(Math.PI / 2);
    expect(east.dx).toBeGreaterThan(0);
    expect(south.dy).toBeGreaterThan(0);
  });

  it('animates the sword through wind-up, visible strike and recovery', () => {
    const face = { x: 1, y: 0 };
    const beginning = weaponPose('panda', face, 'attack', 0.37, 0.38, 100);
    const strike = weaponPose('panda', face, 'attack', 0.19, 0.38, 200);
    const ending = weaponPose('panda', face, 'attack', 0.03, 0.38, 300);
    expect(beginning.rotation).toBeLessThan(strike.rotation);
    expect(strike.rotation).toBeLessThan(ending.rotation);
    expect(beginning.trail).toBe(false);
    expect(strike.trail).toBe(true);
    expect(ending.trail).toBe(false);
    expect(strike.sweep).toBeGreaterThan(0.1);
    expect(strike.sweep).toBeLessThan(1);
  });

  it('moves Ape staff and sustains a special cast until the end', () => {
    const face = { x: 0, y: -1 };
    const idle = weaponPose('ape', face, 'idle', 0, 0.5, 0);
    const mid = weaponPose('ape', face, 'attack', 0.5, 0.5, 100, true);
    const late = weaponPose('ape', face, 'attack', 0.2, 0.5, 250, true);
    expect(mid.special).toBe(true);
    expect(late.special).toBe(true);
    expect(mid.rotation).not.toBeCloseTo(idle.rotation);
    expect(late.progress).toBeGreaterThan(mid.progress);
    expect(late.dx).not.toBeNaN();
    expect(late.dy).not.toBeNaN();
  });

  it('never renders an attack while dead or cooling down to zero', () => {
    const pose = weaponPose('panda', { x: 1, y: 0 }, 'attack', 0, 0.38, 100);
    expect(pose.active).toBe(false);
    expect(pose.trail).toBe(false);
  });
});
