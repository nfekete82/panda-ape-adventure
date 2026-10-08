import { DatabaseSync } from 'node:sqlite';
import {
  mkdir,
  readFile,
  readdir,
  copyFile,
  rename,
  rm,
} from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  createPlayer,
  isPlayer,
  migrateWorld,
  type Player,
} from '@panda/shared';
import type { SaveStore } from './persistence.js';
import type { Room, Session } from './rooms.js';
const key = (token: string) => createHash('sha256').update(token).digest('hex');
function sessions(value: unknown): value is Session[] {
  return (
    Array.isArray(value) &&
    value.length <= 2 &&
    value.every((s: unknown) => {
      if (!s || typeof s !== 'object') return false;
      return (
        'token' in s &&
        typeof s.token === 'string' &&
        /^[\da-f-]{36}$/.test(s.token) &&
        'playerId' in s &&
        typeof s.playerId === 'string' &&
        'expires' in s &&
        typeof s.expires === 'number' &&
        Number.isFinite(s.expires)
      );
    })
  );
}
function permanent(p: Player): Player {
  const result = createPlayer(p.id, p.hero);
  const {
    level,
    xp,
    points,
    attributes,
    weapon,
    inventory,
    receipts,
    commandSeq,
    potions,
    crystals,
    maxHp,
  } = p;
  return {
    ...result,
    level,
    xp,
    points,
    attributes,
    weapon,
    inventory,
    receipts,
    commandSeq,
    potions,
    crystals,
    maxHp,
    hp: maxHp,
  };
}
export class SqliteSaveStore implements SaveStore {
  private db?: DatabaseSync;
  private ready?: Promise<void>;
  private queue: Promise<void> = Promise.resolve();
  constructor(private directory: string) {}
  private initialize(): Promise<void> {
    return (this.ready ??= this.open());
  }
  private async open() {
    await mkdir(join(this.directory, 'backups'), {
      recursive: true,
      mode: 0o700,
    });
    const db = (this.db = new DatabaseSync(
      join(this.directory, 'saves.sqlite'),
    ));
    db.exec(
      'PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;',
    );
    const version = db.prepare('PRAGMA user_version').get()?.user_version;
    if (typeof version !== 'number' || version > 1)
      throw Error('Unsupported SQLite schema version.');
    if (version > 0) await this.backup();
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS characters (id TEXT PRIMARY KEY, credential TEXT UNIQUE NOT NULL, progress TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS inventory (id TEXT PRIMARY KEY, character_id TEXT NOT NULL REFERENCES characters(id), kind TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity >= 0), UNIQUE(character_id, kind));
      CREATE TABLE IF NOT EXISTS rewards (character_id TEXT NOT NULL REFERENCES characters(id), receipt TEXT NOT NULL, PRIMARY KEY(character_id, receipt));
      CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, snapshot TEXT NOT NULL, saved_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS migrations (source TEXT PRIMARY KEY, migrated_at INTEGER NOT NULL);
      PRAGMA user_version=1; COMMIT;`);
    for (const file of await readdir(this.directory)) {
      if (
        !/^[A-Z2-9]{5}\.json$/.test(file) ||
        db.prepare('SELECT source FROM migrations WHERE source=?').get(file)
      )
        continue;
      let data: unknown;
      try {
        data = JSON.parse(await readFile(join(this.directory, file), 'utf8'));
      } catch {
        continue;
      }
      if (
        !data ||
        typeof data !== 'object' ||
        !('version' in data) ||
        data.version !== 1 ||
        !('world' in data) ||
        !('sessions' in data) ||
        !sessions(data.sessions) ||
        !('savedAt' in data) ||
        typeof data.savedAt !== 'number' ||
        !Number.isFinite(data.savedAt)
      )
        continue;
      const world = migrateWorld(data.world, `legacy:${file}`);
      if (!world) continue;
      await copyFile(
        join(this.directory, file),
        join(this.directory, 'backups', file),
      );
      const room: Room = {
        code: file.slice(0, 5),
        world,
        sessions: data.sessions,
        inputs: new Map(),
        emptySince: 0,
      };
      db.exec('BEGIN IMMEDIATE');
      try {
        this.write(room, data.savedAt);
        db.prepare('INSERT INTO migrations VALUES (?, ?)').run(
          file,
          Date.now(),
        );
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    }
  }
  // SQLite commits replace a logical snapshot atomically. Backups use an atomic file rename.
  async backup(): Promise<void> {
    const db = this.db;
    if (!db) throw Error('Store unavailable.');
    const path = join(this.directory, 'backups', `sqlite-${Date.now()}.sqlite`);
    await rm(`${path}.tmp`, { force: true });
    db.prepare('VACUUM INTO ?').run(`${path}.tmp`);
    await rename(`${path}.tmp`, path);
  }
  save(room: Room): Promise<void> {
    const snapshot = structuredClone({ ...room, inputs: new Map() });
    snapshot.sessions = snapshot.sessions.map((s) => ({
      ...s,
      expires: Number.isFinite(s.expires) ? s.expires : Date.now() + 60000,
    }));
    const savedAt = Date.now();
    const next = this.queue
      .catch(() => {})
      .then(async () => {
        await this.initialize();
        const db = this.db;
        if (!db) throw Error('Store unavailable.');
        db.exec('BEGIN IMMEDIATE');
        try {
          this.write(snapshot, savedAt);
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      });
    this.queue = next;
    return next;
  }
  private write(room: Room, savedAt: number) {
    const db = this.db;
    if (!db) throw Error('Store unavailable.');
    for (const p of room.world.players) {
      const session = room.sessions.find((s) => s.playerId === p.id);
      if (!session) throw Error('Character has no credential.');
      const progress = permanent(p);
      // Receipts and item identities survive room expiry and are committed with rewards.
      db.prepare(
        'INSERT INTO characters VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET progress=excluded.progress',
      ).run(p.id, key(session.token), JSON.stringify(progress));
      db.prepare('DELETE FROM inventory WHERE character_id=?').run(p.id);
      for (const item of p.inventory)
        db.prepare('INSERT INTO inventory VALUES (?, ?, ?, ?)').run(
          item.id,
          p.id,
          item.kind,
          item.quantity,
        );
      for (const receipt of p.receipts)
        db.prepare('INSERT OR IGNORE INTO rewards VALUES (?, ?)').run(
          p.id,
          receipt,
        );
    }
    db.prepare(
      'INSERT INTO rooms VALUES (?, ?, ?) ON CONFLICT(code) DO UPDATE SET snapshot=excluded.snapshot, saved_at=excluded.saved_at',
    ).run(
      room.code,
      JSON.stringify({ world: room.world, sessions: room.sessions }),
      savedAt,
    );
  }
  async character(token: string): Promise<Player | null> {
    await this.queue;
    await this.initialize();
    const row = this.db
      ?.prepare('SELECT progress FROM characters WHERE credential=?')
      .get(key(token));
    if (typeof row?.progress !== 'string') return null;
    const value: unknown = JSON.parse(row.progress);
    return isPlayer(value) ? value : null;
  }
  async loadAll(): Promise<Room[]> {
    await this.initialize();
    const rooms: Room[] = [];
    for (const row of this.db
      ?.prepare('SELECT code, snapshot FROM rooms WHERE saved_at >= ?')
      .all(Date.now() - 60000) ?? []) {
      if (typeof row.code !== 'string' || typeof row.snapshot !== 'string')
        continue;
      const data: unknown = JSON.parse(row.snapshot);
      if (
        !data ||
        typeof data !== 'object' ||
        !('world' in data) ||
        !('sessions' in data) ||
        !sessions(data.sessions)
      )
        continue;
      const world = migrateWorld(data.world);
      if (!world) continue;
      world.players.forEach((p) => (p.connected = false));
      rooms.push({
        code: row.code,
        world,
        sessions: data.sessions,
        inputs: new Map(),
        emptySince: Date.now(),
      });
    }
    return rooms;
  }
  async close() {
    await this.queue;
    this.db?.close();
    this.db = undefined;
  }
}
