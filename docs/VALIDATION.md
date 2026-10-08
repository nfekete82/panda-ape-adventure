# Executed validation — character/combat polish, 8 October 2026

| Check                                        | Actual result                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run typecheck`                          | Passed with strict TypeScript/noUncheckedIndexedAccess                                 |
| `npm run lint`                               | Passed                                                                                 |
| `npm run format:check`                       | Passed                                                                                 |
| `npm test` on host                           | 45 tests passed across 8 files, including real WebSockets                              |
| Tests in isolated Node 24 development image  | Same 45 tests passed                                                                   |
| `npm run build`                              | Shared, server and game production builds passed                                       |
| Production Chromium suite                    | All 9 scenarios passed against nginx                                                   |
| Production/development Compose configuration | Both checks passed                                                                     |
| Production server/web and development images | Built locally on ARM64; production stack healthy                                       |
| `npm run test:docker`                        | Two-player save/restart/reconnect passed with progression and enemy-state comparisons  |
| Hero eye raster check in Chromium            | Both eye highlights present in all 40 Panda/Ape front/side walk frames                 |
| Visual review                                | Character/attack phase sheet, live production camp and confirmed melee strike reviewed |

Host checks ran on macOS/Apple Silicon with Node 25.9.0; container tests use the
Node 24 image. Installed Phaser 4.2.1 sources/declarations were inspected for
origin, transform and canvas texture APIs. New weapon tests cover continuous
phase boundaries in all eight directions, return to idle, coupled body motion,
frame advancement between held snapshots, special timing, stale-snapshot expiry, fast upgraded attacks
and downed cancellation. Existing combat, collision, multiplayer, progression
and persistence checks still pass. Browser checks finished before production
restart validation.

Local image execution covers ARM64. AMD64, Safari and Firefox were not run in
this pass. Face pixel checks and pose images used the actual procedural art
functions through a local Vite preview; they are executed inspection, not new
automated golden-image tests. Production screenshots and provenance are linked
in [CHARACTER_COMBAT_POLISH.md](CHARACTER_COMBAT_POLISH.md).

The first animation test fixture compared signed zero with positive zero;
assertions now compare the numeric displacement. An initial ad hoc combat
capture attempted to replace storage in an already-running solo game, whose
unload save overwrote the fixture. A fresh browser initialization produced the
confirmed-hit capture. Only completed successful checks are counted above.

# Earlier validation — Emerald Forest cleanup, 8 October 2026

Final source checks ran on macOS / Apple Silicon with host Node 25.9.0. The same
41-test suite also passed in an isolated development image using Node 24.21.0.
Phaser remains pinned to 4.2.1; installed Transform, Origin, TextureManager sources
and declarations were inspected for the rendering APIs used in this pass.

| Check                                               | Actual result                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run typecheck`                                 | Passed, strict TypeScript and noUncheckedIndexedAccess                                |
| `npm run lint`                                      | Passed                                                                                |
| `npm run format:check`                              | Passed                                                                                |
| `npm test` on host                                  | 41 tests passed across 8 files, including real WebSockets                             |
| `npm test` in isolated Node 24 image                | Same 41 tests passed across 8 files                                                   |
| `npm run build`                                     | Shared, server and Vite production builds passed                                      |
| `PLAYWRIGHT_EXTERNAL_SERVER=1 npm run test:browser` | 9 Chromium scenarios passed against the final production nginx build                  |
| Production and development Compose configuration    | Both `docker compose config --quiet` checks passed                                    |
| Production server/web and development images        | All built locally on ARM64; production stack healthy                                  |
| `npm run test:docker`                               | Two-player save, production restart and both reconnects passed                        |
| Panda face raster inspection in Chromium            | Both eye highlights present in all 20 front/side direction × walk-frame combinations  |
| Visual inspection                                   | Eight facings with idle/wind-up weapons, full map, and camp at gameplay zoom reviewed |

