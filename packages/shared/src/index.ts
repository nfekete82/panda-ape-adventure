import {
  initialProgress,
  combatStats,
  awardXp,
  grant,
  RESPAWN,
  type Progress,
} from './rpg.js';
import {
  lakeColliders,
  sceneryFits,
  forestFootprint,
} from './forest-layout.js';
export * from './forest-layout.js';
import {
  bambooObstacles,
  bambooRiverColliders,
  BAMBOO_WORLD_WIDTH,
} from './bamboo-crossing.js';
export * from './bamboo-crossing.js';
export * from './rpg.js';
import { createShrineWarden, prepareShrineQuest, interactShrine, shrineWardenDefeated, SHRINE_WARDEN_ID, type ShrineStage } from './shrine-quest.js';
export * from './shrine-quest.js';
export type Hero = 'panda' | 'ape';
export type EnemyKind = 'slime' | 'wolf' | 'wisp' | 'guardian';
export interface Vec {
  x: number;
  y: number;
}
export interface Input {
  x: number;
  y: number;
  aimX: number;
  aimY: number;
  attack: boolean;
  special: boolean;
  heal: boolean;
  guard: boolean;
  interact: boolean;
  seq: number;
}
export const neutralInput = (): Input => ({
  x: 0,
  y: 0,
  aimX: 1,
  aimY: 0,
  attack: false,
  special: false,
  heal: false,
  guard: false,
  interact: false,
  seq: 0,
});
export interface Player extends Vec, Progress {
  id: string;
  hero: Hero;
  hp: number;
  maxHp: number;
  mana: number;
  xp: number;
  level: number;
  potions: number;
  crystals: number;
  facing: Vec;
  action: string;
  cooldown: number;
  invulnerable: number;
  connected: boolean;
  lastSeq: number;
  combo: number;
}
export interface Enemy extends Vec {
  id: string;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  spawn: Vec;
  cooldown: number;
  hurt: number;
  phase: number;
  respawnRemaining: number;
  generation: number;
}
export interface Projectile extends Vec {
  id: string;
  owner: string;
  velocity: Vec;
  life: number;
  damage: number;
  hostile: boolean;
}
export interface Loot extends Vec {
  id: string;
  kind: 'potion' | 'coin' | 'leather' | 'crystal' | 'ancient';
  quantity: number;
}
export interface Effect extends Vec {
  id: string;
  kind: 'slash' | 'magic' | 'hit' | 'heal' | 'warning';
  life: number;
  text?: string;
  radius: number;
}
export interface World {
  tick: number;
  instanceId: string;
  respawn: typeof RESPAWN;
  nextId: number;
  players: Player[];
  enemies: Enemy[];
  projectiles: Projectile[];
  loot: Loot[];
  effects: Effect[];
  quest: 'available' | 'active' | 'complete' | 'rewarded';
  shrine?: ShrineStage; // Optional for legacy save files.
  kills: number;
  bossDefeated: boolean;
  message: string;
}
export const WORLD = {
  width: BAMBOO_WORLD_WIDTH,
  height: 1440,
  spawn: { x: 430, y: 1040 },
  npc: { x: 510, y: 990 },
  smith: { x: 390, y: 990 },
  boss: { x: 1580, y: 340 },
};
export interface Obstacle extends Vec {
  w: number;
  h: number;
  kind: 'tree' | 'rock' | 'water' | 'ruin';
}
export function random(seed: number): () => number {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
export const obstacles: Obstacle[] = (() => {
  const r = random(482);
  // Retain old exclusions during seeded generation so relocating water does
  // not reshuffle unrelated trees/rocks or obstruct established enemy spawns.
  const result: Obstacle[] = [
    { x: 820, y: 920, w: 310, h: 170, kind: 'water' },
    { x: 1180, y: 1030, w: 240, h: 150, kind: 'water' },
  ];
  // Keep the original seeded obstacle prefix but open up the crowded forest.
  // Both server and browser import this same authoritative collision layout.
  for (let i = 0; i < 140; i++) {
    const x = 50 + r() * 1820,
      y = 60 + r() * 1310;
    const path = Math.abs(y - (1120 - x * 0.46)) < 95;
    const camp = Math.hypot(x - 450, y - 1030) < 185;
    const boss = Math.hypot(x - 1580, y - 340) < 200;
    const inWater = result.some(
      (o) =>
        o.kind === 'water' &&
        x > o.x - 80 &&
        x < o.x + o.w + 80 &&
        y > o.y - 25 &&
        y < o.y + o.h + 145,
    );
    if (path || camp || boss || inWater) continue;
    result.push({
      x,
      y,
      w: 30 + r() * 12,
      h: 24 + r() * 10,
      kind: r() > 0.19 ? 'tree' : 'rock',
    });
  }
  result.push(
    { x: 1400, y: 180, w: 34, h: 95, kind: 'ruin' },
    { x: 1740, y: 180, w: 34, h: 95, kind: 'ruin' },
  );
  return [
    ...lakeColliders.map((o): Obstacle => ({ ...o, kind: 'water' })),
    ...bambooRiverColliders.map((o): Obstacle => ({ ...o, kind: 'water' })),
    ...bambooObstacles.map((o): Obstacle => ({ ...o, kind: 'tree' })),
    ...result.filter((o) => {
      if (o.kind === 'water') return false;
      if (o.kind === 'ruin') return true;
      const footprint = forestFootprint(o);
      return (
        sceneryFits(footprint) &&
        !lakeColliders.some(
          (water) =>
            footprint.x < water.x + water.w + 28 &&
            footprint.x + footprint.w > water.x - 28 &&
            footprint.y < water.y + water.h + 28 &&
            footprint.y + footprint.h > water.y - 28,
        )
      );
    }),
  ];
})();
export function collides(x: number, y: number, radius = 14): boolean {
  return (
    x < radius ||
    y < radius ||
    x > WORLD.width - radius ||
    y > WORLD.height - radius ||
    obstacles.some(
      (o) =>
        x + radius > o.x &&
        x - radius < o.x + o.w &&
        y + radius > o.y &&
        y - radius < o.y + o.h,
    )
  );
}
export function move(body: Vec, dx: number, dy: number, radius = 14): void {
  if (!collides(body.x + dx, body.y, radius)) body.x += dx;
  if (!collides(body.x, body.y + dy, radius)) body.y += dy;
}
export const distance = (a: Vec, b: Vec): number =>
  Math.hypot(a.x - b.x, a.y - b.y);
const unit = (x: number, y: number): Vec => {
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d };
};
const id = (w: World): string => {
  w.nextId = (w.nextId ?? 0) + 1;
  return `e${w.nextId}`;
};
export function createPlayer(playerId: string, hero: Hero): Player {
  return {
    ...initialProgress(playerId, hero),
    id: playerId,
    hero,
    x: WORLD.spawn.x + (hero === 'ape' ? 60 : 0),
    y: WORLD.spawn.y,
    hp: hero === 'panda' ? 160 : 110,
    maxHp: hero === 'panda' ? 160 : 110,
    mana: 100,
    xp: 0,
    level: 1,
    potions: 3,
    crystals: 0,
    facing: { x: 1, y: 0 },
    action: 'idle',
    cooldown: 0,
    invulnerable: 0,
    connected: true,
    lastSeq: 0,
    combo: 0,
  };
}
export function createWorld(respawn = RESPAWN): World {
  const positions: [EnemyKind, number, number][] = [
    ['slime', 680, 860],
    ['slime', 740, 820],
    ['wolf', 850, 590],
    ['wolf', 1100, 610],
    ['wisp', 1250, 500],
    ['slime', 1080, 760],
    ['wolf', 1420, 660],
    ['wisp', 1510, 750],
    ['slime', 650, 500],
    ['wisp', 1300, 300],
    ['guardian', 1580, 340],
  ];
  return {
    tick: 0,
    instanceId: 'solo',
    respawn: structuredClone(respawn),
    nextId: 0,
    players: [],
    enemies: positions.map(([kind, x, y], i) => ({
      id: `enemy${i}`,
      kind,
      x,
      y,
      spawn: { x, y },
      hp:
        positions.slice(0, i).filter(([other]) => other === kind).length >=
        respawn[kind].maximum
          ? 0
          : kind === 'guardian'
            ? 600
            : kind === 'wolf'
              ? 75
              : kind === 'wisp'
                ? 55
                : 45,
      maxHp:
        kind === 'guardian'
          ? 600
          : kind === 'wolf'
            ? 75
            : kind === 'wisp'
              ? 55
              : 45,
      cooldown: 1,
      hurt: 0,
      phase: 0,
      respawnRemaining: respawn[kind].seconds,
      generation: 0,
    })).concat(createShrineWarden()),
    projectiles: [],
    loot: [
      { id: 'starter', x: 580, y: 1030, kind: 'potion', quantity: 1 },
      // Small exploration reward at the new eastern shrine.
      { id: 'shrine-crystals', x: 2640, y: 498, kind: 'crystal', quantity: 2 },
    ],
    effects: [],
    shrine: 'dormant',
    quest: 'available',
    kills: 0,
    bossDefeated: false,
    message: 'Find Rowan at the camp. The forest needs you.',
  };
}
function effect(
  w: World,
  p: Vec,
  kind: Effect['kind'],
  radius: number,
  text?: string,
) {
  w.effects.push({
    id: id(w),
    ...p,
    kind,
    radius,
    text,
    life: kind === 'warning' ? 0.8 : 0.45,
  });
}
export function damageEnemy(
  w: World,
  e: Enemy,
  amount: number,
  owner: Player,
): void {
  if (e.hp <= 0) return;
  e.hp = Math.max(0, e.hp - amount);
  e.hurt = 0.2;
  effect(w, e, 'hit', 16, `${amount}`);
  const u = unit(e.x - owner.x, e.y - owner.y);
  if (e.kind !== 'guardian') move(e, u.x * 12, u.y * 12);
  if (e.hp === 0) {
    if (e.id === SHRINE_WARDEN_ID) {
      shrineWardenDefeated(w);
      return; // The shrine awards its prize, never ordinary random drops.
    }
    w.kills++;
    e.respawnRemaining = w.respawn[e.kind].seconds;
    // Drop rolls depend only on the authority's world state, never client input.
    const roll = random(w.nextId + w.kills * 7919 + e.generation * 104729)();
    const drops: [Loot['kind'], number][] = [
      ['coin', e.kind === 'guardian' ? 100 : 12],
      [
        e.kind === 'wolf' ? 'leather' : 'crystal',
        e.kind === 'guardian' ? 8 : 2,
      ],
    ];
    if (e.kind === 'guardian' || roll < 0.12) drops.push(['ancient', 1]);
    if (w.kills % 3 === 0) drops.push(['potion', 1]);
    for (const [kind, quantity] of drops)
      w.loot.push({
        id: id(w),
        x: e.x + (kind === 'coin' ? -12 : 12),
        y: e.y,
        kind,
        quantity,
      });
    const receipt = `${w.instanceId}:${e.id}:${e.generation}`;
    for (const p of w.players) {
      if (p.receipts.includes(receipt)) continue;
      p.receipts.push(receipt);
      if (awardXp(p, e.kind === 'guardian' ? 150 : 25))
        effect(w, p, 'heal', 55, 'LEVEL UP');
    }
    if (e.kind === 'guardian') {
      w.bossDefeated = true;
      w.message = 'The Thorn Guardian has fallen. Emerald Forest is safe.';
    }
    if (w.quest === 'active' && w.kills >= 5) w.quest = 'complete';
  }
}
function hurtPlayer(w: World, p: Player, amount: number, source: Vec) {
  if (p.hp <= 0 || p.invulnerable > 0) return;
  const reduced = Math.max(1, Math.round(amount - combatStats(p).armor));
  const dmg = p.action === 'guard' ? Math.ceil(reduced * 0.25) : reduced;
  p.hp = Math.max(0, p.hp - dmg);
  p.invulnerable = 0.65;
  effect(w, p, 'hit', 20, `−${dmg}`);
  const u = unit(p.x - source.x, p.y - source.y);
  move(p, u.x * 20, u.y * 20);
}
export function step(w: World, inputs: Map<string, Input>, dt: number): void {
  prepareShrineQuest(w);
  dt = Math.min(0.05, Math.max(0, dt));
  w.tick++;
  for (const p of w.players) {
    if (!p.connected) continue;
    const input = inputs.get(p.id) ?? neutralInput();
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    const stats = combatStats(p);
    p.mana = Math.min(
      stats.maxMana,
      p.mana + dt * (5 + p.attributes.magic * 0.2),
    );
    p.lastSeq = input.seq;
    if (p.hp <= 0) {
      if (input.heal && p.potions > 0) {
        p.potions--;
        p.hp = p.maxHp * 0.6;
        p.x = WORLD.spawn.x;
        p.y = WORLD.spawn.y;
        effect(w, p, 'heal', 40, 'REVIVED');
      }
      continue;
    }
    p.action =
      input.guard && p.hero === 'panda'
        ? 'guard'
        : p.cooldown > 0
          ? 'attack'
          : Math.hypot(input.x, input.y) > 0
            ? 'walk'
            : 'idle';
    const d = Math.hypot(input.x, input.y);
    if (d > 0) {
      const speed = stats.speed * (p.action === 'guard' ? 0.45 : 1);
      move(
        p,
        (input.x / Math.max(1, d)) * speed * dt,
        (input.y / Math.max(1, d)) * speed * dt,
      );
    }
    if (Math.hypot(input.aimX, input.aimY) > 0.1)
      p.facing = unit(input.aimX, input.aimY);
    if (input.heal && p.potions > 0 && p.hp < p.maxHp) {
      p.potions--;
      p.hp = Math.min(p.maxHp, p.hp + 70);
      effect(w, p, 'heal', 32, '+70');
    }
    if (input.interact && interactShrine(w, p)) {
      // The shrine handles its own interaction before Rowan's quest.
    } else if (input.interact && distance(p, WORLD.npc) < 90) {
      if (w.quest === 'available') {
        w.quest = 'active';
        w.message =
          'Rowan: Defeat 5 forest creatures, then return. Beware the guardian to the northeast!';
      } else if (w.quest === 'complete') {
        w.quest = 'rewarded';
        for (const hero of w.players) {
          hero.potions += 2;
          grant(hero, 'crystal', 10);
        }
        w.message =
          'Rowan: You brought hope back. Take these supplies, and face the Thorn Guardian.';
      } else
        w.message =
          w.quest === 'rewarded'
            ? 'Rowan: The ancient gate will open in a future adventure.'
            : 'Rowan: The forest remembers your kindness. Defeat 5 creatures.';
    }
    if (input.special && p.cooldown === 0 && p.mana >= 35) {
      p.mana -= 35;
      p.cooldown = 1.1;
      p.action = 'special';
      effect(w, p, 'magic', p.hero === 'panda' ? 125 : 180);
      for (const e of w.enemies)
        if (distance(p, e) < (p.hero === 'panda' ? 125 : 180))
          damageEnemy(w, e, stats.special, p);
      if (p.hero === 'ape')
        for (const ally of w.players)
          if (distance(p, ally) < 180)
            ally.hp = Math.min(ally.maxHp, ally.hp + 25);
    } else if (input.attack && p.cooldown === 0) {
      p.cooldown = stats.cooldown;
      p.combo = (p.combo + 1) % 3;
      p.action = 'attack';
      if (p.hero === 'panda') {
        effect(
          w,
          { x: p.x + p.facing.x * 34, y: p.y + p.facing.y * 34 },
          'slash',
          50,
        );
        for (const e of w.enemies) {
          const diff = unit(e.x - p.x, e.y - p.y);
          if (
            distance(p, e) < 85 &&
            diff.x * p.facing.x + diff.y * p.facing.y > -0.15
          )
            damageEnemy(w, e, stats.damage + (p.combo === 0 ? 10 : 0), p);
        }
      } else if (p.mana >= 5) {
        p.mana -= 5;
        w.projectiles.push({
          id: id(w),
          x: p.x + p.facing.x * 25,
          y: p.y + p.facing.y * 25,
          owner: p.id,
          velocity: { x: p.facing.x * 440, y: p.facing.y * 440 },
          life: 1.5,
          damage: stats.damage,
          hostile: false,
        });
      }
    }
    for (const item of w.loot) {
      if (distance(p, item) < 32) {
        const receipt = `${w.instanceId}:loot:${item.id}`;
        if (p.receipts.includes(receipt)) {
          item.x = -999;
          continue;
        }
        p.receipts.push(receipt);
        if (item.kind === 'potion') p.potions += item.quantity;
        else grant(p, item.kind, item.quantity);
        item.x = -999;
        effect(w, p, 'heal', 12, `+${item.quantity} ${item.kind}`);
      }
    }
  }
  for (const e of w.enemies) {
    if (e.hp <= 0) {
      if (e.kind === 'guardian' || e.id === SHRINE_WARDEN_ID) continue;
      e.respawnRemaining = Math.max(0, e.respawnRemaining - dt);
      const config = w.respawn[e.kind];
      if (
        e.respawnRemaining > 0 ||
        w.enemies.filter((other) => other.kind === e.kind && other.hp > 0)
          .length >= config.maximum ||
        collides(e.spawn.x, e.spawn.y) ||
        w.players.some((p) => distance(p, e.spawn) < config.safeDistance) ||
        w.enemies.some((other) => other.hp > 0 && distance(other, e.spawn) < 40)
      )
        continue;
      e.x = e.spawn.x;
      e.y = e.spawn.y;
      e.hp = e.maxHp;
      e.cooldown = 1;
      e.phase = 0;
      e.hurt = 0;
      e.generation++;
    }
    e.cooldown -= dt;
    e.hurt = Math.max(0, e.hurt - dt);
    const targets = w.players
      .filter((p) => p.connected && p.hp > 0)
      .sort((a, b) => distance(a, e) - distance(b, e));
    const p = targets[0];
    if (!p) continue;
    const d = distance(p, e);
    const detect = e.kind === 'guardian' ? 390 : 280;
    const speed =
      e.kind === 'wolf'
        ? 130
        : e.kind === 'wisp'
          ? 85
          : e.kind === 'guardian'
            ? 60
            : 65;
    const u = unit(p.x - e.x, p.y - e.y);
    if (d < detect && d > (e.kind === 'wisp' ? 155 : 32))
      move(
        e,
        u.x * speed * dt,
        u.y * speed * dt,
        e.kind === 'guardian' ? 26 : 14,
      );
    if (e.cooldown <= 0 && d < detect) {
      if (e.kind === 'wisp') {
        w.projectiles.push({
          id: id(w),
          x: e.x,
          y: e.y,
          owner: e.id,
          velocity: { x: u.x * 180, y: u.y * 180 },
          life: 2.2,
          damage: 12,
          hostile: true,
        });
        e.cooldown = 1.8;
      } else if (e.kind === 'guardian' && d < 155) {
        e.phase++;
        if (e.phase % 2 === 1) {
          effect(w, e, 'warning', 145);
          e.cooldown = 0.85;
        } else {
          effect(w, e, 'magic', 145);
          for (const target of targets)
            if (distance(target, e) < 145) hurtPlayer(w, target, 32, e);
          e.cooldown = 1.8;
        }
      } else if (d < 42) {
        hurtPlayer(w, p, e.kind === 'wolf' ? 16 : 10, e);
        e.cooldown = 1;
      }
    }
  }
  for (const bolt of w.projectiles) {
    bolt.life -= dt;
    bolt.x += bolt.velocity.x * dt;
    bolt.y += bolt.velocity.y * dt;
    if (collides(bolt.x, bolt.y, 3)) {
      bolt.life = 0;
      continue;
    }
    if (bolt.hostile) {
      for (const p of w.players)
        if (p.connected && p.hp > 0 && distance(p, bolt) < 22) {
          hurtPlayer(w, p, bolt.damage, bolt);
          bolt.life = 0;
          break;
        }
    } else {
      const owner = w.players.find((p) => p.id === bolt.owner);
      if (owner)
        for (const e of w.enemies)
          if (
            e.hp > 0 &&
            distance(e, bolt) < (e.kind === 'guardian' ? 40 : 25)
          ) {
            damageEnemy(w, e, bolt.damage, owner);
            bolt.life = 0;
            break;
          }
    }
  }
  w.projectiles = w.projectiles.filter((p) => p.life > 0);
  w.loot = w.loot.filter((l) => l.x >= 0);
  for (const f of w.effects) f.life -= dt;
  w.effects = w.effects.filter((f) => f.life > 0);
}
export function companionInput(w: World, bot: Player, leader: Player): Input {
  const i = neutralInput();
  const e = w.enemies
    .filter((e) => e.hp > 0 && distance(e, leader) < 240)
    .sort((a, b) => distance(a, bot) - distance(b, bot))[0];
  const target = e ?? leader;
  const u = unit(target.x - bot.x, target.y - bot.y);
  const d = distance(bot, target);
  const stop = e ? (bot.hero === 'ape' ? 140 : 55) : 70;
  if (d > stop) {
    i.x = u.x;
    i.y = u.y;
  }
  i.aimX = u.x;
  i.aimY = u.y;
  i.attack = !!e && d < (bot.hero === 'ape' ? 270 : 85);
  i.special = !!e && d < 130 && bot.mana > 60;
  i.heal = bot.hp < bot.maxHp * 0.4;
  return i;
}
export type ClientMessage =
  | { type: 'create'; hero: Hero; characterToken?: string }
  | { type: 'join'; code: string; hero: Hero; characterToken?: string }
  | { type: 'resume'; code: string; token: string }
  | { type: 'input'; input: Input }
  | { type: 'save' }
  | { type: 'rpg'; seq: number; action: import('./rpg.js').RpgAction };
