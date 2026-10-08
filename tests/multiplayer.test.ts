import { beforeAll, afterAll, it, expect } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import {
  awardXp,
  grant,
  WORLD,
  neutralInput,
  type ServerMessage,
  type World,
  type ClientMessage,
} from '@panda/shared';
import { RoomManager } from '../apps/server/src/rooms';
import { SqliteSaveStore } from '../apps/server/src/sqlite';
let server: ChildProcess, saveDir: string;
let fixture: ReturnType<RoomManager['create']>,
  partner: ReturnType<RoomManager['join']>;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
class Client {
  ws = new WebSocket('ws://127.0.0.1:3002/ws');
  world?: World;
  welcome?: Extract<ServerMessage, { type: 'welcome' }>;
  errors: string[] = [];
  messages: ServerMessage[] = [];
  sequence = 0;
  constructor() {
    this.ws.on('message', (data) => {
      const m = JSON.parse(data.toString()) as ServerMessage;
      this.messages.push(m);
      if (m.type === 'state') this.world = m.world;
      if (m.type === 'welcome') this.welcome = m;
      if (m.type === 'error') this.errors.push(m.message);
    });
  }
  async open() {
    await new Promise<void>((resolve, reject) => {
      this.ws.once('open', resolve);
      this.ws.once('error', reject);
    });
  }
  send(m: ClientMessage) {
    this.ws.send(JSON.stringify(m));
  }
  async until(predicate: () => boolean, timeout = 6000) {
    const start = Date.now();
    while (!predicate()) {
      if (Date.now() - start > timeout)
        throw Error('Timed out waiting for server event');
      await delay(25);
    }
  }
  close() {
    this.ws.close();
  }
}
beforeAll(async () => {
  saveDir = await mkdtemp(join(tmpdir(), 'panda-test-'));
  const manager = new RoomManager();
  fixture = manager.create('panda');
  partner = manager.join(fixture.room.code, 'ape');
  for (const p of fixture.room.world.players) {
    awardXp(p, 75);
    grant(p, 'coin', 50);
    grant(p, 'leather', 4);
    grant(p, 'crystal', 3);
    p.x = WORLD.smith.x;
    p.y = WORLD.smith.y;
  }
  const enemy = fixture.room.world.enemies[0]!;
  enemy.x = WORLD.smith.x + 45;
  enemy.y = WORLD.smith.y;
  enemy.hp = 1;
  fixture.room.world.respawn.slime.seconds = 1;
  const store = new SqliteSaveStore(saveDir);
  await store.save(fixture.room);
  await store.close();
  server = spawn(
    process.execPath,
    ['--import', 'tsx', 'apps/server/src/index.ts'],
    {
      cwd: process.cwd(),
      env: { ...process.env, PORT: '3002', SAVE_DIR: saveDir },
      stdio: 'pipe',
    },
  );
  for (let n = 0; n < 80; n++) {
    try {
      if ((await fetch('http://127.0.0.1:3002/health')).ok) return;
    } catch {
      /* Wait for boot. */
    }
    await delay(100);
  }
  throw Error('Integration server did not start');
});
afterAll(async () => {
  if (server) {
    server.kill('SIGTERM');
    await delay(300);
    if (server.exitCode === null) server.kill('SIGKILL');
  }
  if (saveDir) await rm(saveDir, { recursive: true, force: true });
});
it('two real WebSocket clients share movement, combat, health, save and reconnect', async () => {
  const a = new Client(),
    b = new Client(),
    duplicate = new Client();
  let interval: ReturnType<typeof setInterval> | undefined;
  try {
    await Promise.all([a.open(), b.open(), duplicate.open()]);
    a.send({ type: 'create', hero: 'panda' });
    await a.until(() => !!a.welcome);
    const code = a.welcome!.code;
    duplicate.send({ type: 'join', code, hero: 'panda' });
    await duplicate.until(() => duplicate.errors.length > 0);
    expect(duplicate.errors[0]).toContain('already taken');
    b.send({ type: 'join', code, hero: 'ape' });
    await b.until(() => !!b.welcome && b.world?.players.length === 2);
    await a.until(() => a.world?.players.length === 2);
    expect(a.welcome!.playerId).not.toBe(b.welcome!.playerId);
    expect(b.world!.enemies.map((e) => e.id)).toEqual(
      a.world!.enemies.map((e) => e.id),
    );
    const initialHp = a.world!.enemies.reduce((sum, e) => sum + e.hp, 0);
    const start = a.world!.players.find((p) => p.id === a.welcome!.playerId)!.x;
    const input = { ...neutralInput(), x: 1, y: -0.65, attack: true };
    interval = setInterval(
      () => a.send({ type: 'input', input: { ...input, seq: ++a.sequence } }),
      34,
    );
    await b.until(
      () =>
        b.world!.players.find((p) => p.id === a.welcome!.playerId)!.x >
        start + 85,
    );
    input.x = 0;
    input.y = 0;
    // Aim at the nearest shared enemy while it chases the warrior.
    const aim = setInterval(() => {
      const p = a.world!.players.find((p) => p.id === a.welcome!.playerId)!;
      const e = a
        .world!.enemies.filter((e) => e.hp > 0)
        .sort(
          (e, f) =>
            Math.hypot(e.x - p.x, e.y - p.y) - Math.hypot(f.x - p.x, f.y - p.y),
        )[0]!;
      const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
      input.aimX = (e.x - p.x) / d;
      input.aimY = (e.y - p.y) / d;
    }, 100);
    try {
      await b.until(
        () => b.world!.enemies.reduce((sum, e) => sum + e.hp, 0) < initialHp,
        8000,
      );
    } finally {
      clearInterval(aim);
    }
    clearInterval(interval);
    interval = undefined;
    const hurtIds = b
      .world!.enemies.filter((e) => e.hp < e.maxHp)
      .map((e) => e.id);
    await a.until(() =>
      a.world!.enemies.some((e) => hurtIds.includes(e.id) && e.hp < e.maxHp),
    );
    a.send({ type: 'save' });
    await a.until(() => a.messages.some((m) => m.type === 'saved'));
    b.close();
    await a.until(() =>
      a.world!.players.some((p) => p.hero === 'ape' && !p.connected),
    );
    const resumed = new Client();
    try {
      await resumed.open();
      resumed.send({ type: 'resume', code, token: b.welcome!.token });
      await resumed.until(() => !!resumed.welcome);
      expect(resumed.welcome!.playerId).toBe(b.welcome!.playerId);
      await a.until(() => a.world!.players.every((p) => p.connected));
    } finally {
      resumed.close();
    }
  } finally {
    if (interval) clearInterval(interval);
    a.close();
    b.close();
    duplicate.close();
  }
}, 14000);
it('rejects oversized messages and enforces message rate limits', async () => {
  const a = new Client();
  await a.open();
  const closed = new Promise<number>((r) => a.ws.once('close', r));
  for (let n = 0; n < 75; n++) a.ws.send('{"type":"save"}');
  expect(await closed).toBe(1008);
  const b = new Client();
  await b.open();
  const oversized = new Promise<number>((r) => b.ws.once('close', r));
  b.ws.send('x'.repeat(3000));
  expect(await oversized).toBe(1009);
});

