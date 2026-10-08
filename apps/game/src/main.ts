import Phaser from 'phaser';
import {
  ATTRIBUTES,
  combatStats,
  quantity,
  WEAPONS,
  upgradeCost,
  xpRequired,
  applyRpgAction,
  migrateWorld,
  isPlayer,
  type RpgAction,
  createWorld,
  createPlayer,
  neutralInput,
  companionInput,
  step,
  move,
  distance,
  obstacles,
  WORLD,
  type Hero,
  type Player,
  type World,
  type Input,
  type ServerMessage,
  type ClientMessage,
} from '@panda/shared';
import { makeAssets, heroArt, heroFrame, preloadHeroSheets } from './art';
import {
  makeWeaponTextures,
  weaponAnimation,
  type WeaponPose,
  type WeaponTiming,
} from './weapons';
import { VENDOR_SPRITES, preloadVendorArt } from './vendor-art';
import { WorldSoundTracker } from './sound-events';
import { playSoundCue } from './sound-effects';
import { StatusPresentation, statusPercent } from './hud';
import { CombatFeedback } from './combat-feedback';
import { WeaponTrails } from './weapon-trails';
import { MageEffects, drawMageProjectile, isMageBloom } from './mage-effects';
import { WorldAtmosphere, treePresentation } from './world-atmosphere';
import './style.css';
const statusPresentation = new StatusPresentation();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
let selected: Hero = 'panda',
  mode: 'menu' | 'solo' | 'online' = 'menu',
  world: World = createWorld(),
  playerId = 'local',
  paused = false,
  scene: ForestScene;
let socket: WebSocket | undefined,
  roomCode = '',
  token = '',
  seq = 0,
  reconnectStart = 0,
  quitting = false,
  connecting = false;
let pending: { input: Input; dt: number }[] = [],
  predicted = { ...WORLD.spawn },
  lastSnapshot = 0,
  lastSend = 0;

let music = false,
  soundEffects = true,
  volume = 0.25,
  cameraZoom = 1.5,
  audio: AudioContext | undefined,
  audioTimer: ReturnType<typeof setInterval> | undefined;
const keys = new Set<string>(),
  pulses = new Set<string>();
const queuedActions = {
  attack: false,
  special: false,
  heal: false,
  interact: false,
};
let lastFacing = { x: 1, y: 0 };
let noticeUntil = 0,
  lastMessage = '';
