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
