import { describe, expect, it } from 'vitest';
import { createWorld, createPlayer } from '@panda/shared';
import { CombatFeedback } from '../apps/game/src/combat-feedback';
import { StatusPresentation, statusPercent } from '../apps/game/src/hud';
import { weaponPose } from '../apps/game/src/weapons';

describe('premium presentation', () => {
  it('uses three continuous combo paths for all eight directions', () => {
    for (const hero of ['panda', 'ape'] as const) {
      for (let dir = 0; dir < 8; dir++) {
        const facing = {
          x: Math.cos((dir * Math.PI) / 4),
          y: Math.sin((dir * Math.PI) / 4),
        };
        const rotations = new Set<number>();
        for (const combo of [0, 1, 2]) {
          const sample = (t: number) =>
            weaponPose(
              hero,
              facing,
              'attack',
              0.5 * (1 - t),
              0.5,
              0,
              false,
              combo,
            );
          rotations.add(sample(0.22).rotation);
          for (const boundary of [0.22, 0.56, 1]) {
            const a = sample(boundary - 0.0001),
              b = sample(boundary);
            expect(Math.abs(a.rotation - b.rotation)).toBeLessThan(0.001);
            expect(Math.hypot(a.dx - b.dx, a.dy - b.dy)).toBeLessThan(0.002);
          }
          for (const t of [0, 0.22, 0.4, 0.56, 0.9]) {
            const pose = sample(t);
            if (facing.y <= 0.15) expect(pose.behindHero).toBe(true);
          }
        }
        expect(rotations.size).toBe(hero === 'panda' ? 3 : 1);
      }
    }
  });
  it('does not invent hits or replay held snapshots/reconnect effects', () => {
    const world = createWorld();
    world.players.push(createPlayer('local', 'panda'));
    const tracker = new CombatFeedback();
    expect(tracker.observe(world, 0)).toEqual([]);
    world.effects.push({
      id: 'slash',
      kind: 'slash',
      x: 0,
      y: 0,
      radius: 50,
      life: 0.45,
    });
    expect(tracker.observe(world, 10)).toEqual([]);
    world.effects.push({
      id: 'confirmed',
      kind: 'hit',
      text: '20',
      x: 0,
      y: 0,
      radius: 16,
      life: 0.45,
    });
    expect(tracker.observe(world, 20)).toHaveLength(1);
    expect(tracker.clock(40, false)).toBe(20);
    expect(tracker.clock(40, true)).toBe(40);
    expect(tracker.observe(world, 40)).toEqual([]);
    world.instanceId = 'reconnected';
    expect(tracker.observe(world, 50)).toEqual([]);
    expect(tracker.clock(70, false)).toBe(70);
  });
  it('resumes hitstop without jumping the presentation clock', () => {
    const world = createWorld();
    const tracker = new CombatFeedback();
    tracker.observe(world, 0);
    world.effects.push({
      id: 'hit',
      kind: 'hit',
      text: '20',
      x: 0,
      y: 0,
      radius: 16,
      life: 0.45,
    });
    tracker.observe(world, 20);
    expect(tracker.clock(64, false)).toBe(20);
    expect(tracker.clock(65, false)).toBe(20);
    expect(tracker.clock(66, false)).toBe(21);
    expect(tracker.clock(100, false)).toBe(55);
  });
  it('reacts only to decreases and resets when heroes change', () => {
    const status = new StatusPresentation();
    expect(status.update('panda', 100, 50, 0)).toEqual({
      damaged: false,
      spent: false,
    });
    expect(status.update('panda', 80, 45, 100)).toEqual({
      damaged: true,
      spent: true,
    });
    expect(status.update('panda', 80, 45, 500)).toEqual({
      damaged: false,
      spent: false,
    });
    expect(status.update('ape', 60, 20, 510)).toEqual({
      damaged: false,
      spent: false,
    });
    expect(statusPercent(25, 100)).toBe(25);
    expect(statusPercent(-1, 100)).toBe(0);
    expect(statusPercent(200, 100)).toBe(100);
    expect(statusPercent(10, 0)).toBe(0);
  });
});