New geometry checks cover complete canopy/rock keep-out envelopes, camp props,
water blocking and bank movement, the dry inlet notch, separated pond placement,
and safe fixed player/NPC/enemy positions. Directional weapon checks cover both
side-view grips during idle/attack and the rendering layer for side/north/south.
Existing combat, progression, persistence and multiplayer suites remain passing.
The production restart check also compares attributes, equipment, inventory,
reward receipts and enemy state. Browser checks ran before restart validation.

Initial sandbox attempts could not bind the WebSocket integration server or use
the Docker socket/GitHub keychain. These were rerun successfully with approved
execution access; initial failures are not counted as passes. Early layout tests
caught an unintended seeded tree shuffle and an outdated rectangular-lake sliding
fixture; generation now retains the old seed exclusions, and the fixture checks
sliding at the authored bank from a verified clear starting position.

Local container coverage is ARM64. AMD64, Safari and Firefox were not executed in
this cleanup. Eye pixel inspection used the actual procedural hero generator in
Chromium through a local Vite preview; it is additional executed verification,
not a claimed new automated golden-image regression test. Screenshots are in
[FOREST_VISUAL_CLEANUP.md](FOREST_VISUAL_CLEANUP.md); other inspection artifacts
remain in ignored `test-results/`. No new external art assets were introduced.

## Earlier release validation — version 0.2.0, 8 October 2026

Reference environment: macOS / Apple Silicon, Node 25.9.0 on the host; Node 24 in the built Docker production and development images. Phaser remains exactly 4.2.1. Results below apply to this release, not the previous vertical slice.

| Check                                            | Actual result                                                                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                              | Passed, strict TypeScript including noUncheckedIndexedAccess                                                                            |
| `npm run lint`                                   | Passed                                                                                                                                  |
| `npm run format:check`                           | Passed                                                                                                                                  |
| `npm test` on host                               | 28 tests passed across 5 files, including real WebSockets                                                                               |
| `npm test` in isolated Node 24 development image | 28 tests passed across 5 files                                                                                                          |
| `npm run build`                                  | Shared, server and Vite production builds passed                                                                                        |
| Chromium against production nginx on 8080        | 6 browser tests passed, including migration of old browser credentials                                                                  |
| Production and development Compose configuration | Both passed                                                                                                                             |
| Production server and web images, ARM64          | Built; both healthy at localhost:8080                                                                                                   |
| Development image, ARM64                         | Built; Node 24 test suite executed inside it                                                                                            |
| Production restart / reconnect                   | Passed two real sessions and comparison of RPG data, inventory, receipts, enemy generations, positions and HP                           |
| Live JSON migration in existing project volume   | Schema 1, 13 recorded imports; permanent characters retained                                                                            |
| Sprite importer                                  | Tested dimensions/state order, registry output, provenance and preservation of the other hero                                           |
| CI configuration                                 | Inspected; includes Node 24 checks, Chromium, production restart and ARM64/AMD64 builds; remote results are tracked on the pull request |

## Evidence and practical limits

Simulation tests cover the existing movement/collision/combat/revive/quest/boss behavior and the new XP curve, three points per level, stat effects, actual upgraded melee/projectile damage, atomic costs through +10, rejected spending, population limits at creation, fixed safe respawn points, delayed timers, generation receipts, shared XP, one-time pickups and deliberate boss reset. The original blocked slime spawn was corrected and all fixed spawn points are checked for collision.

SQLite tests exercise concurrent saves, consistent character/item/receipt restoration, no XP re-award for a restored dead enemy, original versionless data migration, expired JSON room character retention, once-only import, startup backups and permanent progression in a fresh room after a seat expires. An actual upgrade of the existing Docker saves volume imported 13 historical room files without deleting originals. No reconnect credentials are printed by the migration checks.

Real WebSocket clients verify unique heroes, two-player capacity, shared movement/combat, disconnect reservation, save and reconnect, attribute/upgrade synchronization, shared XP/drop quantities, automatic enemy generation changes, command replay rejection, unaffordable upgrade rejection, malformed commands, rate limits and oversized payloads.

