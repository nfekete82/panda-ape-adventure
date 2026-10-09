import { createWorld, createPlayer, type World, type Player } from './index.js';
import {
  combatStats,
  initialProgress,
  grant,
  parseRespawnConfig,
} from './rpg.js';
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
// Validate the complete serializable shape before treating a disk/browser snapshot as state.
function shape(value: unknown, sample: unknown): boolean {
  if (typeof sample === 'number')
    return typeof value === 'number' && Number.isFinite(value);
  if (typeof sample === 'string' || typeof sample === 'boolean')
    return typeof value === typeof sample;
  if (Array.isArray(sample))
    return (
      Array.isArray(value) &&
      (sample.length === 0
        ? value.length === 0
        : value.every((v) => shape(v, sample[0])))
    );
  if (record(sample))
    return (
      record(value) &&
      Object.entries(sample).every(([k, v]) => shape(value[k], v))
    );
  return value === sample;
}
export function isPlayer(value: unknown): value is Player {
  if (
    !record(value) ||
    (value.hero !== 'panda' && value.hero !== 'ape') ||
    typeof value.id !== 'string'
  )
    return false;
  const sample = createPlayer(value.id, value.hero);
  sample.inventory = [{ id: '', kind: 'coin', quantity: 0 }];
  sample.receipts = [''];
  if (
    !shape(value, sample) ||
    !Array.isArray(value.inventory) ||
    !Array.isArray(value.receipts) ||
    !record(value.weapon) ||
    !record(value.attributes)
  )
    return false;
  const integers = [
    'level',
    'xp',
    'points',
    'potions',
    'crystals',
    'commandSeq',
  ];
  if (
    !integers.every(
      (k) =>
        typeof value[k] === 'number' &&
        Number.isSafeInteger(value[k]) &&
        value[k] >= 0,
    ) ||
    value.level === 0
  )
    return false;
  if (
    value.weapon.kind !== (value.hero === 'panda' ? 'oakguard' : 'moonbloom') ||
    typeof value.weapon.upgrade !== 'number' ||
    !Number.isInteger(value.weapon.upgrade) ||
    value.weapon.upgrade < 0 ||
    value.weapon.upgrade > 10
  )
    return false;
  if (
    !Object.values(value.attributes).every(
      (n) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0,
    )
  )
    return false;
  const ids = new Set<string>(),
    kinds = new Set<string>();
  for (const item of value.inventory) {
    if (
      !record(item) ||
      typeof item.id !== 'string' ||
      typeof item.kind !== 'string' ||
      !['coin', 'leather', 'crystal', 'ancient'].includes(item.kind) ||
      typeof item.quantity !== 'number' ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 0 ||
      ids.has(item.id) ||
      kinds.has(item.kind)
    )
      return false;
    ids.add(item.id);
    kinds.add(item.kind);
  }
  return new Set(value.receipts).size === value.receipts.length;
}
function isWorld(value: unknown): value is World {
  if (
    !record(value) ||
    !Array.isArray(value.players) ||
    !value.players.every(isPlayer)
  )
    return false;
  const sample = createWorld();
  sample.players = [];
  sample.projectiles = [
    {
      id: '',
      x: 0,
      y: 0,
      owner: '',
      velocity: { x: 0, y: 0 },
      life: 0,
      damage: 0,
      hostile: false,
    },
  ];
  sample.effects = [{ id: '', x: 0, y: 0, kind: 'hit', life: 0, radius: 0 }];
  const rest = { ...value, players: [] };
  if (!parseRespawnConfig(value.respawn)) return false;
  if (
    !shape(rest, sample) ||
    !['available', 'active', 'complete', 'rewarded'].includes(
      String(value.quest),
    )
  )
    return false;
  if (
    !Array.isArray(value.enemies) ||
    !value.enemies.every(
      (e) =>
        record(e) &&
        ['slime', 'wolf', 'wisp', 'guardian'].includes(String(e.kind)),
    )
  )
    return false;
  if (
    !Array.isArray(value.loot) ||
    !value.loot.every(
      (l) =>
        record(l) &&
        ['potion', 'coin', 'leather', 'crystal', 'ancient'].includes(
          String(l.kind),
        ) &&
        typeof l.quantity === 'number' &&
        Number.isSafeInteger(l.quantity) &&
        l.quantity > 0,
    )
  )
    return false;
  return true;
}
export function migrateWorld(
  value: unknown,
  instanceId = 'solo',
): World | null {
  if (!record(value)) return null;
  // Accept versioned solo envelopes and the original versionless world.
  if (value.version === 2 && record(value.world)) value = value.world;
  if (
    !record(value) ||
    !Array.isArray(value.players) ||
    !Array.isArray(value.enemies) ||
    !Array.isArray(value.loot)
  )
    return null;
  const legacy = value.respawn === undefined;
  // Existing worlds predate the eastern guardian spirit. Add it at load time
  // so long-lived solo/co-op saves can still complete the new shrine quest.
  const shrineSentinel = createWorld().enemies.find((enemy) => enemy.id === 'enemy11');
  const hasShrineSentinel = value.enemies.some(
    (enemy: unknown) => record(enemy) && enemy.id === 'enemy11',
  );
  const migrated = {
    ...value,
    instanceId:
      typeof value.instanceId === 'string' ? value.instanceId : instanceId,
    respawn: (() => {
      const config = parseRespawnConfig(value.respawn) ?? createWorld().respawn;
      return {
        ...config,
        wisp: { ...config.wisp, maximum: Math.max(4, config.wisp.maximum) },
      };
    })(),
    players: value.players.map((p: unknown) => {
      if (
        !record(p) ||
        typeof p.id !== 'string' ||
        (p.hero !== 'panda' && p.hero !== 'ape')
      )
        return p;
      return legacy
        ? {
            ...p,
            ...initialProgress(p.id, p.hero),
            points:
              typeof p.level === 'number' ? Math.max(0, (p.level - 1) * 3) : 0,
          }
        : p;
    }),
    enemies: [
      ...value.enemies.map((e: unknown) =>
        record(e)
          ? {
              respawnRemaining: 0,
              generation: 0,
              ...e,
              ...(legacy &&
              e.id === 'enemy5' &&
              record(e.spawn) &&
              e.spawn.x === 1120 &&
              e.spawn.y === 800
                ? { spawn: { x: 1080, y: 760 } }
                : {}),
            }
          : e,
      ),
      ...(!hasShrineSentinel && shrineSentinel ? [shrineSentinel] : []),
    ],
    loot: value.loot.map((l: unknown) =>
      record(l) ? { quantity: 1, ...l } : l,
    ),
  };
  if (!isWorld(migrated)) return null;
  if (legacy)
    for (const p of migrated.players) {
      if (p.crystals > 0) grant(p, 'crystal', p.crystals);
      p.maxHp = combatStats(p).maxHp;
      p.hp = Math.min(p.hp, p.maxHp);
    }
  return migrated;
}
