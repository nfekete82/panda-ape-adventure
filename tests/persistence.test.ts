import { it, expect } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JsonSaveStore } from '../apps/server/src/persistence';
import { RoomManager } from '../apps/server/src/rooms';
it('serializes simultaneous saves, restores state and ignores corrupt snapshots', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'panda-store-'));
  try {
    const store = new JsonSaveStore(directory),
      manager = new RoomManager();
    const { room, session } = manager.create('panda');
    room.world.players[0]!.hp = 77;
    manager.disconnect(room, session);
    const expiry = session.expires;
    await Promise.all([store.save(room), store.save(room), store.save(room)]);
    await writeFile(join(directory, 'ZZZZZ.json'), '{broken');
    const restored = await store.loadAll();
    expect(restored).toHaveLength(1);
    expect(restored[0]!.world.players[0]!.hp).toBe(77);
    expect(restored[0]!.world.players[0]!.connected).toBe(false);
    expect(restored[0]!.sessions[0]!.expires).toBe(expiry);
    manager.rooms.set(room.code, restored[0]!);
    expect(manager.resume(room.code, session.token).session.playerId).toBe(
      session.playerId,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

import { SqliteSaveStore } from '../apps/server/src/sqlite';
import {
  awardXp,
  grant,
  quantity,
  applyRpgAction,
  damageEnemy,
  WORLD,
} from '@panda/shared';
import { DatabaseSync } from 'node:sqlite';
import { readdir } from 'node:fs/promises';
it('SQLite atomically saves progression, item identities and receipts, migrates stale JSON once and backs up on restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'panda-sqlite-'));
  let store = new SqliteSaveStore(directory);
  try {
    const manager = new RoomManager(),
      { room, session } = manager.create('panda');
    const p = room.world.players[0]!;
    awardXp(p, 75);
    grant(p, 'coin', 50);
    grant(p, 'leather', 4);
    grant(p, 'crystal', 3);
    p.x = WORLD.smith.x;
    p.y = WORLD.smith.y;
    expect(applyRpgAction(room.world, p, { kind: 'upgrade' }, 1)).toBeNull();
    damageEnemy(room.world, room.world.enemies[0]!, 1000, p);
    manager.disconnect(room, session);
    await Promise.all([store.save(room), store.save(room), store.save(room)]);
    const restored = await store.loadAll();
    expect(restored[0]!.world.players[0]!.weapon.upgrade).toBe(1);
    const recovered = restored[0]!.world;
    const recoveredXp = recovered.players[0]!.xp;
    damageEnemy(recovered, recovered.enemies[0]!, 1000, recovered.players[0]!);
    expect(recovered.players[0]!.xp).toBe(recoveredXp);
    const profile = await store.character(session.token);
    expect(profile?.id).toBe(p.id);
    expect(profile?.receipts).toEqual(p.receipts);
    expect(quantity(profile!, 'coin')).toBe(30);
    const db = new DatabaseSync(join(directory, 'saves.sqlite'));
    expect(db.prepare('SELECT COUNT(*) AS n FROM rewards').get()?.n).toBe(1);
    expect(db.prepare('SELECT COUNT(*) AS n FROM inventory').get()?.n).toBe(4);
    db.close();
    await store.close();
    store = new SqliteSaveStore(directory);
    expect(await store.loadAll()).toHaveLength(1);
    expect(
      (await readdir(join(directory, 'backups'))).some((f) =>
        f.endsWith('.sqlite'),
      ),
    ).toBe(true);
    await store.close();
    // The 0.1 store's room can be expired while its character remains recoverable.
    const legacy = new RoomManager().create('ape');
    const old: Record<string, unknown> = { ...legacy.room.world };
    delete old.respawn;
    delete old.instanceId;
    legacy.room.world.players[0]!.crystals = 13;
    await writeFile(
      join(directory, `${legacy.room.code}.json`),
      JSON.stringify({
        version: 1,
        world: old,
        sessions: [{ ...legacy.session, expires: Date.now() - 60000 }],
        savedAt: Date.now() - 120000,
      }),
    );
    store = new SqliteSaveStore(directory);
    expect(await store.loadAll()).toHaveLength(1);
    expect(
      quantity((await store.character(legacy.session.token))!, 'crystal'),
    ).toBe(13);
    await store.close();
    store = new SqliteSaveStore(directory);
    await store.loadAll();
    expect(
      quantity((await store.character(legacy.session.token))!, 'crystal'),
    ).toBe(13);
  } finally {
    await store.close();
    await rm(directory, { recursive: true, force: true });
  }
});
it('permanent character resumes into a fresh world independently of expired room recovery', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'panda-character-'));
  const store = new SqliteSaveStore(directory);
  try {
    const manager = new RoomManager(),
      { room, session } = manager.create('ape');
    const p = room.world.players[0]!;
    awardXp(p, 300);
    grant(p, 'ancient', 2);
    await store.save(room);
    const character = await store.character(session.token);
    expect(() => manager.create('ape', character!, session.token)).toThrow(
      'already',
    );
    manager.disconnect(room, session, 0);
    manager.update(0.03, 62000);
    const next = manager.create('ape', character!, session.token);
    expect(next.room.code).not.toBe(room.code);
    expect(next.room.world.players[0]!.level).toBe(3);
    expect(next.room.world.enemies.every((e) => e.id === 'shrine-warden' ? e.hp === 0 : e.hp === e.maxHp)).toBe(true);
    expect(
      await store.character('00000000-0000-0000-0000-000000000000'),
    ).toBeNull();
  } finally {
    await store.close();
    await rm(directory, { recursive: true, force: true });
  }
});
