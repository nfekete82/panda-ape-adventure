import { describe, expect, it } from 'vitest';
import { weaponPose, weaponAnimation } from '../apps/game/src/weapons';

describe('directional weapon animation', () => {
  it('keeps side-view grips below the face and layers north/side weapons behind it', () => {
    for (const hero of ['panda', 'ape'] as const) {
      for (const x of [-1, 1]) {
        for (const cooldown of [0, 0.1, 0.25, 0.38]) {
          const pose = weaponPose(
            hero,
            { x, y: 0 },
            'attack',
            cooldown,
            0.38,
            0,
          );
          expect(Math.abs(pose.dx)).toBeGreaterThanOrEqual(
            hero === 'panda' ? 32 : 28,
          );
          expect(pose.dy).toBeGreaterThan(10);
          expect(pose.behindHero).toBe(true);
        }
      }
      expect(
        weaponPose(hero, { x: 0, y: -1 }, 'idle', 0, 0.38, 0).behindHero,
      ).toBe(true);
      expect(
        weaponPose(hero, { x: 0, y: 1 }, 'idle', 0, 0.38, 0).behindHero,
      ).toBe(false);
    }
  });
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
    const sample = (progress: number) =>
      weaponPose('panda', face, 'attack', 0.38 * (1 - progress), 0.38, 0);
    const idle = weaponPose('panda', face, 'idle', 0, 0.38, 0);
    const beginning = sample(0);
    const windup = sample(0.22);
    const strike = sample(0.42);
    const follow = sample(0.56);
    const ending = sample(0.99);
    expect(beginning.rotation).toBeCloseTo(idle.rotation);
    expect(windup.rotation).toBeLessThan(beginning.rotation);
    expect(strike.rotation).toBeGreaterThan(windup.rotation);
    expect(follow.rotation).toBeGreaterThan(strike.rotation);
    expect(ending.rotation).toBeCloseTo(idle.rotation, 3);
    expect(windup.trail).toBe(false);
    expect(strike.trail).toBe(true);
    expect(ending.trail).toBe(false);
    expect(strike.trailAlpha).toBeGreaterThan(0);
    expect(strike.sweep).toBeGreaterThan(0.1);
    expect(strike.sweep).toBeLessThan(1);
    expect(windup.bodyDx).toBeLessThan(0);
    expect(follow.bodyDx).toBeGreaterThan(0);
    expect(ending.bodyAngle).toBeCloseTo(0, 2);
  });

  it('joins attack phases continuously and returns every direction to rest', () => {
    for (const hero of ['panda', 'ape'] as const)
      for (let dir = 0; dir < 8; dir++) {
        const facing = {
          x: Math.cos((dir * Math.PI) / 4),
          y: Math.sin((dir * Math.PI) / 4),
        };
        const sample = (progress: number) =>
          weaponPose(hero, facing, 'attack', 0.5 * (1 - progress), 0.5, 0);
        for (const boundary of [0.22, 0.56, 1]) {
          const before = sample(boundary - 0.0001);
          const after = sample(boundary);
          expect(Math.abs(before.rotation - after.rotation)).toBeLessThan(
            0.001,
          );
          expect(Math.abs(before.dx - after.dx)).toBeLessThan(0.001);
          expect(Math.abs(before.bodyAngle - after.bodyAngle)).toBeLessThan(
            0.001,
          );
        }
        expect(sample(1).bodyDx).toBeCloseTo(0);
        expect(sample(1).bodyDy).toBeCloseTo(0);
      }
  });

  it('advances smoothly between held snapshots without replaying a swing', () => {
    const face = { x: 1, y: 0 };
    const first = weaponAnimation('panda', face, 'attack', 0.3, 0.38, 1000);
    const next = weaponAnimation(
      'panda',
      face,
      'attack',
      0.3,
      0.38,
      1016,
      first.timing,
    );
    expect(next.pose.progress).toBeGreaterThan(first.pose.progress);
    expect(next.timing.startedAt).toBe(first.timing.startedAt);
    const snapshot = weaponAnimation(
      'panda',
      face,
      'attack',
      0.25,
      0.38,
      1050,
      next.timing,
    );
    expect(snapshot.timing.startedAt).toBe(first.timing.startedAt);
    expect(snapshot.pose.progress).toBeCloseTo(1 - 0.25 / 0.38);
    const ended = weaponAnimation(
      'panda',
      face,
      'attack',
      0.25,
      0.38,
      2000,
      snapshot.timing,
    );
    expect(ended.pose.active).toBe(false);
    const restart = weaponAnimation(
      'panda',
      face,
      'attack',
      0.38,
      0.38,
      2010,
      ended.timing,
    );
    expect(restart.pose.progress).toBe(0);
    expect(restart.timing.startedAt).toBe(2010);
  });

  it('retains special timing after action switches to attack, and cancels when downed', () => {
    const face = { x: 1, y: 0 };
    const cast = weaponAnimation('ape', face, 'special', 1.1, 0.5, 1000);
    const attack = weaponAnimation(
      'ape',
      face,
      'attack',
      0.9,
      0.5,
      1200,
      cast.timing,
    );
    expect(attack.pose.special).toBe(true);
    expect(attack.timing.duration).toBe(1.1);
    expect(attack.pose.progress).toBeCloseTo(0.2 / 1.1);
    const dead = weaponAnimation(
      'ape',
      face,
      'downed',
      0.9,
      0.5,
      1210,
      attack.timing,
    );
    expect(dead.pose.active).toBe(false);
    expect(dead.pose.bodyAngle).toBe(0);
    expect(dead.pose.trail).toBe(false);
  });

  it('recognizes fast upgraded attacks even when the cooldown rises only slightly', () => {
    const face = { x: 1, y: 0 };
    const first = weaponAnimation('panda', face, 'attack', 0.12, 0.16, 1000);
    const next = weaponAnimation(
      'panda',
      face,
      'attack',
      0.15,
      0.16,
      1100,
      first.timing,
    );
    expect(next.timing.startedAt).toBeGreaterThan(first.timing.startedAt);
    expect(next.pose.progress).toBeCloseTo(1 - 0.15 / 0.16);
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
