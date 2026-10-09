import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import {
  neutralInput,
  type World,
  type ClientMessage,
  type ServerMessage,
} from '@panda/shared';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
class Client {
  socket = new WebSocket('ws://127.0.0.1:8080/ws');
  world?: World;
  welcome?: Extract<ServerMessage, { type: 'welcome' }>;
  saved = false;
  error = '';
  constructor() {
    this.socket.on('message', (data) => {
      const m = JSON.parse(data.toString()) as ServerMessage;
      if (m.type === 'welcome') this.welcome = m;
      if (m.type === 'state') this.world = m.world;
      if (m.type === 'saved') this.saved = true;
      if (m.type === 'error') this.error = m.message;
    });
  }
  async open() {
    await new Promise<void>((resolve, reject) => {
      this.socket.once('open', resolve);
      this.socket.once('error', reject);
    });
  }
  send(m: ClientMessage) {
    this.socket.send(JSON.stringify(m));
  }
  async until(predicate: () => boolean) {
    const start = Date.now();
    while (!predicate()) {
      if (this.error) throw Error(this.error);
      if (Date.now() - start > 10000)
        throw Error('Timed out waiting for Docker game');
      await delay(30);
    }
  }
}
const clients: Client[] = [];
try {
  const a = new Client(),
    b = new Client();
  clients.push(a, b);
  await Promise.all([a.open(), b.open()]);
  a.send({ type: 'create', hero: 'panda' });
  await a.until(() => !!a.welcome);
  b.send({ type: 'join', code: a.welcome!.code, hero: 'ape' });
  await b.until(() => !!b.welcome);
  await a.until(() => a.world?.players.length === 2);
  a.send({ type: 'input', input: { ...neutralInput(), x: 1, seq: 1 } });
  await delay(150);
  a.send({ type: 'input', input: { ...neutralInput(), seq: 2 } });
  await a.until(
    () =>
      a.world!.players.find((p) => p.id === a.welcome!.playerId)!.lastSeq === 2,
  );
  // Establish persistent settlement state through bounded intent via nginx.
  a.send({
    type: 'valley',
    seq: 1,
    action: { kind: 'buy', item: 'wateringCan', count: 1 },
  });
  await a.until(() => a.world?.valley.bag.wateringCan === 1);
  assert.equal(a.world!.valley.gold, 12);
  const before = structuredClone(a.world!);
  a.send({ type: 'save' });
  await a.until(() => a.saved);
  console.log(
    'Verified two-player room and save through nginx /ws. Restarting this Compose stack…',
  );
  await new Promise<void>((resolve, reject) => {
    const child = spawn('docker', ['compose', 'restart'], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(Error(`Compose restart failed: ${code}`)),
    );
  });
  for (let n = 0; n < 100; n++) {
    try {
      if ((await fetch('http://127.0.0.1:8080/health')).ok) break;
    } catch {
      /* wait for health */
    }
    await delay(100);
  }
  const ra = new Client(),
    rb = new Client();
  clients.push(ra, rb);
  await Promise.all([ra.open(), rb.open()]);
  ra.send({ type: 'resume', code: a.welcome!.code, token: a.welcome!.token });
  await ra.until(() => !!ra.welcome);
  rb.send({ type: 'resume', code: b.welcome!.code, token: b.welcome!.token });
  await rb.until(() => !!rb.welcome);
  await ra.until(() => ra.world?.players.every((p) => p.connected) === true);
  assert.equal(ra.welcome!.playerId, a.welcome!.playerId);
  assert.equal(rb.welcome!.playerId, b.welcome!.playerId);
  for (const player of before.players) {
    const restored = ra.world!.players.find((p) => p.id === player.id)!;
    assert.equal(restored.hero, player.hero);
    assert.equal(restored.hp, player.hp);
    assert.equal(restored.level, player.level);
    assert.equal(restored.xp, player.xp);
    assert.deepEqual(restored.attributes, player.attributes);
    assert.deepEqual(restored.weapon, player.weapon);
    assert.deepEqual(restored.inventory, player.inventory);
    assert.deepEqual(restored.receipts, player.receipts);
    assert.ok(Math.abs(restored.x - player.x) < 1);
    assert.ok(Math.abs(restored.y - player.y) < 1);
  }
  assert.deepEqual(
    ra.world!.enemies.map((e) => [
      e.id,
      e.hp,
      e.generation,
      e.respawnRemaining,
    ]),
    before.enemies.map((e) => [e.id, e.hp, e.generation, e.respawnRemaining]),
  );
  assert.deepEqual(ra.world!.valley.bag, before.valley.bag);
  assert.equal(ra.world!.valley.gold, before.valley.gold);
  assert.deepEqual(ra.world!.valley.owners, before.valley.owners);
  assert.equal(ra.world!.valley.settled, true);
  console.log(
    'PASS: Compose restart restored both sessions, positions, heroes, health and shared enemies.',
  );
} finally {
  for (const client of clients) client.socket.close();
}