export type ServerMessage =
  | { type: 'welcome'; code: string; token: string; playerId: string }
  | { type: 'state'; world: World }
  | { type: 'error'; message: string }
  | { type: 'saved' };
export function parseMessage(raw: string): ClientMessage | null {
  if (raw.length > 2048) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== 'object') return null;
    const o = v as Record<string, unknown>;
    const allowed: Record<string, readonly string[]> = {
      save: ['type'],
      create: ['type', 'hero', 'characterToken'],
      join: ['type', 'hero', 'code', 'characterToken'],
      resume: ['type', 'code', 'token'],
      input: ['type', 'input'],
      rpg: ['type', 'seq', 'action'],
    };
    if (typeof o.type !== 'string') return null;
    const fields = allowed[o.type];
    if (!fields || Object.keys(o).some((k) => !fields.includes(k))) return null;

    if (
      o.type === 'rpg' &&
      Number.isSafeInteger(o.seq) &&
      typeof o.seq === 'number' &&
      o.seq > 0 &&
      o.action &&
      typeof o.action === 'object'
    ) {
      const a = o.action as Record<string, unknown>;
      if (
        Object.keys(a).some(
          (k) => k !== 'kind' && !(a.kind === 'attribute' && k === 'attribute'),
        )
      )
        return null;
      if (a.kind === 'upgrade' || a.kind === 'resetEncounter')
        return { type: 'rpg', seq: o.seq, action: { kind: a.kind } };
      if (
        a.kind === 'attribute' &&
        (a.attribute === 'vitality' ||
          a.attribute === 'strength' ||
          a.attribute === 'dexterity' ||
          a.attribute === 'magic')
      )
        return {
          type: 'rpg',
          seq: o.seq,
          action: { kind: 'attribute', attribute: a.attribute },
        };
      return null;
    }
    if (
      o.characterToken !== undefined &&
      (typeof o.characterToken !== 'string' ||
        !/^[\da-f-]{36}$/.test(o.characterToken))
    )
      return null;
    const credential =
      typeof o.characterToken === 'string'
        ? { characterToken: o.characterToken }
        : {};
    if (o.type === 'save') return { type: 'save' };
    if (o.type === 'create' && (o.hero === 'panda' || o.hero === 'ape'))
      return { type: 'create', hero: o.hero, ...credential };
    if (
      o.type === 'join' &&
      typeof o.code === 'string' &&
      /^[A-Z2-9]{5}$/.test(o.code) &&
      (o.hero === 'panda' || o.hero === 'ape')
    )
      return { type: 'join', code: o.code, hero: o.hero, ...credential };
    if (
      o.type === 'resume' &&
      typeof o.code === 'string' &&
      /^[A-Z2-9]{5}$/.test(o.code) &&
      typeof o.token === 'string' &&
      /^[\da-f-]{36}$/.test(o.token)
    )
      return { type: 'resume', code: o.code, token: o.token };
    if (o.type === 'input' && o.input && typeof o.input === 'object') {
      const i = o.input as Record<string, unknown>;
      if (Object.keys(i).some((k) => !Object.keys(neutralInput()).includes(k)))
        return null;
      if (
        !['x', 'y', 'aimX', 'aimY'].every(
          (k) =>
            typeof i[k] === 'number' &&
            Number.isFinite(i[k]) &&
            Math.abs(i[k] as number) <= 1,
        )
      )
        return null;
      if (
        !['attack', 'special', 'heal', 'guard', 'interact'].every(
          (k) => typeof i[k] === 'boolean',
        )
      )
        return null;
      if (
        typeof i.seq !== 'number' ||
        !Number.isSafeInteger(i.seq) ||
        i.seq < 0
      )
        return null;
      return {
        type: 'input',
        input: {
          x: i.x as number,
          y: i.y as number,
          aimX: i.aimX as number,
          aimY: i.aimY as number,
          attack: i.attack as boolean,
          special: i.special as boolean,
          heal: i.heal as boolean,
          guard: i.guard as boolean,
          interact: i.interact as boolean,
          seq: i.seq,
        },
      };
    }
    return null;
  } catch {
    return null;
  }
}

export { migrateWorld, isPlayer } from './saves.js';