Chromium verifies rendered gameplay, two independent browser contexts, reconnect/revive, versionless solo migration with an original backup, persisted attribute spending, material expenditure, increasing weapon damage, a visible unaffordable-upgrade error and permanent equipment across fresh solo regions. Old browser reconnect credentials are adopted for permanent characters. The forge screenshot was inspected for readable costs, attributes and rejection feedback. Traces and screenshots remain in ignored `test-results/`.

The production restart script reconnects both original tokens through nginx and compares level, XP, attributes, weapon, identified inventory, receipts, enemy HP/generation/timers and the previous identity/position/health checks. Browser runs and restart tests are sequential so the restart cannot interrupt Chromium scenarios.

Initial sandbox runs could not bind the integration server on port 3002 or access the Docker socket. Those attempts were not counted as successes; the actual checks were rerun with execution access. One initial Docker development build omitted the `-f docker/Dockerfile` argument; the corrected build succeeded. Early tests also exposed outdated single-drop assumptions and a pickup already consumed before the snapshot; assertions now verify conserved server-side quantities. All reported successful checks refer to completed reruns.

Local Docker builds and runtime tests cover ARM64. This release's AMD64 build is covered by the configured remote CI job; no local AMD64 execution is claimed. CI status must be read from the PR checks, not inferred from host success. Chromium is tested; Safari, Firefox, physical gamepads and universal 60 FPS are not claimed. Existing procedural sprites remain a fallback; the owner's future Panda/Ape reference images were not present or fabricated.

Permanent characters use private browser credentials, not accounts. Solo storage remains browser-local and is not trusted as online progression. Ordinary room movement/health/timers autosave every 15 seconds, so an abrupt process kill can lose the most recent transient state. Rewards and successful progression commands schedule atomic saves immediately; graceful shutdown flushes queued writes. Recent-room reconnect remains 60 seconds while permanent character progress survives room expiration. Backups accumulate and require owner-managed retention.

See [V0.2.0.md](V0.2.0.md) for manual gameplay, migration and backup testing and [SPRITES.md](SPRITES.md) for the art contract.

## Premium combat and HUD — 2026-10-08

- `npm ci` completed with the pinned lockfile unchanged.
- Local host runtime is Node 25.9.0. The repository build image uses Node
  24.21.0; typecheck, lint, format check and all 56 unit/integration tests passed
  inside that image. Its production build also passed.
- Local typecheck, lint, format check, 56 unit/integration tests and build passed.
  Tests include real WebSocket multiplayer and persistence regressions.
- Chromium: all 12 browser tests passed against Vite at 127.0.0.1:8085 and
  against the production nginx build,
  including sound settings, co-op combat/reconnect, progression/save migration,
  forge, hero switching, numeric status, responsive layouts and confirmed damage.
- Compose production and development configurations passed checks. Both affected
  production images built, and `npm run test:docker` passed the actual production
  restart with both saved sessions and room state restored through nginx `/ws`.
- Reviewed original-art HUD, sword trail, staff cast, confirmed damage, phone and
  co-op screenshots; committed review captures are linked in
  [PREMIUM_COMBAT_HUD.md](PREMIUM_COMBAT_HUD.md).
- Initial sandboxed test attempts could not bind local servers or access Docker;
  reruns with authorized local access passed. An early Vite attempt collided
  with another IPv4 service on port 8081; isolated Vite uses 127.0.0.1:8085.
  No unrelated service was modified. A capture-clock race was corrected by
  pausing at a slightly future deadline.
- Phone HUD adapts, but existing touch movement remains unimplemented. Animation
  uses the current sprites with visual body lean rather than new skeletal art.
  No cross-device frame-rate guarantee or manual controller test is claimed.

## Ape mage casting polish — 2026-10-08

