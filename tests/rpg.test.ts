import { describe, expect, it } from 'vitest';
import {
  createWorld,
  createPlayer,
  damageEnemy,
  step,
  neutralInput,
  applyRpgAction,
  awardXp,
  combatStats,
  grant,
  quantity,
  upgradeCost,
  migrateWorld,
  collides,
  WORLD,
  parseMessage,
  parseRespawnConfig,
} from '@panda/shared';
function setup() {
  const w = createWorld(),
    p = createPlayer('hero', 'panda');
  w.players.push(p);
  return { w, p };
}
describe('RPG progression and authority', () => {
  it('grants exactly three points per level across multiple levels and spends once', () => {
    const { w, p } = setup();
    awardXp(p, 250);
    expect([p.level, p.xp, p.points]).toEqual([3, 0, 6]);
    expect(
      applyRpgAction(w, p, { kind: 'attribute', attribute: 'vitality' }, 1),
    ).toBeNull();
    expect(p.maxHp).toBe(212);
    expect(
      applyRpgAction(w, p, { kind: 'attribute', attribute: 'vitality' }, 1),
    ).toBeTruthy();
    expect(p.points).toBe(5);
  });
  it('attributes affect melee, projectile, special, armor, mana and movement values', () => {
    const { p } = setup();
    const base = combatStats(p);
    p.attributes = { vitality: 2, strength: 2, dexterity: 2, magic: 2 };
    const stats = combatStats(p);
    for (const field of [
      'damage',
      'special',
      'armor',
      'speed',
      'maxMana',
      'maxHp',
    ] as const)
      expect(stats[field]).toBeGreaterThan(base[field]);
    expect(stats.cooldown).toBeLessThan(base.cooldown);
    const ape = createPlayer('a', 'ape');
    const before = combatStats(ape).damage;
    ape.attributes.magic = 1;
    expect(combatStats(ape).damage).toBe(before + 3);
  });
  it('validates all +1 through +10 costs atomically, range, cap and replay', () => {
    const { w, p } = setup();
    expect(applyRpgAction(w, p, { kind: 'upgrade' }, 1)).toContain(
      'Not enough',
    );
    expect(p.weapon.upgrade).toBe(0);
    for (const kind of ['coin', 'leather', 'crystal', 'ancient'] as const)
      grant(p, kind, 100000);
    p.x = 900;
    expect(applyRpgAction(w, p, { kind: 'upgrade' }, 2)).toContain(
      'blacksmith',
    );
    p.x = WORLD.smith.x;
    p.y = WORLD.smith.y;
    for (let n = 1; n <= 10; n++) {
      const before = quantity(p, 'coin');
      expect(applyRpgAction(w, p, { kind: 'upgrade' }, n + 2)).toBeNull();
      expect(quantity(p, 'coin')).toBe(before - upgradeCost(n).coin);
    }
    expect(applyRpgAction(w, p, { kind: 'upgrade' }, 13)).toContain('+10');
    expect(p.inventory.map((i) => i.id)).toHaveLength(
      new Set(p.inventory.map((i) => i.id)).size,
    );
  });
  it('upgrades cause real melee and projectile damage increases', () => {
    for (const hero of ['panda', 'ape'] as const) {
      const result = (upgrade: number) => {
        const w = createWorld(),
          p = createPlayer('p', hero);
        w.players.push(p);
        p.weapon.upgrade = upgrade;
        const e = w.enemies[0]!;
        e.maxHp = e.hp = 1000;
        e.x = p.x + 45;
        e.y = p.y;
        w.enemies = [e];
        step(w, new Map([['p', { ...neutralInput(), attack: true }]]), 0.03);
        for (let n = 0; n < 10; n++) step(w, new Map(), 0.03);
        return 1000 - e.hp;
      };
      expect(result(10)).toBeGreaterThan(result(0));
    }
  });
  it('bounds RPG intent and respawn configuration', () => {
    expect(
      parseMessage(
        JSON.stringify({
          type: 'rpg',
          seq: 1,
          action: { kind: 'upgrade', damage: 99999 },
        }),
      ),
    ).toBeNull();
    expect(
      parseMessage(
        JSON.stringify({
          type: 'input',
          input: { ...neutralInput(), coins: 99999 },
        }),
      ),
    ).toBeNull();
    for (const action of [
      { kind: 'attribute', attribute: 'coins' },
      { kind: 'loot' },
      { kind: 'upgrade' },
    ]) {
      expect(
        parseMessage(JSON.stringify({ type: 'rpg', seq: -1, action })),
      ).toBeNull();
    }
    expect(
      parseRespawnConfig({
        guardian: { seconds: 1, maximum: 1, safeDistance: 400 },
      }),
    ).toBeNull();
    expect(
      parseMessage(
        JSON.stringify({ type: 'rpg', seq: 1, action: { kind: 'upgrade' } }),
      )?.type,
    ).toBe('rpg');
  });
});
describe('respawn and unique rewards', () => {
  it('honors configured population limits at room creation', () => {
    const config = parseRespawnConfig({
      slime: { seconds: 1, maximum: 1, safeDistance: 160 },
    });
    const world = createWorld(config!);
    expect(
      world.enemies.filter((e) => e.kind === 'slime' && e.hp > 0),
    ).toHaveLength(1);
    expect(world.enemies.filter((e) => e.kind === 'slime')).toHaveLength(4);
  });
  it('uses collision-free fixed spawnpoints, timers, population limits and safe distance', () => {
    const { w, p } = setup();
    const e = w.enemies[0]!;
    expect(
      w.enemies.every((enemy) => !collides(enemy.spawn.x, enemy.spawn.y)),
    ).toBe(true);
    w.respawn.slime.seconds = 0.1;
    damageEnemy(w, e, 1000, p);
    const kills = w.kills,
      xp = p.xp;
    damageEnemy(w, e, 1000, p);
    expect([w.kills, p.xp]).toEqual([kills, xp]);
    step(w, new Map(), 0.05);
    expect(e.hp).toBe(0);
    p.x = e.spawn.x;
    p.y = e.spawn.y;
    step(w, new Map(), 0.05);
    expect(e.hp).toBe(0);
    p.x = WORLD.spawn.x;
    p.y = WORLD.spawn.y;
    w.respawn.slime.maximum = 3;
    step(w, new Map(), 0.05);
    expect(e.hp).toBe(0);
    w.respawn.slime.maximum = 4;
    step(w, new Map(), 0.05);
    expect(e.hp).toBe(e.maxHp);
    expect(e.generation).toBe(1);
    expect(e.x).toBe(e.spawn.x);
    expect(e.y).toBe(e.spawn.y);
    damageEnemy(w, e, 1000, p);
    expect(p.receipts.filter((r) => r.includes(':enemy0:'))).toHaveLength(2);
  });
  it('collects each unique drop exactly once even with two heroes overlapping', () => {
    const { w, p } = setup();
    const ally = createPlayer('ally', 'ape');
    w.players.push(ally);
    w.loot = [{ id: 'drop', x: p.x, y: p.y, kind: 'coin', quantity: 12 }];
    ally.x = p.x;
    ally.y = p.y;
    step(w, new Map(), 0.01);
    step(w, new Map(), 0.01);
    expect(quantity(p, 'coin') + quantity(ally, 'coin')).toBe(12);
  });
  it('never respawns a guardian on a timer; requires an explicit safe reset', () => {
    const { w, p } = setup(),
      boss = w.enemies.find((e) => e.kind === 'guardian')!;
    damageEnemy(w, boss, 1000, p);
    for (let n = 0; n < 1000; n++) step(w, new Map(), 0.05);
    expect(boss.hp).toBe(0);
    p.x = WORLD.npc.x;
    p.y = WORLD.npc.y;
    expect(applyRpgAction(w, p, { kind: 'resetEncounter' }, 1)).toBeTruthy();
    w.loot = [];
    expect(applyRpgAction(w, p, { kind: 'resetEncounter' }, 2)).toBeNull();
    expect(boss.generation).toBe(1);
    expect(w.bossDefeated).toBe(false);
  });
  it('migrates versionless solo snapshots while preserving earned levels, inventory and positions', () => {
    const { w, p } = setup();
    p.level = 4;
    p.crystals = 9;
    p.hp = 77;
    const old: Record<string, unknown> = { ...w };
    delete old.respawn;
    delete old.instanceId;
    const migrated = migrateWorld(old);
    expect(migrated?.players[0]?.points).toBe(9);
    expect(migrated?.players[0]?.hp).toBe(77);
    expect(quantity(migrated!.players[0]!, 'crystal')).toBe(9);
    expect(
      migrateWorld({ players: [{ id: 'bad' }], enemies: [], loot: [] }),
    ).toBeNull();
  });
});