it('real clients synchronize attribute spending, upgrades, XP, drops and respawns; replays and forged actions fail', async () => {
  const a = new Client(),
    b = new Client();
  try {
    await Promise.all([a.open(), b.open()]);
    a.send({
      type: 'resume',
      code: fixture.room.code,
      token: fixture.session.token,
    });
    b.send({
      type: 'resume',
      code: fixture.room.code,
      token: partner.session.token,
    });
    await a.until(
      () => !!a.welcome && a.world?.players.every((p) => p.connected) === true,
    );
    await b.until(() => !!b.world);
    a.send({
      type: 'rpg',
      seq: 1,
      action: { kind: 'attribute', attribute: 'strength' },
    });
    await b.until(
      () =>
        b.world!.players.find((p) => p.hero === 'panda')!.attributes
          .strength === 1,
    );
    a.send({
      type: 'rpg',
      seq: 1,
      action: { kind: 'attribute', attribute: 'strength' },
    });
    await a.until(() => a.errors.some((e) => e.includes('Stale')));
    expect(b.world!.players.find((p) => p.hero === 'panda')!.points).toBe(2);
    a.send({ type: 'rpg', seq: 2, action: { kind: 'upgrade' } });
    await b.until(
      () =>
        b.world!.players.find((p) => p.hero === 'panda')!.weapon.upgrade === 1,
    );
    expect(
      b
        .world!.players.find((p) => p.hero === 'panda')!
        .inventory.find((i) => i.kind === 'coin')!.quantity,
    ).toBe(30);
    a.send({ type: 'rpg', seq: 3, action: { kind: 'upgrade' } });
    await a.until(() => a.errors.some((e) => e.includes('Not enough')));
    a.ws.send(
      JSON.stringify({
        type: 'rpg',
        seq: 4,
        action: { kind: 'grant', coins: 99999 },
      }),
    );
    await a.until(() => a.errors.some((e) => e.includes('Invalid')));
    a.send({
      type: 'input',
      input: { ...neutralInput(), attack: true, seq: 1 },
    });
    await b.until(() => b.world!.kills === 1);
    expect(b.world!.players.every((p) => p.xp === 25)).toBe(true);
    const coins =
      b.world!.players.reduce(
        (sum, p) =>
          sum + (p.inventory.find((i) => i.kind === 'coin')?.quantity ?? 0),
        0,
      ) +
      b
        .world!.loot.filter((l) => l.kind === 'coin')
        .reduce((sum, l) => sum + l.quantity, 0);
    expect(coins).toBe(92);
    a.send({ type: 'input', input: { ...neutralInput(), seq: 2 } });
    await b.until(() => b.world!.enemies[0]!.generation === 1);
    expect(b.world!.enemies[0]!.hp).toBe(b.world!.enemies[0]!.maxHp);
    expect(b.world!.kills).toBe(1);
    a.send({ type: 'save' });
    await a.until(() => a.messages.some((m) => m.type === 'saved'));
  } finally {
    a.close();
    b.close();
  }
});
