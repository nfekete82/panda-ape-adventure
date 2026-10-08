import { describe, it, expect } from 'vitest';
import {
  createWorld,
  createPlayer,
  neutralInput,
  step,
  collides,
  move,
  obstacles,
  damageEnemy,
  parseMessage,
  WORLD,
} from '@panda/shared';
import { RoomManager } from '../apps/server/src/rooms';
const setup = () => {
  const w = createWorld();
  const p = createPlayer('p', 'panda');
  w.players.push(p);
  return { w, p };
};
describe('authoritative simulation', () => {
  it('normalizes diagonal movement', () => {
    const { w, p } = setup();
    const i = neutralInput();
    i.x = 1;
    i.y = 1;
    const x = p.x,
      y = p.y;
    step(w, new Map([['p', i]]), 0.05);
    expect(Math.hypot(p.x - x, p.y - y)).toBeCloseTo(8.75);
  });
  it('blocks obstacles and allows sliding', () => {
    const o = obstacles.find(
      (o) => o.kind === 'water' && o.y >= 998 && o.y <= 1002,
    )!;
    const p = { x: o.x - 20, y: o.y + o.h / 2 };
    const y = p.y;
    expect(collides(p.x, p.y)).toBe(false);
    move(p, 10, -7);
    expect(p.x).toBe(o.x - 20);
    expect(p.y).toBe(y - 7);
    expect(collides(-1, 100)).toBe(true);
  });
  it('applies melee, combos, cooldown and shared XP', () => {
    const { w, p } = setup();
    const ally = createPlayer('ally', 'ape');
    w.players.push(ally);
    const e = w.enemies[0]!;
    e.x = p.x + 35;
    e.y = p.y;
    const i = { ...neutralInput(), attack: true };
    const map = new Map([['p', i]]);
    step(w, map, 0.03);
    const hp = e.hp;
    expect(hp).toBeLessThan(e.maxHp);
    step(w, map, 0.03);
    expect(e.hp).toBe(hp);
    damageEnemy(w, e, 100, p);
    expect(w.kills).toBe(1);
    expect(ally.xp).toBe(25);
    expect(w.loot.some((item) => item.kind === 'coin')).toBe(true);
    expect(w.loot.some((item) => item.kind === 'crystal')).toBe(true);
  });
  it('casts server simulated projectiles', () => {
    const w = createWorld(),
      p = createPlayer('a', 'ape');
    w.players.push(p);
    const e = w.enemies[0]!;
    e.x = p.x + 65;
    e.y = p.y;
    const i = { ...neutralInput(), attack: true };
    for (let n = 0; n < 12; n++)
      step(w, new Map([['a', n === 0 ? i : neutralInput()]]), 1 / 60);
    expect(e.hp).toBeLessThan(e.maxHp);
    expect(p.mana).toBeLessThan(100);
  });
  it('guard reduces damage and invulnerability prevents repeated hits', () => {
    const { w, p } = setup();
    const e = w.enemies[0]!;
    e.x = p.x + 20;
    e.y = p.y;
    e.cooldown = 0;
    step(w, new Map([['p', { ...neutralInput(), guard: true }]]), 0.03);
    expect(p.hp).toBe(157);
    e.cooldown = 0;
    step(w, new Map(), 0.03);
    expect(p.hp).toBe(157);
  });
  it('telegraphs the guardian attack before dealing area damage', () => {
    const { w, p } = setup();
    const boss = w.enemies.find((e) => e.kind === 'guardian')!;
    w.enemies = [boss];
    boss.x = p.x + 80;
    boss.y = p.y;
    boss.cooldown = 0;
    step(w, new Map(), 0.05);
    expect(w.effects.some((f) => f.kind === 'warning')).toBe(true);
    expect(p.hp).toBe(p.maxHp);
    for (let n = 0; n < 18; n++) step(w, new Map(), 0.05);
    expect(p.hp).toBe(p.maxHp - 32);
  });
  it('heals, revives, completes quest and defeats boss', () => {
    const { w, p } = setup();
    p.hp = 0;
    step(w, new Map([['p', { ...neutralInput(), heal: true }]]), 0.03);
    expect(p.hp).toBeGreaterThan(0);
    expect(p.potions).toBe(2);
    p.x = WORLD.npc.x;
    p.y = WORLD.npc.y;
    step(w, new Map([['p', { ...neutralInput(), interact: true }]]), 0.03);
    expect(w.quest).toBe('active');
    for (const e of w.enemies.slice(0, 5)) damageEnemy(w, e, 1000, p);
    expect(w.quest).toBe('complete');
    step(w, new Map([['p', { ...neutralInput(), interact: true }]]), 0.03);
    expect(w.quest).toBe('rewarded');
    damageEnemy(
      w,
      w.enemies.find((e) => e.kind === 'guardian')!,
      1000,
      p,
    );
    expect(w.bossDefeated).toBe(true);
    expect(p.level).toBeGreaterThan(1);
  });
});
describe('room management', () => {
  it('creates a shared two player world and enforces hero occupancy', () => {
    const m = new RoomManager();
    const first = m.create('panda');
    expect(() => m.join(first.room.code, 'panda')).toThrow('already taken');
    const second = m.join(first.room.code, 'ape');
    expect(second.room).toBe(first.room);
    expect(second.room.world.players).toHaveLength(2);
    expect(() => m.join(first.room.code, 'ape')).toThrow('full');
  });
  it('restores disconnected sessions and expires reserved seats', () => {
    const m = new RoomManager();
    const { room, session } = m.create('panda');
    m.disconnect(room, session, 1000);
    expect(room.world.players[0]!.connected).toBe(false);
    expect(() => m.resume(room.code, 'wrong', 1001)).toThrow();
    m.resume(room.code, session.token, 1002);
    expect(room.world.players[0]!.connected).toBe(true);
    m.disconnect(room, session, 1003);
    m.update(0.03, 62000);
    expect(room.world.players).toHaveLength(0);
    expect(() => m.resume(room.code, session.token, 62001)).toThrow();
  });
  it('rejects duplicate active sessions and missing rooms', () => {
    const m = new RoomManager();
    const { room, session } = m.create('ape');
    expect(() => m.resume(room.code, session.token)).toThrow(
      'already connected',
    );
    expect(() => m.join('ZZZZZ', 'panda')).toThrow('not found');
  });
});
describe('protocol validation', () => {
  it('rejects malformed, non-finite, oversized and dishonest inputs', () => {
    expect(parseMessage('{')).toBeNull();
    expect(parseMessage('x'.repeat(2049))).toBeNull();
    for (const bad of [
      { ...neutralInput(), x: 2 },
      { ...neutralInput(), seq: -1 },
      { ...neutralInput(), attack: 1 },
      { ...neutralInput(), x: null },
    ])
      expect(
        parseMessage(JSON.stringify({ type: 'input', input: bad })),
      ).toBeNull();
    expect(
      parseMessage(JSON.stringify({ type: 'input', input: neutralInput() }))
        ?.type,
    ).toBe('input');
    expect(
      parseMessage('{"type":"join","code":"../hi","hero":"ape"}'),
    ).toBeNull();
  });
});
