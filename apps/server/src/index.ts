import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  parseMessage,
  neutralInput,
  applyRpgAction,
  applyValleyAction,
  parseRespawnConfig,
  RESPAWN,
  type ServerMessage,
} from '@panda/shared';
import { RoomManager, type Room, type Session } from './rooms.js';
import { SqliteSaveStore } from './sqlite.js';
const respawn = process.env.RESPAWN_CONFIG
  ? parseRespawnConfig(JSON.parse(process.env.RESPAWN_CONFIG))
  : RESPAWN;
if (!respawn) throw Error('Invalid RESPAWN_CONFIG.');
const manager = new RoomManager(respawn);
const store = new SqliteSaveStore(process.env.SAVE_DIR ?? './data');
for (const room of await store.loadAll()) manager.rooms.set(room.code, room);
const http = createServer((req, res) => {
  res.writeHead(req.url === '/health' ? 200 : 404, {
    'Content-Type': 'application/json',
  });
  res.end(
    JSON.stringify(
      req.url === '/health'
        ? { ok: true, rooms: manager.rooms.size }
        : { error: 'Not found' },
    ),
  );
});
const wss = new WebSocketServer({
  server: http,
  path: '/ws',
  maxPayload: 2048,
});
interface Connection {
  room?: Room;
  session?: Session;
  count: number;
  window: number;
  lastInput: number;
  lastSeq: number;
  lastSave: number;
  alive: boolean;
}
const connections = new Map<WebSocket, Connection>();
let shuttingDown = false;
const send = (ws: WebSocket, m: ServerMessage) => {
  if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 256000)
    ws.send(JSON.stringify(m));
};
wss.on('connection', (ws) => {
  if (connections.size >= 200) {
    ws.close(1013, 'Server full');
    return;
  }
  const connection: Connection = {
    count: 0,
    window: Date.now(),
    lastInput: Date.now(),
    lastSeq: -1,
    lastSave: 0,
    alive: true,
  };
  connections.set(ws, connection);
  ws.on('error', () => {
    /* close handler releases the session */
  });
  ws.on('pong', () => {
    connection.alive = true;
  });
  ws.on('message', async (raw, isBinary) => {
    const now = Date.now();
    if (now - connection.window > 1000) {
      connection.window = now;
      connection.count = 0;
    }
    if (++connection.count > 70) {
      ws.close(1008, 'Message rate exceeded');
      return;
    }
    const message = isBinary ? null : parseMessage(raw.toString());
    if (!message) {
      send(ws, { type: 'error', message: 'Invalid message.' });
      return;
    }
    try {
      if (message.type === 'input') {
        if (!connection.room || !connection.session)
          throw Error('Join a room first.');
        if (message.input.seq <= connection.lastSeq) return;
        connection.lastSeq = message.input.seq;
        connection.lastInput = now;
        connection.room.inputs.set(connection.session.playerId, message.input);
      } else if (message.type === 'rpg' || message.type === 'valley') {
        if (!connection.room || !connection.session)
          throw Error('Join a room first.');
        const player = connection.room.world.players.find(
          (p) => p.id === connection.session?.playerId,
        );
        if (!player) throw Error('Character unavailable.');
        const error =
          message.type === 'valley'
            ? applyValleyAction(
                connection.room.world,
                player,
                message.action,
                message.seq,
              )
            : applyRpgAction(
                connection.room.world,
                player,
                message.action,
                message.seq,
              );
        if (error) throw Error(error);
        await store.save(connection.room);
        send(ws, { type: 'state', world: connection.room.world });
      } else if (message.type === 'save') {
        if (!connection.room) throw Error('Join a room first.');
        if (now - connection.lastSave < 3000)
          throw Error('Please wait before saving again.');
        connection.lastSave = now;
        await store.save(connection.room);
        send(ws, { type: 'saved' });
      } else {
        if (connection.room) throw Error('Already in a room.');
        const characterToken =
          message.type === 'resume' ? undefined : message.characterToken;
        const character = characterToken
          ? await store.character(characterToken)
          : null;
        if (characterToken && !character)
          throw Error('Character credential unavailable.');
        // Loading may yield; another request must not attach the same socket twice.
        if (connection.room || ws.readyState !== WebSocket.OPEN)
          throw Error('Connection unavailable.');
        const result =
          message.type === 'create'
            ? manager.create(
                message.hero,
                character ?? undefined,
                characterToken,
              )
            : message.type === 'join'
              ? manager.join(
                  message.code,
                  message.hero,
                  character ?? undefined,
                  characterToken,
                )
              : manager.resume(message.code, message.token);
        connection.room = result.room;
        connection.session = result.session;
        await store.save(result.room);
        send(ws, {
          type: 'welcome',
          code: result.room.code,
          token: result.session.token,
          playerId: result.session.playerId,
        });
        send(ws, { type: 'state', world: result.room.world });
      }
    } catch (error) {
      send(ws, {
        type: 'error',
        message: error instanceof Error ? error.message : 'Request failed.',
      });
    }
  });
  ws.on('close', () => {
    if (connection.room && connection.session) {
      manager.disconnect(connection.room, connection.session);
      if (!shuttingDown)
        void store
          .save(connection.room)
          .catch(() => console.error('Disconnect save failed.'));
    }
    connections.delete(ws);
  });
});
const heartbeat = setInterval(() => {
  for (const [ws, c] of connections) {
    if (!c.alive) {
      ws.terminate();
      continue;
    }
    c.alive = false;
    ws.ping();
  }
}, 10000);
let ticks = 0;
const timer = setInterval(() => {
  for (const c of connections.values())
    if (c.room && c.session && Date.now() - c.lastInput > 250)
      c.room.inputs.set(c.session.playerId, neutralInput());
  const before = new Map(
    [...manager.rooms.values()].map((r) => [
      r.code,
      `${r.world.kills}:${r.world.loot.length}:${r.world.quest}`,
    ]),
  );
  manager.update(1 / 30);
  for (const r of manager.rooms.values())
    if (
      before.get(r.code) !==
      `${r.world.kills}:${r.world.loot.length}:${r.world.quest}`
    )
      void store.save(r).catch(() => console.error('Reward save failed.'));

  if (++ticks % 2 === 0)
    for (const [ws, c] of connections)
      if (c.room) send(ws, { type: 'state', world: c.room.world });
}, 1000 / 30);
const autosave = setInterval(() => {
  for (const room of manager.rooms.values())
    void store
      .save(room)
      .catch((error) => console.error('Save failed:', error));
}, 15000);
http.listen(
  Number(process.env.PORT ?? 3001),
  process.env.HOST ?? '0.0.0.0',
  () => console.log('Panda & Ape server listening on :3001'),
);
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(timer);
  clearInterval(heartbeat);
  clearInterval(autosave);
  await Promise.all([...manager.rooms.values()].map((r) => store.save(r)));
  for (const ws of connections.keys()) ws.close(1001, 'Server restarting');
  wss.close();
  http.close();
  await store.close();
}
process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