- Started from the latest `feat/premium-combat-hud` on
  `feat/ape-mage-casting-polish`; shared/server code and dependency lockfile are
  unchanged.
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npm test` (60 tests including real WebSocket integration), and
  `npm run build` passed locally. Host runtime remains Node 25.9.0; production
  Docker builds use the existing Node 24 image.
- Production and development Compose configuration checks passed. Both
  production images built and `docker compose up -d --build --wait` succeeded.
  `npm run test:docker` passed the actual nginx WebSocket save/restart/reconnect
  test for both heroes.
- Chromium: all 13 browser tests passed on production, including existing
  Panda/HUD, sound, progression, multiplayer and reconnect regressions plus
  normal/special Ape cast pulses and staff pose bounds.
- Reviewed idle, normal cast and special captures linked in
  [APE_MAGE_CASTING.md](APE_MAGE_CASTING.md). Staff motion is restrained and faces
  remain readable. Unit tests sample both casts in all eight directions, verify
  compact amplitude and continuity, and cover release deduplication, empty mana,
  hostile magic, reconnect baselines and rollback.
- Initial pose assertions exposed signed zero at rest (normalized in code) and
  overly tight floating-point/movement tolerances (corrected to sub-pixel
  tolerances). These initial failures are not counted as passing runs.
- Existing sprite arms/head are retained; no separate off-hand rig was added.
  The authority releases immediately, so visual channeling never delays a spell,
  sound, mana spend or damage. No manual gamepad/performance certification is
  claimed.

## World Visual Overhaul 1.0 — 2026-10-08

- Fetched the latest `origin/feat/ape-mage-casting-polish` and created
  `feat/world-visual-overhaul-1`. No merge was performed. Shared/server sources,
  networking, persistence, combat, HUD, audio and the pinned dependency lockfile
  are unchanged.
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npm test` (64 tests across 11 files, including real WebSocket and persistence
  integration), and `npm run build` passed locally. Host runtime is Node
  25.9.0; production image builds ran the reference Node 24 build pipeline.
- Both production and development Compose configuration checks passed.
  `docker compose up -d --build --wait` built both production images and
  reported both services healthy.
- `npm run test:docker` passed the actual two-player nginx `/ws` save,
  production stack restart and reconnect/state restoration check.
- All 14 Chromium browser scenarios passed on Vite and on the final production
  nginx build. Coverage includes co-op movement/combat/reconnect, solo saves,
  progression, forge upgrades, Panda/Ape attacks, HUD/sound settings and the new
  reduced-motion saved exploration of both lakes.
- Two additional Chromium scenarios passed with WebGL disabled, verifying
  Canvas fallback world rendering and reduced-motion lake exploration.
- New geometry tests cover camp prop clearance from NPC silhouettes and the
  forge roof, plant rejection in water/road/protected zones, reflection travel
  inside actual water spans and deterministic tree variation within the
  conservative canopy envelope. Existing shoreline, movement and safe spawn
  tests still pass.
- Reviewed final production camp, main lake, pond, forest and gate captures in
  [WORLD_VISUAL_OVERHAUL.md](WORLD_VISUAL_OVERHAUL.md). Reflection spans are
  cached once; static terrain is painted once; ambience reuses fixed data and
  two Graphics objects. No universal frame-rate guarantee is claimed.
- An initial safety test caught a tool rack overlapping Bramble's silhouette;
  the rack was moved and the final suite passed. Review also moved a fence away
  from the path and softened broadleaf shading and sky reflections. Initial
  failures are not counted as successes.
- The first sandboxed Git fetch could not write `.git/FETCH_HEAD`; the fetch and
  branch creation succeeded with approved execution access. Default Vite port
  8080 was occupied by this project's production stack; browser development
  checks used isolated 127.0.0.1:8085 after an initial capture on the automatically
  selected port 8081 timed out. Final captures came from production on 8080.
  No unrelated service was changed.
- Local production coverage is ARM64 and Chromium. Safari, Firefox, physical
  controllers, mobile touch input and a measured cross-device performance
  comparison were not executed. No new external assets were introduced;
  original artwork and retained vendor provenance are in `assets/LICENSE.md`.
