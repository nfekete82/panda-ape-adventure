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

`SaveStore` separates transport/simulation from storage. Version 0.2.0 uses `SqliteSaveStore` and Node 24's built-in SQLite. Serialized writes capture queued state and commit character progression, unique inventory stacks, reward receipts and room snapshots in one WAL transaction with full synchronization. A versioned SQL schema and a JSON-import ledger support migrations. Consistent SQLite backups are atomically renamed on startup; original JSON files are retained and backed up before one-time imports. Permanent character data survives room expiry. Recent world state and reconnect positions remain a 60-second recovery facility. Browser-held credentials authorize a character in one room at a time and are never included in invitations or logs.

Solo uses versioned browser snapshots and separate per-hero progress. The original versionless save migrates on continue, preserving an original backup. It cannot be imported as trusted online progression. See [V0.2.0.md](V0.2.0.md) for schema, migration, durability and recovery details.

## RPG and encounter rules

`shared/rpg.ts` owns the XP curve, four attributes, three points per level, hero-specific weapon values, +0–+10 costs, material stacks and validated RPG actions. Movement and combat read these derived stats directly; clients predict movement using the same speed formula, without applying predicted damage. Network actions contain only an attribute choice, upgrade request or encounter-reset request and monotonic command sequence. The authority validates balance, level cap, range and state; snapshots synchronize results. Loot rolls and unique item IDs originate in shared authority simulation.

Enemies retain fixed spawn slots, death timers and generation counters. Safe distance, collision and per-type live population limits gate respawns. The guardian ignores timer respawn; only a camp interaction after a completed encounter, loot collection and party retreat advances its generation and restores the encounter. Kill and loot receipts prevent repeat rewards, and atomic persistence commits receipt and reward together.

The PNG pipeline accepts 64×64 frames with four columns and eight directions, stable walk frames followed by optional animation blocks. Existing generator assets continue to render. [SPRITES.md](SPRITES.md) documents frame contracts, import checks, fallback states and later reference-image use.

## Known scope limits

The companion and enemies steer directly and slide against obstacles; there is no navigation mesh or pathfinding. Temporary region/quest state resets on a new adventure; hero progression remains permanent. Forest enemies respawn under shared rules. The map has one quest and one boss. The extension gate is decorative. HUD responsiveness targets desktop/tablet; phone touch movement is not implemented. Controller mapping exists but has not been manually tested. Music is a light original synthesis loop, not a composed soundtrack. Advanced shader lighting, artist-supplied full animation sheets, account authentication and multi-region transitions are future work. A cross-machine 60 FPS guarantee needs profiling on target hardware; this slice targets 60 FPS and does not claim such a guarantee.

## Phaser 4 verification

Phaser 4.2.1 is pinned. Implementation was checked against the installed `types/phaser.d.ts` and `src/textures/TextureManager.js`. Canvas spritesheets use `addCanvas` followed by `addSpriteSheet` with that texture; the existing texture key is retained by Phaser. `Phaser.Math.Vector2` replaces removed `Geom.Point` for graphics polygon drawing. Tint uses `setTint`; no removed `setTintFill`, bitmap masks or Phaser 3-only lighting plugins are used.

Official release reference: https://phaser.io/download/release/v4.2.1 . Runtime browser tests exercise these exact APIs in Chromium with WebGL locally and the Canvas fallback on GPU-less CI.
