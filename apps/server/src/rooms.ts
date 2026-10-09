import { randomUUID, randomInt } from 'node:crypto';
import {
  RESPAWN,
  createPlayer,
  createWorld,
  neutralInput,
  step,
  type Hero,
  type Input,
  type World,
  type Player,
} from '@panda/shared';
export interface Session {
  token: string;
  playerId: string;
  expires: number;
}
export interface Room {
  code: string;
  world: World;
  sessions: Session[];
  inputs: Map<string, Input>;
  emptySince: number;
}
export class RoomManager {
  rooms = new Map<string, Room>();
  constructor(private respawn = RESPAWN) {}
  create(
    hero: Hero,
    character?: Player,
    characterToken?: string,
  ): { room: Room; session: Session } {
    const home = character
      ? [...this.rooms.values()].find((r) =>
          r.world.valley.owners.includes(character.id),
        )
      : undefined;
    if (home)
      return {
        room: home,
        session: this.add(home, hero, character, characterToken),
      };
    if (this.rooms.size >= 100)
      throw Error('The server is full. Please try again later.');
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    do {
      code = Array.from(
        { length: 5 },
        () => alphabet[randomInt(alphabet.length)],
      ).join('');
    } while (this.rooms.has(code));
    const room: Room = {
      code,
      world: {
        ...createWorld(this.respawn),
        instanceId: randomUUID(),
        respawn: structuredClone(this.respawn),
      },
      sessions: [],
      inputs: new Map(),
      emptySince: 0,
    };
    const session = this.add(room, hero, character, characterToken);
    this.rooms.set(code, room);
    return { room, session };
  }
  join(
    code: string,
    hero: Hero,
    character?: Player,
    characterToken?: string,
  ): { room: Room; session: Session } {
    const room = this.rooms.get(code);
    if (!room) throw Error('Room not found.');
    return { room, session: this.add(room, hero, character, characterToken) };
  }
  private add(
    room: Room,
    hero: Hero,
    character?: Player,
    characterToken?: string,
  ): Session {
    if (
      character &&
      [...this.rooms.values()].some((r) =>
        r.world.players.some((p) => p.id === character.id),
      )
    )
      throw Error('Character is already in a room or reserved seat.');
    if (character && character.hero !== hero)
      throw Error('Character belongs to the other hero.');
    if (room.world.players.length >= 2)
      throw Error('This room is full (including reserved reconnect seats).');
    if (room.world.players.some((p) => p.hero === hero))
      throw Error('This hero is already taken. Choose the other hero.');
    const playerId = character?.id ?? randomUUID();
    const session: Session = {
      playerId,
      token: characterToken ?? randomUUID(),
      expires: Infinity,
    };
    room.sessions.push(session);
    const player = createPlayer(playerId, hero);
    if (character) {
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
      } = character;
      Object.assign(player, {
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
      });
    }
    room.world.players.push(player);
    return session;
  }
  resume(
    code: string,
    token: string,
    now = Date.now(),
  ): { room: Room; session: Session } {
    const room = this.rooms.get(code);
    const session = room?.sessions.find((s) => s.token === token);
    if (!room || !session || session.expires < now)
      throw Error('Your reconnect session expired.');
    const p = room.world.players.find((p) => p.id === session.playerId);
    if (!p) throw Error('Session unavailable.');
    if (p.connected) throw Error('This session is already connected.');
    p.connected = true;
    session.expires = Infinity;
    room.emptySince = 0;
    return { room, session };
  }
  disconnect(room: Room, session: Session, now = Date.now()): void {
    const p = room.world.players.find((p) => p.id === session.playerId);
    if (p) p.connected = false;
    session.expires = now + 60000;
    room.inputs.set(session.playerId, neutralInput());
  }
  update(dt: number, now = Date.now()): void {
    for (const [code, room] of this.rooms) {
      const expired = room.sessions
        .filter((s) => s.expires < now)
        .map((s) => s.playerId);
      room.sessions = room.sessions.filter((s) => s.expires >= now);
      room.world.players = room.world.players.filter(
        (p) => !expired.includes(p.id),
      );
      for (const pid of expired) room.inputs.delete(pid);
      if (room.world.players.some((p) => p.connected)) {
        room.emptySince = 0;
        step(room.world, room.inputs, dt);
      } else {
        room.emptySince ||= now;
        if (now - room.emptySince > 120000 && !room.world.valley.settled)
          this.rooms.delete(code);
      }
    }
  }
}
