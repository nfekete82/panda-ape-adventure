import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { parseMessage, neutralInput, type ServerMessage } from '@panda/shared';
import { RoomManager, type Room, type Session } from './rooms.js';
import { JsonSaveStore } from './persistence.js';
const manager = new RoomManager();
const store = new JsonSaveStore(process.env.SAVE_DIR ?? './data');
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
      } else if (message.type === 'save') {
        if (!connection.room) throw Error('Join a room first.');
        if (now - connection.lastSave < 3000)
          throw Error('Please wait before saving again.');
        connection.lastSave = now;
        await store.save(connection.room);
        send(ws, { type: 'saved' });
      } else {
        if (connection.room) throw Error('Already in a room.');
        const result =
          message.type === 'create'
            ? manager.create(message.hero)
            : message.type === 'join'
              ? manager.join(message.code, message.hero)
              : manager.resume(message.code, message.token);
        connection.room = result.room;
        connection.session = result.session;
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
    if (connection.room && connection.session)
      manager.disconnect(connection.room, connection.session);
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
  manager.update(1 / 30);
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
  clearInterval(timer);
  clearInterval(heartbeat);
  clearInterval(autosave);
  await Promise.all([...manager.rooms.values()].map((r) => store.save(r)));
  for (const ws of connections.keys()) ws.close(1001, 'Server restarting');
  wss.close();
  http.close();
}
process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
