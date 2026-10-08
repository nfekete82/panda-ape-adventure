# Architecture decisions

## Runtime boundaries

`shared` is platform independent. Movement resolves X then Y for obstacle sliding, normalizes diagonals, and clamps step duration. Terrain obstacles are generated from a fixed seed shared by server and browser. Hero stats, cooldowns, shield, mana, attacks, healing, enemy aggro, knockback, invulnerability, drops and shared XP are implemented here. Serialization sends plain data; no Phaser objects enter the protocol.

`game` renders a baked terrain canvas plus depth-sorted sprites, dynamic water, gently swaying vegetation, fireflies, firelight and combat feedback. The world is 1920×1440; UI design targets 1920×1080 with responsive viewport resizing and crisp pixel rendering. Hero sheets contain 64×64 frames, four walk frames and eight directional rows. Current sprites share simplified south/side/back poses across directions; attack uses weapon motion/effects, and hit animation uses tint/invulnerability. Future dedicated sheets can be integrated behind the existing renderer.

`server` owns room membership and all online state. `ws` is sufficient for this protocol: Colyseus would add schemas/matchmaking without reducing the small slice's simulation requirements. There is no engine-specific server compatibility requirement because Phaser only renders client data.

## Networking

- Client input ≈30 Hz; authority 30 Hz; snapshots 15 Hz.
- Input includes movement/aim components bounded to [-1,1], booleans and monotonic sequence number. No damage/position messages are accepted.
- Local movement predicts and replays unacknowledged inputs after authoritative correction. Sprite positions smooth toward predicted/remote states. This is basic reconciliation, not timestamp-buffered interpolation or lag compensation.
- Missing input becomes neutral after 250 ms. Payloads are ≤2048 bytes. Connections exceeding 70 messages/second close. Heartbeats detect dead sockets. Save commands are throttled separately.
- Maximum 100 rooms, 200 sockets, 2 unique heroes per room. Reconnect UUIDs reserve seats for 60 seconds. Empty room simulation stops and room records expire after two minutes.
- Snapshots include shared enemies, HP, action, projectiles, effects, quest, inventory and XP. Local rendering never applies online damage or AI decisions.

## Persistence

`SaveStore` separates transport/simulation from storage. `JsonSaveStore` serializes writes per room and atomically renames a temporary file. The format has a version number. Recent saves restore room state with all players initially disconnected; valid tokens can reconnect within their stored 60-second expiry. Older saves are not loaded. This keeps the first release small without introducing a database. The interface can be backed by SQLite or a remote SQL service later.

Solo uses versionless browser snapshots and is scoped to this vertical slice. A future save-format migration is required before changing the world schema. Co-op tokens use tab-local sessionStorage, so two windows in one browser profile can independently recover after a reload. Solo saves and settings use localStorage.

## Known scope limits

The companion and enemies steer directly and slide against obstacles; there is no navigation mesh or pathfinding. Enemy populations reset on a new adventure and do not respawn. The map has one quest and one boss. The extension gate is decorative. HUD responsiveness targets desktop/tablet; phone touch movement is not implemented. Controller mapping exists but has not been manually tested. Music is a light original synthesis loop, not a composed soundtrack. Advanced shader lighting, full animation sheets, account authentication, durable campaign saves and multi-region transitions are future work. A cross-machine 60 FPS guarantee needs profiling on target hardware; this slice targets 60 FPS and does not claim such a guarantee.

## Phaser 4 verification

Phaser 4.2.1 is pinned. Implementation was checked against the installed `types/phaser.d.ts` and `src/textures/TextureManager.js`. Canvas spritesheets use `addCanvas` followed by `addSpriteSheet` with that texture; the existing texture key is retained by Phaser. `Phaser.Math.Vector2` replaces removed `Geom.Point` for graphics polygon drawing. Tint uses `setTint`; no removed `setTintFill`, bitmap masks or Phaser 3-only lighting plugins are used.

Official release reference: https://phaser.io/download/release/v4.2.1 . Runtime browser tests exercise these exact APIs in Chromium with WebGL locally and the Canvas fallback on GPU-less CI.
