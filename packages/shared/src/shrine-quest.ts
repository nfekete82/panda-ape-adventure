import { awardXp, grant } from './rpg.js';
import { BAMBOO_SHRINE } from './bamboo-crossing.js';
import type { Enemy, Player, World } from './index.js';

export type ShrineStage = 'dormant' | 'hunting' | 'return' | 'blessed';
export const SHRINE_WARDEN_ID = 'shrine-warden';
export const SHRINE_WARDEN_SPAWN = { x: 2590, y: 646 } as const;
export const SHRINE_INTERACT_RADIUS = 104;

export function createShrineWarden(): Enemy {
  return {
    id: SHRINE_WARDEN_ID,
    kind: 'wisp', // Reuse the existing ranged combat archetype, not a new network schema.
    x: SHRINE_WARDEN_SPAWN.x,
    y: SHRINE_WARDEN_SPAWN.y,
    spawn: { ...SHRINE_WARDEN_SPAWN },
    hp: 0, // Dormant until the player touches the altar.
    maxHp: 210,
    cooldown: 1.5,
    hurt: 0,
    phase: 0,
    respawnRemaining: 0,
    generation: 0,
  };
}

/** Upgrade older solo/SQLite worlds in place, without discarding any progress. */
export function prepareShrineQuest(w: World): void {
  w.shrine ??= 'dormant';
  if (!w.enemies.some((e) => e.id === SHRINE_WARDEN_ID))
    w.enemies.push(createShrineWarden());
}
function pulse(w: World, text: string): void {
  w.nextId = (w.nextId ?? 0) + 1;
  w.effects.push({
    id: `e${w.nextId}`,
    x: BAMBOO_SHRINE.x,
    y: BAMBOO_SHRINE.y,
    kind: 'magic',
    text,
    radius: 88,
    life: 0.5,
  });
}

export function shrineQuestMessage(stage: ShrineStage): { title: string; body: string } {
  switch (stage) {
    case 'dormant':
      return { title: 'The sleeping emerald', body: 'Approach the ancient altar and press E to listen.' };
    case 'hunting':
      return { title: 'Echoes in the bamboo', body: 'Defeat the awakened Jade Warden southeast of the shrine.' };
    case 'return':
      return { title: 'The grove remembers', body: 'Return to the shrine altar (E) to receive its blessing.' };
    case 'blessed':
      return { title: 'Blessing of the grove', body: 'The ancient spirit rests. You earned 2 attribute points and rare materials.' };
  }
}
export function shrineWardenDefeated(w: World): void {
  if (w.shrine !== 'hunting') return;
  w.shrine = 'return';
  w.message = 'The Jade Warden dissolves into emerald sparks. Return to the shrine.';
  pulse(w, 'WARDEN DEFEATED');
}

/** Interactions run exclusively inside the authoritative simulation step. */
export function interactShrine(w: World, p: Player): boolean {
  if (Math.hypot(p.x - BAMBOO_SHRINE.x, p.y - BAMBOO_SHRINE.y) >= SHRINE_INTERACT_RADIUS)
    return false;
  prepareShrineQuest(w);
  if (w.shrine === 'dormant') {
    w.shrine = 'hunting';
    const warden = w.enemies.find((enemy) => enemy.id === SHRINE_WARDEN_ID)!;
    warden.x = warden.spawn.x;
    warden.y = warden.spawn.y;
    warden.hp = warden.maxHp;
    warden.cooldown = 1.3;
    warden.phase = 0;
    w.message = 'Mossbound Shrine: The emerald whispers. A Jade Warden guards the grove!';
    pulse(w, 'SHRINE AWAKENED');
  } else if (w.shrine === 'return') {
    w.shrine = 'blessed';
    for (const hero of w.players) {
      const receipt = `${w.instanceId}:shrine-blessing`;
      if (hero.receipts.includes(receipt)) continue;
      hero.receipts.push(receipt);
      hero.points += 2; // Original permanent level-up attribute system.
      grant(hero, 'ancient', 2);
      grant(hero, 'crystal', 8);
      if (awardXp(hero, 100)) {
        w.nextId++;
        w.effects.push({
          id: `e${w.nextId}`, ...hero, kind: 'heal', radius: 45,
          text: 'LEVEL UP', life: 0.45,
        });
      }
    }
    w.message = 'Mossbound Shrine: You have earned the Grove Blessing: +2 attribute points, 2 ancient relics and 8 crystals!';
    pulse(w, 'GROVE BLESSING');
  } else {
    w.message = w.shrine === 'hunting'
      ? 'Mossbound Shrine: The Jade Warden still guards the grove.'
      : 'Mossbound Shrine: The forest remembers your courage.';
  }
  return true;
}
