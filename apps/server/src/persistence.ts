import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { migrateWorld } from '@panda/shared';
import type { Room } from './rooms.js';
export interface SaveStore {
  save(room: Room): Promise<void>;
  loadAll(): Promise<Room[]>;
}
// Atomic JSON storage is isolated behind this interface; SQL adapters can replace it.
export class JsonSaveStore implements SaveStore {
  private queues = new Map<string, Promise<void>>();
  constructor(private directory: string) {}
  save(room: Room): Promise<void> {
    const previous = this.queues.get(room.code) ?? Promise.resolve();
    const next = previous.catch(() => {}).then(() => this.write(room));
    this.queues.set(room.code, next);
    void next
      .finally(() => {
        if (this.queues.get(room.code) === next) this.queues.delete(room.code);
      })
      .catch(() => {});
    return next;
  }
  private async write(room: Room): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const path = join(this.directory, `${room.code}.json`);
    await writeFile(
      `${path}.tmp`,
      JSON.stringify({
        version: 1,
        code: room.code,
        world: room.world,
        sessions: room.sessions.map((s) => ({
          ...s,
          expires: Number.isFinite(s.expires) ? s.expires : Date.now() + 60000,
        })),
        savedAt: Date.now(),
      }),
    );
    await rename(`${path}.tmp`, path);
  }
  async loadAll(): Promise<Room[]> {
    const { readdir } = await import('node:fs/promises');
    await mkdir(this.directory, { recursive: true });
    const rooms: Room[] = [];
    for (const file of await readdir(this.directory)) {
      if (!/^[A-Z2-9]{5}\.json$/.test(file)) continue;
      try {
        const data = JSON.parse(
          await readFile(join(this.directory, file), 'utf8'),
        ) as {
          version: number;
          code: string;
          world: Room['world'];
          sessions: Room['sessions'];
          savedAt: number;
        };
        if (data.version !== 1) continue;
        const world = migrateWorld(data.world, data.code);
        if (!world) continue;
        if (Date.now() - data.savedAt > 60000) {
          if (!world.valley.settled) continue;
          world.players = [];
          data.sessions = [];
        }
        world.players.forEach((p) => (p.connected = false));
        rooms.push({
          code: data.code,
          world,
          sessions: data.sessions,
          inputs: new Map(),
          emptySince: Date.now(),
        });
      } catch {
        /* Corrupt saves never prevent startup. */
      }
    }
    return rooms;
  }
}
