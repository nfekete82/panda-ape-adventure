import {
  distance,
  WORLD,
  type Player,
  type World,
  type EnemyKind,
} from './index.js';

export const ATTRIBUTES = [
  'vitality',
  'strength',
  'dexterity',
  'magic',
] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export type Material = 'coin' | 'leather' | 'crystal' | 'ancient';
export interface InventoryItem {
  id: string;
  kind: Material;
  quantity: number;
}
export interface Progress {
  attributes: Record<Attribute, number>;
  points: number;
  weapon: { id: string; kind: 'oakguard' | 'moonbloom'; upgrade: number };
  inventory: InventoryItem[];
  receipts: string[];
  commandSeq: number;
}
export type RpgAction =
  | { kind: 'attribute'; attribute: Attribute }
  | { kind: 'upgrade' }
  | { kind: 'resetEncounter' };
export const RESPAWN: Record<
  EnemyKind,
  { seconds: number; maximum: number; safeDistance: number }
> = {
  slime: { seconds: 20, maximum: 4, safeDistance: 160 },
  wolf: { seconds: 30, maximum: 3, safeDistance: 180 },
  wisp: { seconds: 40, maximum: 3, safeDistance: 180 },
  guardian: { seconds: 0, maximum: 1, safeDistance: 400 },
};
export const WEAPONS = {
  oakguard: { name: 'Oakguard sword', damage: 25, perUpgrade: 4 },
  moonbloom: { name: 'Moonbloom staff', damage: 28, perUpgrade: 5 },
};
export const xpRequired = (level: number): number =>
  75 * level + 25 * (level - 1) ** 2;
export function initialProgress(id: string, hero: Player['hero']): Progress {
  return {
    attributes: { vitality: 0, strength: 0, dexterity: 0, magic: 0 },
    points: 0,
    weapon: {
      id: `${id}:weapon`,
      kind: hero === 'panda' ? 'oakguard' : 'moonbloom',
      upgrade: 0,
    },
    inventory: [],
    receipts: [],
    commandSeq: 0,
  };
}
export function combatStats(p: Player) {
  const a = p.attributes,
    weapon = WEAPONS[p.weapon.kind];
  return {
    maxHp:
      (p.hero === 'panda' ? 160 : 110) + (p.level - 1) * 20 + a.vitality * 12,
    maxMana: 100 + a.magic * 5,
    damage:
      weapon.damage +
      weapon.perUpgrade * p.weapon.upgrade +
      (p.level - 1) * (p.hero === 'panda' ? 3 : 4) +
      (p.hero === 'panda'
        ? a.strength * 3 + a.dexterity
        : a.magic * 3 + a.dexterity),
    special:
      (p.hero === 'panda' ? 48 : 42) +
      a.magic * 4 +
      a.strength * (p.hero === 'panda' ? 2 : 1) +
      weapon.perUpgrade * p.weapon.upgrade,
    speed: (p.hero === 'panda' ? 175 : 205) + a.dexterity * 2,
    cooldown: (p.hero === 'panda' ? 0.38 : 0.5) / (1 + a.dexterity * 0.02),
    armor: a.vitality * 0.3 + a.strength * 0.2,
  };
}
export function quantity(p: Player, kind: Material): number {
  return p.inventory.find((i) => i.kind === kind)?.quantity ?? 0;
}
export function grant(p: Player, kind: Material, amount: number): void {
  const item = p.inventory.find((i) => i.kind === kind);
  if (item) item.quantity += amount;
  else p.inventory.push({ id: `${p.id}:${kind}`, kind, quantity: amount });
  if (kind === 'crystal') p.crystals = quantity(p, kind);
}
export function awardXp(p: Player, amount: number): boolean {
  p.xp += amount;
  let leveled = false;
  while (p.xp >= xpRequired(p.level)) {
    p.xp -= xpRequired(p.level);
    p.level++;
    p.points += 3;
    leveled = true;
  }
  if (leveled) {
    p.maxHp = combatStats(p).maxHp;
    p.hp = p.maxHp;
    p.mana = combatStats(p).maxMana;
  }
  return leveled;
}
export function upgradeCost(next: number): Record<Material, number> {
  return {
    coin: 20 * next * next,
    leather: 2 * next,
    crystal: next,
    ancient: next >= 6 ? next - 5 : 0,
  };
}
export function applyRpgAction(
  w: World,
  p: Player,
  action: RpgAction,
  seq: number,
): string | null {
  if (!p.connected || !Number.isSafeInteger(seq) || seq <= p.commandSeq)
    return 'Stale action.';
  p.commandSeq = seq;
  if (p.hp <= 0) return 'Revive before spending or resetting an encounter.';
  if (action.kind === 'attribute') {
    if (!ATTRIBUTES.includes(action.attribute) || p.points < 1)
      return 'No attribute points available.';
    p.points--;
    p.attributes[action.attribute]++;
    const max = combatStats(p).maxHp;
    p.hp += max - p.maxHp;
    p.maxHp = max;
    return null;
  }
  if (action.kind === 'upgrade') {
    if (distance(p, WORLD.smith) > 90)
      return 'Visit Bramble the blacksmith at camp.';
    if (p.weapon.upgrade >= 10) return 'Weapon is already +10.';
    const cost = upgradeCost(p.weapon.upgrade + 1);
    const kinds: Material[] = ['coin', 'leather', 'crystal', 'ancient'];
    if (kinds.some((kind) => quantity(p, kind) < cost[kind]))
      return 'Not enough materials or coins.';
    for (const kind of kinds) grant(p, kind, -cost[kind]);
    p.weapon.upgrade++;
    return null;
  }
  if (
    distance(p, WORLD.npc) > 90 ||
    !w.bossDefeated ||
    w.loot.some((l) => l.kind === 'ancient') ||
    w.players.some(
      (hero) => distance(hero, WORLD.boss) < RESPAWN.guardian.safeDistance,
    )
  )
    return 'Return everyone to camp and collect the guardian loot before resetting.';
  const boss = w.enemies.find((e) => e.kind === 'guardian');
  if (!boss || boss.hp > 0) return 'No completed encounter to reset.';
  boss.x = boss.spawn.x;
  boss.y = boss.spawn.y;
  boss.hp = boss.maxHp;
  boss.phase = 0;
  boss.cooldown = 1;
  boss.hurt = 0;
  boss.generation++;
  w.bossDefeated = false;
  w.projectiles = [];
  w.effects = [];
  w.message = 'Rowan: The guardian encounter has been reset.';
  return null;
}
export function parseRespawnConfig(value: unknown): typeof RESPAWN | null {
  if (!value || typeof value !== 'object') return null;
  const result = structuredClone(RESPAWN);
  for (const kind of ['slime', 'wolf', 'wisp', 'guardian'] as const) {
    if (!(kind in value)) continue;
    const entry: unknown = Reflect.get(value, kind);
    if (!entry || typeof entry !== 'object') return null;
    for (const field of ['seconds', 'maximum', 'safeDistance'] as const) {
      const n: unknown = Reflect.get(entry, field);
      if (
        typeof n !== 'number' ||
        !Number.isFinite(n) ||
        n < 0 ||
        n > (field === 'seconds' ? 3600 : field === 'maximum' ? 10 : 1000) ||
        (field === 'maximum' && !Number.isInteger(n))
      )
        return null;
      result[kind][field] = n;
    }
  }
  if (result.guardian.seconds !== 0 || result.guardian.maximum !== 1)
    return null;
  return result;
}