const soundTracker = new WorldSoundTracker();
world.players.push(
  createPlayer('local', 'panda'),
  createPlayer('companion', 'ape'),
);
function portrait(id: string, hero: Hero) {
  const ctx = $(id) as HTMLCanvasElement;
  const draw = ctx.getContext('2d')!;
  draw.clearRect(0, 0, ctx.width, ctx.height);
  draw.imageSmoothingEnabled = false;
  if (id === 'hud-portrait') {
    const source = document.createElement('canvas');
    source.width = source.height = 64;
    const sourceContext = source.getContext('2d')!;
    heroArt(sourceContext, hero, 0, 2);
    draw.drawImage(source, 12, 6, 40, 44, 0, 0, ctx.width, ctx.height);
  } else {
    draw.save();
    draw.scale(ctx.width / 64, ctx.height / 64);
    heroArt(draw, hero, 0, 2);
    draw.restore();
  }
}
portrait('panda-portrait', 'panda');
portrait('ape-portrait', 'ape');
portrait('hud-portrait', 'panda');
function notify(text: string, duration = 5000) {
  $('notice').textContent = text;
  noticeUntil = performance.now() + duration;
}
function safeStorage(key: string, value?: string): string | null {
  try {
    if (value !== undefined) localStorage.setItem(key, value);
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSession(key: string, value?: string): string | null {
  try {
    if (value !== undefined) sessionStorage.setItem(key, value);
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function applyCameraZoom() {
  // Cover the entire viewport even on ultrawide screens without exposing map edges.
  if (!scene) return;
  scene.cameras.main.setZoom(
    Math.max(
      cameraZoom,
      scene.scale.width / WORLD.width,
      scene.scale.height / WORLD.height,
    ),
  );
}
function persistSettings() {
  safeStorage(
    'panda-settings',
    JSON.stringify({ music, soundEffects, volume, cameraZoom }),
  );
}
const settings = safeStorage('panda-settings');
if (settings) {
  try {
    const saved = JSON.parse(settings) as {
      music: boolean;
      soundEffects?: boolean;
      volume: number;
      cameraZoom?: number;
    };
    music = saved.music === true;
    soundEffects = saved.soundEffects !== false;
    volume =
      typeof saved.volume === 'number'
        ? Math.max(0, Math.min(1, saved.volume))
        : 0.25;
    if (
      typeof saved.cameraZoom === 'number' &&
      Number.isFinite(saved.cameraZoom)
    )
      cameraZoom = Math.max(1.1, Math.min(1.9, saved.cameraZoom));
  } catch {
    /* Use defaults. */
  }
}
function tone(
  freq: number,
  duration = 0.12,
  type: OscillatorType = 'sine',
  gain = 0.12,
) {
  if (!audio || !music) return;
  const osc = audio.createOscillator(),
    amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain * volume, audio.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}
function startAudio() {
  audio ??= new AudioContext();
  void audio.resume();
  if (audioTimer) return;
  let n = 0;
  const notes = [196, 246.94, 293.66, 369.99, 293.66, 246.94, 220, 293.66];
  audioTimer = setInterval(() => {
    tone(notes[n++ % notes.length]!, 1.4, 'sine', 0.07);
  }, 850);
}
function enterGame() {
  document.body.classList.remove('menu-open');
  $('menu').hidden = true;
  $('hud').hidden = false;
  $('footer').hidden = true;
  portrait('hud-portrait', selected);
  $('hero-name').textContent = selected === 'panda' ? 'Panda' : 'Ape';
  $('attack-name').textContent = selected === 'panda' ? 'Sword' : 'Arcane bolt';
  $('special-name').textContent = selected === 'panda' ? 'Earthbreak' : 'Bloom';
  keys.clear();
  pulses.clear();
  paused = false;
  soundTracker.reset();
  startAudio();
  applyCameraZoom();
  notify('Welcome to Emerald Forest. Talk to Rowan at the camp.');
}
function startSolo(saved = false) {
  quitting = true;
  socket?.close();
  socket = undefined;
  roomCode = '';
  token = '';
  mode = 'solo';
  playerId = 'local';
  world = createWorld();
  world.players.push(createPlayer('local', selected));
  if (saved) {
    try {
      const raw = safeStorage('panda-save');
      if (raw && !safeStorage('panda-save-v1-backup'))
        safeStorage('panda-save-v1-backup', raw);
      const data = migrateWorld(JSON.parse(raw ?? 'null'));
      if (data && data.players.some((p) => p.id === 'local')) {
        world = data;
        selected = world.players.find((p) => p.id === 'local')!.hero;
      } else
        notify(
          'Saved adventure is invalid; the original save has been retained.',
        );
    } catch {
      /* Start a new adventure if corrupt. */
    }
  }
  if (!saved) {
    try {
      const character: unknown = JSON.parse(
        safeStorage(`panda-solo-${selected}`) ?? 'null',
      );
      if (isPlayer(character)) {
        const p = world.players[0]!;
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
        Object.assign(p, {
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
    } catch {
      /* Retain corrupt character data for recovery. */
    }
    world.instanceId = crypto.randomUUID();
  }
  rpgSeq = world.players.find((p) => p.id === playerId)?.commandSeq ?? 0;
  predicted = { ...world.players.find((p) => p.id === 'local')! };
  $('connection-status').textContent = 'SOLO ADVENTURE';
  $('room-label').textContent = '';
  $('invite').hidden = true;
  enterGame();
}
function send(message: ClientMessage) {
  if (socket?.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify(message));
}
function connect(message: ClientMessage, isReconnect = false) {
  if (connecting) return;
  connecting = true;
  quitting = false;
  $('menu-error').textContent = '';
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  socket = new WebSocket(`${scheme}://${location.host}/ws`);
  if (message.type === 'create' || message.type === 'join') {
    const characterToken = safeStorage(`panda-character-${selected}`);
    if (characterToken) message = { ...message, characterToken };
  }
  const current = socket;
  let welcomed = false;
  const timeout = setTimeout(() => {
    if (!welcomed) current.close();
  }, 7000);
  current.onopen = () => current.send(JSON.stringify(message));
  current.onmessage = (event: MessageEvent<string>) => {
    const m = JSON.parse(event.data) as ServerMessage;
    if (m.type === 'welcome') {
      welcomed = true;
      connecting = false;
      clearTimeout(timeout);
      mode = 'online';
      roomCode = m.code;
      token = m.token;
      playerId = m.playerId;
      safeStorage(`panda-character-${selected}`, token);
      seq = 0;
      pending = [];
      reconnectStart = 0;
      safeSession(
        'panda-session',
        JSON.stringify({ code: roomCode, token, hero: selected }),
      );
      $('connection-status').textContent = 'CO-OP · CONNECTED';
      $('room-label').textContent = roomCode;
      $('invite').hidden = false;
      enterGame();
    } else if (m.type === 'state') {
      world = m.world;
      const p = world.players.find((p) => p.id === playerId);
      if (p) {
        selected = p.hero;
        predicted = { x: p.x, y: p.y };
        pending = pending.filter((i) => i.input.seq > p.lastSeq);
        for (const sent of pending) {
          const d = Math.hypot(sent.input.x, sent.input.y);
          const speed =
            combatStats(p).speed *
            (sent.input.guard && p.hero === 'panda' ? 0.45 : 1);
          if (d > 0)
            move(
              predicted,
              (sent.input.x / Math.max(1, d)) * speed * sent.dt,
              (sent.input.y / Math.max(1, d)) * speed * sent.dt,
            );
        }
        lastSnapshot = performance.now();
      }
    } else if (m.type === 'error') {
      if (mode === 'menu') $('menu-error').textContent = m.message;
      else {
        notify(m.message);
        const status = document.getElementById('rpg-status');
        if (status) status.textContent = m.message;
      }
      if (!welcomed) {
        quitting = !(
          isReconnect && m.message === 'This session is already connected.'
        );
        connecting = false;
        current.close();
      }
    } else if (m.type === 'saved')
      notify('Co-op progress saved on the server.');
  };
  current.onerror = () => {
    if (mode === 'menu')
      $('menu-error').textContent =
        'Server unavailable. Start npm run dev or Docker Compose. Solo still works offline.';
  };
  current.onclose = () => {
    clearTimeout(timeout);
    connecting = false;
    if (quitting || current !== socket) return;
    if (!welcomed && !isReconnect) {
      $('menu-error').textContent ||=
        'Connection failed. Check that the local server is running.';
      return;
    }
    if (mode === 'online') {
      reconnectStart ||= Date.now();
      $('connection-status').textContent = 'CO-OP · RECONNECTING';
      notify('Connection lost. Restoring your session…');
      if (Date.now() - reconnectStart < 55000)
        setTimeout(() => {
          if (mode === 'online' && !quitting && socket === current)
            connect({ type: 'resume', code: roomCode, token }, true);
        }, 1200);
      else {
        notify(
          'Reconnect expired. Return to the title screen and create a new room.',
          60000,
        );
        $('connection-status').textContent = 'CO-OP · DISCONNECTED';
      }
    }
  };
}
function exitGame() {
  quitting = true;
  socket?.close();
  mode = 'menu';
  paused = false;
  $('hud').hidden = true;
  $('menu').hidden = false;
  $('footer').hidden = false;
  document.body.classList.add('menu-open');
  $('modal').hidden = false;
  scene.cameras.main.setZoom(0.85);
  world = createWorld();
  world.players.push(
    createPlayer('local', 'panda'),
    createPlayer('companion', 'ape'),
  );
  playerId = 'local';
  keys.clear();
}
for (const button of document.querySelectorAll<HTMLButtonElement>(
  '[data-hero]',
))
  button.onclick = () => {
    selected = button.dataset.hero as Hero;
    document
      .querySelectorAll('[data-hero]')
      .forEach((el) =>
        el.classList.toggle(
          'selected',
          (el as HTMLElement).dataset.hero === selected,
        ),
      );
  };
$('solo').onclick = () => startSolo();
const storedSession = safeSession('panda-session');
// 0.1 stored only a reconnect credential. Keep it usable for a migrated permanent character.
try {
  const old: unknown = JSON.parse(storedSession ?? 'null');
  if (
    old &&
    typeof old === 'object' &&
    'hero' in old &&
    (old.hero === 'panda' || old.hero === 'ape') &&
    'token' in old &&
    typeof old.token === 'string' &&
    /^[\da-f-]{36}$/.test(old.token) &&
    !safeStorage(`panda-character-${old.hero}`)
  )
    safeStorage(`panda-character-${old.hero}`, old.token);
} catch {
  /* A corrupt old session must not replace a character credential. */
}

$('restore-session').hidden = !storedSession;
$('restore-session').onclick = () => {
  try {
    const s = JSON.parse(storedSession ?? 'null') as {
      code: string;
      token: string;
      hero: Hero;
    };
    selected = s.hero;
    connect({ type: 'resume', code: s.code, token: s.token });
  } catch {
    $('menu-error').textContent = 'No valid reconnect session.';
  }
};
$('continue').onclick = () => startSolo(true);
$('continue').hidden = !safeStorage('panda-save');
$('create').onclick = () => connect({ type: 'create', hero: selected });
$('join').onclick = () => {
  const code = $<HTMLInputElement>('room-code').value.trim().toUpperCase();
  if (!/^[A-Z2-9]{5}$/.test(code)) {
    $('menu-error').textContent = 'Enter a five-character room code.';
    return;
  }
  connect({ type: 'join', code, hero: selected });
};
const invited = new URLSearchParams(location.search).get('room');
if (invited) {
  $<HTMLInputElement>('room-code').value = invited.toUpperCase();
  selected = 'ape';
  document
    .querySelectorAll('[data-hero]')
    .forEach((el) =>
      el.classList.toggle(
        'selected',
        (el as HTMLElement).dataset.hero === 'ape',
      ),
    );
}
$('invite').onclick = () => {
  const link = `${location.origin}/?room=${roomCode}`;
  void navigator.clipboard
    .writeText(link)
    .then(() =>
      notify('Invite link copied. Your friend can choose the available hero.'),
    )
    .catch(() => notify(`Invite: ${link}`, 15000));
};
function save() {
  if (mode === 'solo') {
    saveSolo();
    $('continue').hidden = false;
    notify('Solo adventure saved on this browser.');
  } else if (mode === 'online') send({ type: 'save' });
}
function showModal(content: string) {
  paused = true;
  keys.clear();
  pulses.clear();
  $('modal-content').innerHTML = content;
  $<HTMLDialogElement>('modal').showModal();
}
function closeModal() {
  paused = false;
  $<HTMLDialogElement>('modal').close();
}
$('close-modal').onclick = closeModal;
$('modal').addEventListener('cancel', () => {
  paused = false;
});
function settingsModal() {
  showModal(
    `<div class="eyebrow">TAKE A BREATH</div><h2>${mode === 'menu' ? 'Settings' : 'Adventure paused'}</h2><p>${mode === 'online' ? 'Your hero stops moving. Your co-op world continues while this menu is open.' : 'The forest will wait for you.'}</p><label>Forest music<input id="music" type="checkbox" ${music ? 'checked' : ''}></label><label>Combat & item sounds<input id="sound-effects" type="checkbox" ${soundEffects ? 'checked' : ''}></label><label>Master volume<input id="volume" type="range" min="0" max="1" step="0.05" value="${volume}"></label><label>Camera zoom <output id="zoom-value">${Math.round(cameraZoom * 100)}%</output><input id="camera-zoom" aria-label="Camera zoom" type="range" min="1.1" max="1.9" step="0.05" value="${cameraZoom}"></label>${mode === 'solo' ? '<label>AI companion<input id="companion-toggle" type="checkbox" ' + (world.players.some((p) => p.id === 'companion') ? 'checked' : '') + '></label>' : ''}<button id="resume-button">${mode === 'menu' ? 'Back' : 'Resume adventure'} →</button>${mode !== 'menu' ? '<button id="save-button">Save progress</button><button id="exit-button">Return to title</button>' : ''}<p>WASD / arrows: move · Space / left click: attack<br>Q: special · R: potion / revive · E: talk<br>Shift: shield (Panda) · I: inventory · Esc: pause<br>Gamepad: left stick, A attack, X special, B potion, Y talk.</p>`,
  );
  $<HTMLInputElement>('music').onchange = (e) => {
    music = (e.target as HTMLInputElement).checked;
    startAudio();
    persistSettings();
  };
  $<HTMLInputElement>('sound-effects').onchange = (e) => {
    soundEffects = (e.target as HTMLInputElement).checked;
    if (soundEffects) startAudio();
    persistSettings();
  };
  $<HTMLInputElement>('volume').oninput = (e) => {
    volume = Number((e.target as HTMLInputElement).value);
    persistSettings();
  };
  $<HTMLInputElement>('camera-zoom').oninput = (e) => {
    cameraZoom = Number((e.target as HTMLInputElement).value);
    $('zoom-value').textContent = `${Math.round(cameraZoom * 100)}%`;
    if (mode !== 'menu') applyCameraZoom();
    persistSettings();
  };
  $('resume-button').onclick = closeModal;
  if (mode !== 'menu') {
    $('save-button').onclick = save;
    $('exit-button').onclick = () => {
      save();
      closeModal();
      exitGame();
    };
  }
  if (mode === 'solo')
    $<HTMLInputElement>('companion-toggle').onchange = (e) => {
      if ((e.target as HTMLInputElement).checked) {
        if (!world.players.some((p) => p.id === 'companion'))
          world.players.push(
            createPlayer('companion', selected === 'panda' ? 'ape' : 'panda'),
          );
      } else world.players = world.players.filter((p) => p.id !== 'companion');
    };
}
$('settings').onclick = settingsModal;
let rpgSeq = 0;
let satchelSignature = '';
function saveSolo() {
  const p = world.players.find((p) => p.id === playerId);
  if (p) safeStorage(`panda-solo-${p.hero}`, JSON.stringify(p));
  safeStorage('panda-save', JSON.stringify({ version: 2, world }));
}
function rpg(action: RpgAction) {
  const p = world.players.find((p) => p.id === playerId);
  if (!p) return;
  rpgSeq = Math.max(rpgSeq, p.commandSeq) + 1;
  if (mode === 'online') send({ type: 'rpg', seq: rpgSeq, action });
  else {
    const error = applyRpgAction(world, p, action, rpgSeq);
    if (error) {
      notify(error);
      $('rpg-status').textContent = error;
    } else {
      saveSolo();
      renderSatchel();
    }
  }
}
function renderSatchel() {
  const p = world.players.find((p) => p.id === playerId);
  if (!p) return;
  const stats = combatStats(p),
    cost = upgradeCost(p.weapon.upgrade + 1);
  satchelSignature = JSON.stringify([
    p.level,
    p.xp,
    p.points,
    p.attributes,
    p.weapon,
    p.inventory,
    p.potions,
    world.bossDefeated,
  ]);
  $('modal-content').innerHTML =
    `<h2>Your satchel</h2><p>Level ${p.level} · ${p.xp} / ${xpRequired(p.level)} XP · <strong>${p.points} attribute points</strong></p>
    <p>HP ${stats.maxHp} · Mana ${stats.maxMana} · Damage ${stats.damage} · Special ${stats.special} · Armor ${stats.armor.toFixed(1)}</p>
    ${ATTRIBUTES.map((a) => `<div class="inventory-row"><div>${a.charAt(0).toUpperCase() + a.slice(1)}<small>${a === 'vitality' ? '+12 HP, armor' : a === 'strength' ? 'Sword damage, special damage, armor' : a === 'dexterity' ? 'Damage, movement and attack speed' : 'Staff damage, special damage and mana'}</small></div><strong>${p.attributes[a]}</strong><button data-attribute="${a}" ${p.points < 1 ? 'disabled' : ''}>+ ${a}</button></div>`).join('')}
    <div class="inventory-row"><div>Healing potions</div><strong>${p.potions}</strong></div>
    ${(['coin', 'leather', 'crystal', 'ancient'] as const).map((kind) => `<div class="inventory-row"><div>${kind}</div><strong>${quantity(p, kind)}</strong></div>`).join('')}
    <p id="rpg-status" role="status"></p><h3>Bramble's forge</h3><p>${WEAPONS[p.weapon.kind].name} +${p.weapon.upgrade} · Base damage ${WEAPONS[p.weapon.kind].damage} · +${WEAPONS[p.weapon.kind].perUpgrade} damage per upgrade</p>
    <p>${p.weapon.upgrade < 10 ? `Next upgrade: ${cost.coin} coins, ${cost.leather} leather, ${cost.crystal} crystals, ${cost.ancient} ancient materials` : 'Maximum upgrade reached.'}</p>
    <button id="upgrade-weapon" ${p.weapon.upgrade >= 10 || distance(p, WORLD.smith) > 90 ? 'disabled' : ''}>Upgrade weapon</button>
    <p>Visit Bramble at the western camp (E) to upgrade. Collect enemy drops by walking over them.</p>
    ${world.bossDefeated ? '<button id="reset-encounter">Reset guardian encounter at Rowan</button><p>Bring everyone to camp and collect rare guardian loot first.</p>' : ''}`;
  for (const a of ATTRIBUTES) {
    const button = document.querySelector<HTMLButtonElement>(
      `[data-attribute="${a}"]`,
    );
    if (button) button.onclick = () => rpg({ kind: 'attribute', attribute: a });
  }
  $('upgrade-weapon').onclick = () => rpg({ kind: 'upgrade' });
  if (world.bossDefeated)
    $('reset-encounter').onclick = () => rpg({ kind: 'resetEncounter' });
}
function inventory() {
  if (mode === 'menu') return;
  showModal('');
  renderSatchel();
}
$('inventory-button').onclick = inventory;
$('attack-button').onclick = () => pulses.add('Space');
$('special-button').onclick = () => pulses.add('KeyQ');
$('heal-button').onclick = () => pulses.add('KeyR');
window.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
  if (
    ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
      e.code,
    )
  )
    e.preventDefault();
  if (e.code === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    if ($<HTMLDialogElement>('modal').open) closeModal();
    else settingsModal();
    return;
  }
  if (e.code === 'KeyE' && !e.repeat) {
    const p = world.players.find((p) => p.id === playerId);
    if (p && distance(p, WORLD.smith) < 90) {
      inventory();
      return;
    }
  }
  if (e.code === 'KeyI' && !e.repeat) {
    inventory();
    return;
  }
  keys.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => {
  keys.clear();
  pulses.clear();
});
let mouseDown = false;
window.addEventListener('mouseup', () => {
  mouseDown = false;
});
window.addEventListener('blur', () => {
  mouseDown = false;
});
function readInput(): Input {
  const i = neutralInput();
  if (
    paused ||
    mode === 'menu' ||
    (mode === 'online' && socket?.readyState !== WebSocket.OPEN)
  )
    return i;
  i.x =
    Number(keys.has('KeyD') || keys.has('ArrowRight')) -
    Number(keys.has('KeyA') || keys.has('ArrowLeft'));
  i.y =
    Number(keys.has('KeyS') || keys.has('ArrowDown')) -
    Number(keys.has('KeyW') || keys.has('ArrowUp'));
  if (i.x || i.y)
    lastFacing = {
      x: i.x / Math.max(1, Math.hypot(i.x, i.y)),
      y: i.y / Math.max(1, Math.hypot(i.x, i.y)),
    };
  const pad = navigator.getGamepads?.()[0];
  if (pad) {
    const x = pad.axes[0] ?? 0,
      y = pad.axes[1] ?? 0;
    if (Math.hypot(x, y) > 0.2) {
      i.x = x;
      i.y = y;
      lastFacing = { x: x / Math.hypot(x, y), y: y / Math.hypot(x, y) };
    }
    i.attack = pad.buttons[0]?.pressed ?? false;
    i.special = pad.buttons[2]?.pressed ?? false;
    i.heal = pad.buttons[1]?.pressed ?? false;
    i.interact = pad.buttons[3]?.pressed ?? false;
    i.guard = pad.buttons[4]?.pressed ?? false;
  }
  i.aimX = lastFacing.x;
  i.aimY = lastFacing.y;
  i.attack ||= keys.has('Space') || pulses.has('Space') || mouseDown;
  i.special ||= keys.has('KeyQ') || pulses.has('KeyQ');
  i.heal ||= keys.has('KeyR') || pulses.has('KeyR');
  i.guard ||= keys.has('ShiftLeft') || keys.has('ShiftRight');
  i.interact ||= keys.has('KeyE');
  pulses.clear();
  return i;
}
class ForestScene extends Phaser.Scene {
  vegetation: Phaser.GameObjects.Sprite[] = [];
  sprites = new Map<string, Phaser.GameObjects.Sprite>();
  weapons = new Map<string, Phaser.GameObjects.Image>();
  weaponTiming = new Map<string, WeaponTiming>();
  feedback = new CombatFeedback();
  trails = new WeaponTrails();
  mageEffects = new MageEffects();
  labels = new Map<string, Phaser.GameObjects.Text>();
  shadows = new Map<string, Phaser.GameObjects.Ellipse>();
  graphics!: Phaser.GameObjects.Graphics;
  atmosphere!: WorldAtmosphere;
  cameraTarget = { x: WORLD.spawn.x, y: WORLD.spawn.y };
  accumulator = 0;
  hudTime = 0;
  constructor() {
    super('forest');
  }
  preload() {
    preloadHeroSheets(this);
    preloadVendorArt(this);
  }
  create() {
    scene = this; // eslint-disable-line @typescript-eslint/no-this-alias
    makeAssets(this);
    makeWeaponTextures(this);
    this.add.image(0, 0, 'forest').setOrigin(0);
    for (const o of obstacles) {
      if (o.kind !== 'tree') continue;
      const footX = o.x + o.w / 2;
      const footY = o.y + o.h;
      const variety = treePresentation(o.x, o.y);
      this.add
        .ellipse(footX, o.y + 12, 85 * variety.scale, 26, 0x20352f, 0.28)
        .setDepth(o.y - 2);
      const tree = this.add
        .sprite(footX, footY, variety.texture, 0)
        .setOrigin(0.5, 0.94)
        .setScale(variety.scale)
        .setFlipX(variety.flip)
        .setTint(variety.tint)
        .setDepth(footY);
      this.vegetation.push(tree);
    }
    this.add
      .sprite(WORLD.smith.x, WORLD.smith.y, 'bramble')
      .setDepth(WORLD.smith.y);
    this.add
      // Identify the smith without stretching a floating label across the roof/NPCs.
      .text(WORLD.smith.x, WORLD.smith.y - 48, 'BRAMBLE', {
        fontFamily: 'Georgia',
        fontSize: '15px',
        color: '#f3d9a0',
        stroke: '#172b24',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(WORLD.smith.y + 1);
    this.add.sprite(WORLD.npc.x, WORLD.npc.y, 'npc').setDepth(WORLD.npc.y);
    // Quiet ground markers establish where to interact without covering the art.
    for (const [x, y, color] of [
      [WORLD.npc.x, WORLD.npc.y, 0xdcc88e],
      [WORLD.smith.x, WORLD.smith.y, 0xe5aa6f],
    ] as const) {
      this.add
        .ellipse(x, y + 15, 56, 19, color, 0.12)
        .setStrokeStyle(2, color, 0.42)
        .setDepth(y - 1);
    }
    this.add
      .text(WORLD.npc.x, WORLD.npc.y - 48, 'ROWAN', {
        fontFamily: 'Georgia',
        fontSize: '15px',
        color: '#e8d4a0',
        stroke: '#253f2c',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(2000);
    this.add
      .text(1830, 210, 'ANCIENT GATE', {
        fontFamily: 'Georgia',
        fontSize: '12px',
        color: '#ded0a5',
        stroke: '#253f2c',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.graphics = this.add.graphics().setDepth(3000);
    this.atmosphere = new WorldAtmosphere(this);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.startFollow(this.cameraTarget, true, 0.08, 0.08);
    this.cameras.main.setZoom(0.85);
    this.scale.on('resize', () => {
      if (mode !== 'menu') applyCameraZoom();
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (mode !== 'menu' && !paused) {
        mouseDown = true;
        const p = world.players.find((p) => p.id === playerId);
        if (p) {
          const dx = pointer.worldX - p.x,
            dy = pointer.worldY - p.y,
            d = Math.hypot(dx, dy) || 1;
          lastFacing = { x: dx / d, y: dy / d };
        }
      }
    });
    document.body.classList.add('menu-open');
  }
  entity(
    id: string,
    x: number,
    y: number,
    texture: string,
    frame: number,
    dt: number,
  ) {
    let sprite = this.sprites.get(id);
    if (!sprite) {
      sprite = this.add.sprite(x, y, texture, frame);
      this.sprites.set(id, sprite);
      this.shadows.set(id, this.add.ellipse(x, y + 24, 35, 12, 0x10281f, 0.36));
    }
    sprite.setTexture(texture, frame);
    const lerp = id === playerId ? 0.6 : Math.min(1, dt * 14);
    sprite.x += (x - sprite.x) * lerp;
    sprite.y += (y - sprite.y) * lerp;
    sprite.setDepth(sprite.y + 25);
    this.shadows
      .get(id)!
      .setPosition(sprite.x, sprite.y + 24)
      .setDepth(sprite.y - 1);
    return sprite;
  }
  renderWeapon(
    p: Player,
    sprite: Phaser.GameObjects.Sprite,
    time: number,
    pose: WeaponPose,
  ): void {
    let weapon = this.weapons.get(p.id);
    if (!weapon) {
      weapon = this.add.image(
        sprite.x,
        sprite.y,
        p.hero === 'panda' ? 'panda-sword' : 'ape-staff',
      );
      weapon.setOrigin(0.5, 0.87);
      weapon.setName(`weapon-${p.id}`);
      this.weapons.set(p.id, weapon);
    }
    if (p.id === playerId) {
      $('hud').dataset.weaponTrail = String(pose.trail);
      $('hud').dataset.weaponProgress = String(pose.progress);
      $('hud').dataset.castPulse = String(
        this.mageEffects.pulse(p.id, time).strength,
      );
      $('hud').dataset.staffAngle = String(
        pose.rotation - pose.facingAngle - Math.PI / 2,
      );
    }
    if (p.hp <= 0) {
      weapon.setVisible(false);
      this.weaponTiming.delete(p.id);
      return;
    }
    const texture = p.hero === 'panda' ? 'panda-sword' : 'ape-staff';
    if (weapon.texture.key !== texture) weapon.setTexture(texture);
    weapon
      .setVisible(true)
      .setPosition(
        sprite.x + pose.bodyDx + pose.dx,
        sprite.y + pose.bodyDy + pose.dy,
      )
      .setRotation(pose.rotation)
      .setScale(p.hero === 'panda' ? 0.96 : 0.9)
      .setDepth(sprite.depth + (pose.behindHero ? -1 : 1))
      .setAlpha(p.connected ? 1 : 0.35);

    if (p.hero === 'panda') {
      this.trails.draw(
        p.id,
        this.graphics,
        weapon.x,
        weapon.y,
        pose,
        time,
        reducedMotion.matches,
      );
    } else {
      this.mageEffects.draw(
        p.id,
        this.graphics,
        weapon.x,
        weapon.y,
        pose,
        time,
        reducedMotion.matches,
        p.connected ? 1 : 0.35,
      );
    }
  }
  update(time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    if (paused && mode === 'solo')
      for (const timing of this.weaponTiming.values())
        timing.startedAt += delta;
    const input = readInput();
    if (mode === 'solo' && !paused) {
      this.accumulator += dt;
      while (this.accumulator >= 1 / 60) {
        const map = new Map<string, Input>([[playerId, input]]);
        const leader = world.players.find((p) => p.id === playerId)!,
          bot = world.players.find((p) => p.id === 'companion');
        if (bot) map.set(bot.id, companionInput(world, bot, leader));
        step(world, map, 1 / 60);
        this.accumulator -= 1 / 60;
      }
    } else if (mode === 'online') {
      for (const key of ['attack', 'special', 'heal', 'interact'] as const)
        queuedActions[key] ||= input[key];
      const p = world.players.find((p) => p.id === playerId);
      if (p && socket?.readyState === WebSocket.OPEN) {
        const speed =
            combatStats(p).speed *
            (input.guard && p.hero === 'panda' ? 0.45 : 1),
          d = Math.hypot(input.x, input.y);
        if (d && p.hp > 0)
          move(
            predicted,
            (input.x / Math.max(1, d)) * speed * dt,
            (input.y / Math.max(1, d)) * speed * dt,
          );
        if (time - lastSend >= 1000 / 30) {
          for (const key of [
            'attack',
            'special',
            'heal',
            'interact',
          ] as const) {
            input[key] ||= queuedActions[key];
            queuedActions[key] = false;
          }
          input.seq = ++seq;
          send({ type: 'input', input });
          pending.push({
            input: { ...input },
            dt: Math.min((time - lastSend) / 1000, 0.05),
          });
          pending = pending.slice(-90);
          lastSend = time;
        }
      }
    }
    // Server and solo simulations emit the same authoritative one-shot events.
    // Re-observing an unchanged multiplayer snapshot cannot replay a sound.
    if (mode !== 'menu' && !(mode === 'solo' && paused)) {
      const cues = soundTracker.observe(world, playerId);
      if (soundEffects && audio)
        for (const cue of cues) playSoundCue(audio, cue, volume);
    }
    this.mageEffects.observe(world, time);
    const confirmedHits = this.feedback.observe(world, time);
    const localHero = world.players.find((p) => p.id === playerId);
    if (
      !reducedMotion.matches &&
      localHero &&
      confirmedHits.some((hit) => distance(hit, localHero) < 220)
    )
      this.cameras.main.shake(60, 0.0012);
    const visualTime = this.feedback.clock(time, reducedMotion.matches);
    for (const tree of this.vegetation) {
      // Stable canopy frame; the vendor loop noticeably stretches the crown.
      tree.setAngle(
        reducedMotion.matches
          ? 0
          : Math.sin(time * 0.00035 + tree.x * 0.01) * 0.06,
      );
    }
    this.atmosphere.draw(time, reducedMotion.matches);
    this.graphics.clear();
    const alive = new Set<string>();
    for (const p of world.players) {
      alive.add(p.id);
      const pos = mode === 'online' && p.id === playerId ? predicted : p;
      const moving =
        p.id === playerId
          ? Math.hypot(input.x, input.y) > 0.1
          : p.action === 'walk';
      const facing = p.id === playerId && moving ? lastFacing : p.facing;
      let dir =
        Math.round(
          (Math.atan2(facing.y, facing.x) + Math.PI * 2) / (Math.PI / 4),
        ) % 8;
      dir = Math.max(0, dir);
      const state =
        p.hp <= 0
          ? 'downed'
          : p.invulnerable > 0
            ? 'hit'
            : moving && p.action === 'idle'
              ? 'walk'
              : p.action;
      const frame = heroFrame(p.hero, state, dir, time);
      const sprite = this.entity(p.id, pos.x, pos.y, p.hero, frame, dt);
      sprite.setScale(1.22);
      this.shadows.get(p.id)?.setScale(1.2, 1.1);
      sprite.setAlpha(p.connected ? 1 : 0.35);
      const animation = weaponAnimation(
        p.hero,
        p.facing,
        p.hp > 0 ? p.action : 'downed',
        p.cooldown,
        combatStats(p).cooldown,
        visualTime,
        this.weaponTiming.get(p.id),
        p.combo,
      );
      if (p.hp > 0) this.weaponTiming.set(p.id, animation.timing);
      const pose = animation.pose;
      // Shift only the texture origin: interpolation, collision and camera
      // continue to use the authoritative/predicted world position.
      sprite.setOrigin(
        0.5 - pose.bodyDx / (64 * 1.22),
        0.5 - pose.bodyDy / (64 * 1.22),
      );
      sprite.setAngle(pose.bodyAngle);
      sprite.setTint(p.invulnerable > 0 ? 0xffcfb0 : 0xffffff);
      this.renderWeapon(p, sprite, time, pose);
      if (p.action === 'guard') {
        this.graphics.lineStyle(2, 0xb4dad1, 0.7);
        this.graphics.strokeCircle(sprite.x, sprite.y, 35);
      }
      let label = this.labels.get(p.id);
      if (!label) {
        label = this.add
          .text(pos.x, pos.y - 44, '', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#f0e4c2',
            stroke: '#183d2b',
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(3001);
        this.labels.set(p.id, label);
      }
      label
        // Names sit below the boots, leaving hero and nearby NPC faces clear.
        .setPosition(sprite.x, sprite.y + 45)
        .setText(
          `${p.hero === 'panda' ? 'Panda' : 'Ape'}${p.id === playerId ? ' · YOU' : p.id === 'companion' ? ' · COMPANION' : !p.connected ? ' · OFFLINE' : ' · FRIEND'}`,
        );
      if (p.hp <= 0) {
        sprite.setAlpha(0.45);
        label.setText('DOWNED · R to revive');
      }
    }
    for (const e of world.enemies) {
      if (e.hp <= 0) continue;
      alive.add(e.id);
      const sprite = this.entity(
        e.id,
        e.x,
        e.y + (e.kind === 'wisp' ? Math.sin(time * 0.004) * 7 : 0),
        e.kind,
        0,
        dt,
      );
      sprite.setScale(
        e.kind === 'guardian' ? 1.8 : e.kind === 'slime' ? 1.05 : 1.1,
      );
      sprite.setTint(e.hurt > 0 ? 0xffd8b4 : 0xffffff);
      if (e.kind === 'slime')
        sprite.scaleY = sprite.scaleX * (1 + Math.sin(time * 0.003) * 0.045);
      // A small impact compression follows only confirmed enemy hurt state.
      sprite.scaleY *= 1 - Math.sin(Math.min(1, e.hurt / 0.2) * Math.PI) * 0.07;
      const width = e.kind === 'guardian' ? 94 : 46;
      this.graphics.fillStyle(0x183029, 0.8);
      this.graphics.fillRect(
        sprite.x - width / 2,
        sprite.y - (e.kind === 'guardian' ? 78 : 48),
        width,
        4,
      );
      this.graphics.fillStyle(e.kind === 'guardian' ? 0xc5a571 : 0xb49b75);
      this.graphics.fillRect(
        sprite.x - width / 2,
        sprite.y - (e.kind === 'guardian' ? 78 : 48),
        (width * e.hp) / e.maxHp,
        4,
      );
      if (e.kind === 'guardian') {
        this.graphics.lineStyle(1, 0xddcc8a, 0.2);
        this.graphics.strokeCircle(e.x, e.y, 170);
      }
    }
    for (const [id, sprite] of this.sprites)
      if (!alive.has(id)) {
        sprite.destroy();
        this.sprites.delete(id);
        this.weapons.get(id)?.destroy();
        this.weapons.delete(id);
        this.weaponTiming.delete(id);
        this.trails.remove(id);
        this.shadows.get(id)?.destroy();
        this.shadows.delete(id);
        this.labels.get(id)?.destroy();
        this.labels.delete(id);
      }
    for (const item of world.loot) {
      const y = item.y + Math.sin(time * 0.003 + item.x) * 3;
      this.graphics.fillStyle(0x11281f, 0.6);
      this.graphics.fillCircle(item.x, y + 4, 12);
      this.graphics.lineStyle(2, 0xf2db9b, 0.55);
      this.graphics.strokeCircle(
        item.x,
        y,
        14 + Math.sin(time * 0.004 + item.x) * 1.5,
      );
      this.graphics.fillStyle(
        item.kind === 'potion'
          ? 0xe6b19b
          : item.kind === 'coin'
            ? 0xf1cb65
            : item.kind === 'leather'
              ? 0xa87346
              : item.kind === 'ancient'
                ? 0xc59bf4
                : 0xa8d6c0,
      );
      if (item.kind === 'potion') {
        this.graphics.fillRect(item.x - 6, y - 6, 12, 15);
        this.graphics.fillStyle(0xedd8b7);
        this.graphics.fillRect(item.x - 3, y - 10, 6, 4);
      } else
        this.graphics.fillPoints(
          [
            new Phaser.Math.Vector2(item.x, y - 9),
            new Phaser.Math.Vector2(item.x + 7, y),
            new Phaser.Math.Vector2(item.x, y + 9),
            new Phaser.Math.Vector2(item.x - 7, y),
          ],
          true,
        );
    }
    for (const bolt of world.projectiles) {
      if (world.players.some((p) => p.id === bolt.owner && p.hero === 'ape'))
        drawMageProjectile(this.graphics, bolt, reducedMotion.matches);
      this.graphics.fillStyle(bolt.hostile ? 0xc492d8 : 0x90d9d4, 0.2);
      this.graphics.fillCircle(bolt.x, bolt.y, 14);
      this.graphics.fillStyle(bolt.hostile ? 0xf0d0f5 : 0xe0fff0);
      this.graphics.fillCircle(bolt.x, bolt.y, 5);
    }
    for (const f of world.effects) {
      const a = Math.max(0, f.life / 0.45);
      const color =
        f.kind === 'hit'
          ? 0xfad49e
          : f.kind === 'warning'
            ? 0xdb835f
            : f.kind === 'heal'
              ? 0xaedcb0
              : 0xb9e7d5;
      if (f.kind === 'hit') {
        const fade = Math.min(1, a);
        const radius = 5 + (1 - fade) * 10;
        this.graphics.lineStyle(2, color, fade * 0.65);
        for (let n = 0; n < 4; n++) {
          const source = world.players.find((p) => distance(p, f) < 160);
          const direction = source
            ? Math.atan2(f.y - source.y, f.x - source.x)
            : 0;
          const angle = direction + (n - 1.5) * 0.65;
          this.graphics.lineBetween(
            f.x + Math.cos(angle) * radius * 0.45,
            f.y + Math.sin(angle) * radius * 0.45,
            f.x + Math.cos(angle) * radius,
            f.y + Math.sin(angle) * radius,
          );
        }
      } else if (f.kind !== 'slash' && !isMageBloom(f)) {
        // Staff FX own Bloom; the sword owns its crescent; avoid a second
        // full circular melee effect over the character's face.
        this.graphics.lineStyle(3, color, a * 0.9);
        this.graphics.strokeCircle(f.x, f.y, f.radius * (1 - f.life * 0.7));
      }
      if (f.kind === 'magic' && !isMageBloom(f)) {
        this.graphics.lineStyle(1, color, a * 0.5);
        this.graphics.strokeCircle(f.x, f.y, f.radius * 0.8);
      }
      if (f.text) {
        let label = this.labels.get(f.id);
        if (!label) {
          label = this.add
            .text(f.x, f.y - 30, f.text, {
              fontFamily: 'Arial',
              fontSize: '14px',
              fontStyle: 'bold',
              color: '#f4ddb1',
              stroke: '#263b29',
              strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(3001);
          this.labels.set(f.id, label);
          // Hit sound is owned by the one-shot event tracker, not the label.
        }
        label.setPosition(f.x, f.y - 30 - (1 - f.life / 0.45) * 22).setAlpha(a);
      }
    }
    const effectIds = new Set(world.effects.map((f) => f.id));
    for (const [id, label] of this.labels)
      if (!alive.has(id) && !effectIds.has(id)) {
        label.destroy();
        this.labels.delete(id);
      }
    // Firelight and drifting fireflies use deterministic positions and time only.
    this.graphics.fillStyle(0xe5aa64, 0.08);
    this.graphics.fillCircle(468, 1080, 45 + Math.sin(time * 0.01) * 4);
    this.graphics.fillStyle(0xe7ad57);
    this.graphics.fillRect(459, 1072, 18, 18);
    this.graphics.fillStyle(0xfbe0a0);
    this.graphics.fillRect(464, 1067 + Math.sin(time * 0.01) * 3, 8, 17);
    for (let n = 0; n < 16; n++) {
      const x = 250 + ((n * 173) % 1500) + Math.sin(time * 0.0003 + n) * 20,
        y = 180 + ((n * 131) % 1100) + Math.cos(time * 0.0005 + n) * 14;
      this.graphics.fillStyle(0xe6e9a6, 0.1);
      this.graphics.fillCircle(x, y, 6);
      this.graphics.fillStyle(0xf3e7ac, 0.4 + Math.sin(time * 0.002 + n) * 0.3);
      this.graphics.fillRect(x, y, 2, 2);
    }
    const local = world.players.find((p) => p.id === playerId);
    if (local && mode !== 'menu') {
      // Nearby NPCs get a subtle animated ground ring, not permanent UI clutter.
      for (const [x, y, color] of [
        [WORLD.npc.x, WORLD.npc.y, 0xf0d99e],
        [WORLD.smith.x, WORLD.smith.y, 0xeeb67c],
      ] as const) {
        if (Math.hypot(local.x - x, local.y - y) > 205) continue;
        this.graphics.lineStyle(3, color, 0.75);
        this.graphics.strokeEllipse(
          x,
          y + 16,
          70 + Math.sin(time * 0.004) * 5,
          28,
        );
      }
    }
    if (local) {
      const pos = mode === 'online' ? predicted : local;
      this.cameraTarget.x = mode === 'menu' ? 740 : pos.x;
      this.cameraTarget.y = mode === 'menu' ? 850 : pos.y;
    }
    if (mode !== 'menu' && time - this.hudTime > 100) {
      this.hudTime = time;
      updateHud();
    }
  }
}
function updateHud() {
  const p = world.players.find((p) => p.id === playerId);
  if (!p) return;
  const state = statusPresentation.update(
    p.hero,
    p.hp,
    p.mana,
    performance.now(),
  );
  const panel = document.querySelector('.player-panel');
  panel?.classList.toggle('damaged', state.damaged);
  panel?.classList.toggle('spent', state.spent);
  $('hud-portrait').dataset.hero = p.hero;
  $('health-bar').style.width = `${statusPercent(p.hp, p.maxHp)}%`;
  $('health-trail').style.width = `${statusPercent(p.hp, p.maxHp)}%`;
  document
    .querySelector('.health')
    ?.setAttribute('aria-valuenow', String(Math.ceil(p.hp)));
  document
    .querySelector('.health')
    ?.setAttribute('aria-valuemax', String(p.maxHp));
  $('health-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  const maxMana = combatStats(p).maxMana;
  $('mana-bar').style.width = `${statusPercent(p.mana, maxMana)}%`;
  $('mana-text').textContent = `${Math.floor(p.mana)} / ${maxMana}`;
  document
    .querySelector('.mana')
    ?.setAttribute('aria-valuenow', String(Math.floor(p.mana)));
  document
    .querySelector('.mana')
    ?.setAttribute('aria-valuemax', String(maxMana));
  $('xp-bar').style.width = `${(p.xp / xpRequired(p.level)) * 100}%`;
  $('level').textContent = `LV ${p.level}`;
  $('potions').textContent = `Potion ×${p.potions}`;
  $('quest-title').textContent = world.bossDefeated
    ? 'A forest restored'
    : world.quest === 'available'
      ? 'A whisper in the woods'
      : world.quest === 'rewarded'
        ? 'The Thorn Guardian'
        : 'A forest in need';
  $('quest-body').textContent = world.bossDefeated
    ? 'The guardian has fallen. Explore the ancient gate to the east.'
    : world.quest === 'available'
      ? 'Talk to Rowan at the woodland camp.'
      : world.quest === 'active'
        ? `Defeat forest creatures · ${Math.min(world.kills, 5)} / 5`
        : world.quest === 'complete'
          ? 'Return to Rowan for your reward.'
          : 'Find the guardian in the northeast ruins.';
  const nearRowan = distance(p, WORLD.npc) <= 90;
  const nearSmith = distance(p, WORLD.smith) <= 90;
  $('interact-hint').hidden = !(nearRowan || nearSmith);
  $('interact-hint').textContent =
    nearSmith &&
    (!nearRowan || distance(p, WORLD.smith) < distance(p, WORLD.npc))
      ? 'E · Talk to Bramble / Improve weapon'
      : 'E · Talk to Rowan';
  if (
    $<HTMLDialogElement>('modal').open &&
    document.getElementById('upgrade-weapon') &&
    satchelSignature !==
      JSON.stringify([
        p.level,
        p.xp,
        p.points,
        p.attributes,
        p.weapon,
        p.inventory,
        p.potions,
        world.bossDefeated,
      ])
  )
    renderSatchel();
  $('partner').textContent =
    mode === 'solo'
      ? world.players.length > 1
        ? 'Companion following'
        : 'Companion available in settings'
      : world.players.length < 2
        ? 'Waiting for your friend…'
        : world.players.find((q) => q.id !== playerId)?.connected
          ? 'Your friend is here'
          : 'Friend disconnected · seat reserved';
  if (world.message !== lastMessage) {
    lastMessage = world.message;
    notify(world.message, 6500);
  }
  if (performance.now() > noticeUntil) $('notice').textContent = '';
  if (p.hp <= 0)
    notify(
      p.potions > 0
        ? 'You are downed. Press R to use a potion and return to camp.'
        : 'No potions left. Return to title to begin a new adventure.',
      1200,
    );
  // Read-only observability used by browser tests and performance inspection.
  const hud = $('hud');
  hud.dataset.cameraZoom = String(scene.cameras.main.zoom);
  hud.dataset.landscapeStyle = 'woodland-art-direction-1';
  hud.dataset.worldMotes = String(scene.atmosphere.moteCount);
  hud.dataset.worldReflections = String(scene.atmosphere.reflectionCount);
  hud.dataset.heroStyle = 'concept-64px';
  hud.dataset.sfxEnabled = String(soundEffects);
  hud.dataset.vendorArt =
    scene.textures.exists(VENDOR_SPRITES.tree1.key) &&
    scene.textures.exists(VENDOR_SPRITES.slime.key)
      ? 'ready'
      : 'fallback';
  hud.dataset.worldTrees = String(scene.vegetation.length);
  hud.dataset.worldEnemies = String(
    world.enemies.filter(
      (enemy) =>
        enemy.hp > 0 && scene.sprites.get(enemy.id)?.texture.key === enemy.kind,
    ).length,
  );
  hud.dataset.weaponTexture = scene.weapons.get(p.id)?.texture.key ?? '';
  hud.dataset.weaponVisible = String(scene.weapons.get(p.id)?.visible ?? false);
  hud.dataset.weaponActive = String(
    p.hp > 0 &&
      p.cooldown > 0 &&
      (p.action === 'attack' || p.action === 'special'),
  );
  hud.dataset.playerId = p.id;
  hud.dataset.x = String(p.x);
  hud.dataset.y = String(p.y);
  hud.dataset.players = String(world.players.length);
  hud.dataset.tick = String(world.tick);
  hud.dataset.damageNumbers = String(
    world.effects.filter(
      (effect) => effect.kind === 'hit' && effect.text && effect.life > 0.25,
    ).length,
  );
  hud.dataset.enemyHp = String(world.enemies.reduce((sum, e) => sum + e.hp, 0));
  const other = world.players.find((q) => q.id !== p.id);
  hud.dataset.remoteX = other ? String(other.x) : '';
  hud.dataset.remoteY = other ? String(other.y) : '';
  hud.dataset.remoteAction = other?.action ?? '';
  hud.dataset.renderedPlayers = String(
    world.players.filter((q) => scene.sprites.has(q.id)).length,
  );
  hud.dataset.snapshotAge = String(
    Math.round(performance.now() - lastSnapshot),
  );
}
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#314c38',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [ForestScene],
  input: { keyboard: true },
  render: { antialias: false },
});
// Design UI is 1920×1080; world pixels stay crisp on smaller displays.
setInterval(() => {
  if (mode === 'solo' && !paused) saveSolo();
}, 15000);
window.addEventListener('beforeunload', () => {
  if (mode === 'solo') saveSolo();
});
