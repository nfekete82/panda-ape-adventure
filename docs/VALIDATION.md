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

## Art Direction & World Cohesion Pass — 2026-10-08

- Fetched the latest `origin/feat/world-visual-overhaul-1` and created
  `feat/world-art-direction-pass`. No merge was performed. Shared/server code,
  authoritative layout/spawns, networking, saves, progression, combat, HUD
  markup/CSS, sounds and the pinned lockfile are unchanged.
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npm test` (67 tests across 12 files, including real WebSockets and persistence),
  and `npm run build` passed. Host runtime is Node 25.9.0; production builds
  use the existing reference Node 24 image.
- Production and development Compose configuration checks passed.
  `docker compose up -d --build --wait` built both production images and
  reported both services healthy.
- `npm run test:docker` passed the actual nginx `/ws` two-player save,
  production stack restart and reconnect/state restoration check.
- All 14 Chromium browser scenarios passed against the final production nginx
  build: gameplay, co-op combat, reconnect/revive, solo saves/migration,
  progression, forge upgrades, HUD, sound, hero weapons/casting and reduced-motion
  exploration near both lakes. Two additional world scenarios passed with
  WebGL disabled, exercising the Canvas renderer.
- New software raster tests execute the actual original tree/enemy painters:
  integer pixel edges, transparent frame margins, unclipped silhouettes,
  substantial shared trunk/root grounding, readable eyes and four distinct
  creature silhouettes. Geometry tests check the enlarged forge envelope,
  reserved NPC silhouettes/feet, region contrast and fir ridge composition.
  All previous simulation, collision, shoreline and persistence tests pass.
- Reviewed final production camp, Ape visibility, forest, lake and ridge
  captures plus a sprite board made from the actual painters through Vite.
  See [WORLD_ART_DIRECTION.md](WORLD_ART_DIRECTION.md). Initial canopy drafts
  had circular shading seams; final silhouettes use continuous crowns. A
  stricter forge-envelope test found furniture touching that envelope; pieces
  were moved and the final test passed. Those initial failures are not passes.
- Decorative density was actively reduced: imported moss squares, animated
  mushroom scatter, repeated circular floor patches and most uniform floor
  marks were removed. New palette/composition calculations run only during
  static asset creation. Ambient object limits and reduced-motion support are
  retained. No measured universal frame-rate claim is made.
- Local coverage remains ARM64 and Chromium (WebGL and Canvas). Firefox,
  Safari, physical controllers and mobile touch input were not executed.
  The enemy renderers now use the original single-frame keys; slime/wisp/hurt
  motion remains, but the imported four-frame creature loops are no longer
  selected. New original art uses CC0-1.0, source uses MIT, and retained vendor
  assets keep their existing licenses in `assets/LICENSE.md`.

## Wild Valley vertical slice — 2026-10-09

- Feature branch: `feat/wild-valley-simulation`, based on the existing
  `feat/0.6.2-mossbound-shrine-quest` working branch. No merge or history replacement.
  Existing forest, bamboo, shrine, combat, progression, HUD and audio were kept.
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npm test` and `npm run build` passed. Final Vitest coverage is **88 tests in
  15 files**, including four real WebSocket integration scenarios. Host Node is
  25.9.0; production images build and run with the existing Node 24 reference.
- New simulation coverage exercises the complete four-crop plant/water/day/
  harvest/sell/build cycle, dry waiting, Panda watering, Ape material discount,
  occupied/out-of-reach/player-blocked placements, dynamic building collision,
  exhausted resource caches, replayed commands, shared overspending, item/gold
  capacity, malformed intent and legacy migrations. A bounded-load check advances
  all 32 plots through 10,000 dry days and compares subdivided deterministic
  growth. This is a simulation capacity check, not a cross-device FPS benchmark.
- Two real WebSocket clients concurrently harvest one crop and build one
  workbench: only one operation succeeds and costs/yields are applied once.
  Plant/water state synchronizes; stale sequences and forged negative trades fail.
  SQLite tests restart the store after concurrent saves and stale a settlement's
  timestamp: gold, stacks, watered growing crops and furniture survive; expired
  seats release, while the character credential reopens the same home.
- Production and development Compose configuration checks passed. Both production
  images were built with `docker compose up -d --build --wait`, with healthy
  services. `npm run test:docker` passed the actual nginx `/ws` save/restart/
  reconnect test, now also checking the purchased watering can, shared gold,
  established-home flag and ownership alongside characters and enemies.
- All **18 Chromium scenarios** passed against the final production build. The
  new solo E2E walks between resources, farm and Rowan, gathers twice across a
  real day, buys a can, hoes/plants/waters, waits for actual growth, harvests,
  sells, builds a workbench and reloads the saved world. Crop/preview and compact
  menu rendering also passed. Existing combat, two-window co-op, reconnect,
  revive, migration, forge, audio, HUD, bamboo bridge/shrine and region-transition
  checks passed.
- Reviewed the production captures below. Fixed pale browser-default button
  backgrounds, divided the menu into Garden/Supplies/Market tabs, and waited for
  camera convergence before reviewing all four crop silhouettes. The transparent
  workbench preview and valid tile highlight are visible in the crop capture.
  [Planted](screenshots/wild-valley/planted.png),
  [Workbench](screenshots/wild-valley/workbench.png),
  [Four crops and preview](screenshots/wild-valley/crops.png),
  [Compact menu](screenshots/wild-valley/compact.png).
- Initial runs are not counted as passes: a test used the wrong parser export
  and was corrected; sandboxed WebSocket startup was blocked, so the suite was
  rerun with local socket access. One formatting issue was corrected. An early
  browser run overlapped the deliberate Compose restart, causing connection-reset
  failures; the final full suite ran after restart and passed uninterrupted.
- No dependency changes or external art additions. New original assets have
  CC0-1.0 provenance and stable texture contracts in `assets/LICENSE.md`.
  Safari, Firefox, physical controllers, touch farming, long-duration economy
  balancing and mobile-device performance were not tested. The 32-tile limit,
  shared supplies, furniture-only chest/workbench and settlement capacity/home
  selection limitations are explicit in `WILD_VALLEY_IMPLEMENTATION.md`.
- The additional final crop/placement scenario passed with Chromium WebGL
  disabled (`CI=1`), exercising Phaser's Canvas fallback. The complete farming
  loop capture rerun exposed a test projection race while the camera was still
  following movement. The helper now waits for midpoint convergence before
  projecting world coordinates. This initial failed rerun is not a pass.
- After fixing that camera helper, the complete farming E2E passed again
  (50.9 seconds) and its planted/workbench captures were retained in docs.

## Wild Valley focused visual rebuild — 2026-10-09

- Branch: `feat/wild-valley-visual-overhaul`. Rebuilt the cottage, four grouped
  garden beds and Panda/Ape artwork. Shared simulation, network, persistence,
  dependencies and collision geometry were not changed. Existing click-path
  typed-array reads now use explicit fallback values to satisfy strict indexing.
- `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check`
  passed. Prettier checks passed for every changed source/document file.
  Full `npm run format:check` **failed** on six untouched baseline files:
  `mini-farm-house.ts`, `mini-farm-tiles.ts`, `mini-farm-tree.ts`,
  `minifarm-atlas.ts`, `style.css` and `packages/shared/src/valley.ts`.
  They were left alone to avoid unrelated formatting churn.
- `npm test` with local socket access: **86 passed, 2 failed** (15 files).
  All four real WebSocket integration tests passed. Both failures are in the
  unchanged farming tests: the crop-cycle test attempts to water an already
  rain-watered crop; the capacity test expects growth to remain at one after
  10,000 days despite automatic rain. No authoritative weather or growth rules
  were altered to make these older assertions pass.
- Final Chromium command:
  `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8083 PLAYWRIGHT_EXTERNAL_SERVER=1 npm run test:browser -- --workers=1 --output=test-results/visual-overhaul`.
  Result: **12 passed, 6 failed**. Both Wild Valley scenarios passed, including
  the complete gather/buy/hoe/plant/water/grow/harvest/sell/build/reload loop
  (52.2 seconds), four crop silhouettes, placement preview and compact menu.
  Forest rendering, movement/save, audio settings, zoom persistence, reconnect,
  progression migration, forge, lakes, Bamboo Crossing/shrine and region blending
  also passed. Failed checks: equipped-weapon attacks, shared combat, potion
  revive, the HUD portrait selector, confirmed damage/trails and Ape cast pulses.
  These same six checks also failed against the already-running older Docker
  build on port 8080. This pass does not claim full combat/HUD regression success.
- Initial sandboxed unit/browser attempts could not start local servers. Socket
  access allowed the integration tests to run. The default browser URL reused
  an older Docker build on 8080; that run was excluded from final validation.
  An overlapping initial run caused Playwright trace-file conflicts, so the final
  run used the isolated Vite port, a separate output directory and one worker.
- Reviewed [the actual scene](screenshots/wild-valley-overhaul/garden-and-companions.png)
  with a valid saved fixture showing both companions, all four crop types,
  untilled/dry/watered soil and the cottage in rain. Browser error list was empty.
  Reviewed [the generated art sheet](screenshots/wild-valley-overhaul/art-sheet.png)
  with all eight hero directions and both soil textures. Early capture fixtures
  and captures interrupted by development reloads were discarded.
- An additional ad hoc click-to-move browser probe timed out; it is **not a pass**.
  The shared collision map and routing algorithm are unchanged, but this probe
  does not establish full click-to-move coverage. The passing farming loop verifies
  keyboard movement and precise interaction-cell projection.
- Host runtime: Node 25.9.0; Node 24 reference runtime was not available for this
  pass. No container changes were made, so image builds, Compose checks and
  production restart validation were not repeated. Firefox, Safari, physical
  controllers, mobile-device performance and Canvas fallback were not tested.
  No commit was created while the full regression/format checks remain failing.

## Visual overhaul review and baseline comparison — 2026-10-09

This review supersedes the inconclusive click-to-move result above. The exact
pre-overhaul HEAD, `a18e795c06721d3b13a19a6d62bd491b7857a884`, was exported into
ignored `test-results/review-baseline/`. Its browser client ran on port 8084;
the working-tree client ran on 8083. Both used the same unchanged shared/server
sources and local WebSocket server. The older Docker deployment was not used
as the baseline for this review.

- Inspected every changed source file, the complete working-tree diff, provenance,
  retained screenshots and this validation history. Shared source directories,
  server sources, save migrations, protocol, lockfile and hero frame manifest
  are unchanged. Generated development-server data is ignored and excluded.
- Exact HEAD unit suite: **86 passed, 2 failed**. Working-tree `npm test`:
  **88 passed, 2 failed** across 16 files. The two new tests pass: every fixed
  farm cell accepts hoe/plant/water and survives legacy/version-3 save migration;
  navigation rejects solid workbench destinations and reopens after removal.
  All four actual WebSocket scenarios pass, including concurrent authoritative
  farm operations and state synchronization. The two rain-related failures are
  identical on HEAD and the working tree; no simulation workaround was added.
- Exact HEAD Chromium suite: **12 passed, 6 failed** (18 scenarios). The same
  six failing scenarios listed above are confirmed on this exact baseline.
  `readInput()` disables attack, special, heal and guard unconditionally on HEAD;
  the farming-first CSS hides `.character-hud`. Those existing choices account
  for the combat/revive and legacy HUD checks. Their restoration is outside this
  rendering pass. Shared movement and reconnect succeed; the shared-combat
  scenario fails at its enemy-damage assertion rather than room movement.
- Click-to-move is resolved: the old probe waited for camera Y **greater than
  1140**, but the camera clamps to **1140** with a 1440×900 viewport at 1.5×
  zoom near the map bottom. It never reached the click. A browser-only diagnostic
  on both HEAD and the working tree clicked `(600, 1160)` from `(520, 1160)`;
  both stopped at approximately `(589.18, 1161.15)`, within the existing
  12-pixel arrival threshold. No movement or collision implementation changed.
  The diagnostic hooks were injected by Playwright routing only, not added to
  application code.
- Persistent Chromium coverage now checks Panda and Ape click movement using a
  converged actual camera midpoint, keyboard cancellation, all 32 ripe rendered
  plots, and legacy-to-version-3 save/reload equality. All three targeted tests
  passed. An initial cancellation assertion sampled stale HUD telemetry after
  key-up; waiting for the existing 100 ms telemetry update corrected the test.
  An initial unit assertion expected an exact destination despite the existing
  32-pixel navigation grid; it now checks the documented cell-sized tolerance.
  Neither initial test attempt is counted as a pass.
- Typecheck, lint and build pass. Exact HEAD has five strict indexed-array
  diagnostics and three unused-variable lint errors; the overhaul resolves them.
  Full-repository formatting still fails on the same six untouched files listed
  above (HEAD has twelve unformatted files). Changed source/test/docs formatting
  and `git diff --check` pass. No unrelated formatting or gameplay changes were
  introduced merely to turn these baseline checks green.
- Reviewed the cottage/hero sheet and actual rainy farm composition. Cottage
  and heroes share warm outlines, cream highlights, subdued sage/blue workwear
  and crisp pixel clusters; native source pixels use nearest-neighbour rendering.
  The four bed seams remain visible in planted layouts. All decorations remain
  outside the 256×128 farm interaction rectangle; resource caches and plot/crop
  objects retain their foreground depth ordering. Hero bounds are still 64×64
  with four frames/eight rows. All 32 cell centres and collision dimensions are
  unchanged. Assets continue to register through `art.ts`; installed Phaser
  4.2.1 CanvasTexture/spritesheet implementations were rechecked.
- Host remains Node 25.9.0. Node 24, Firefox, Safari, physical controllers,
  mobile-device performance and production restart were not revalidated.
  No persistence/network/container implementation changed, so no container
  rebuild or restart was required. PR #17 remains draft and must not be merged
  on the strength of these partial regression results.

Final full browser rerun:
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:8083 PLAYWRIGHT_EXTERNAL_SERVER=1 npm run test:browser -- --workers=1 --output=test-results/review-final-browser`.
**15 passed, 6 failed** (21 scenarios). All original 12 passing cases stayed
passing; all three added browser cases passed. The failing scenario set exactly
matches the exact-HEAD run. No new gameplay, collision, save or multiplayer
regression was found by the diff review and executed checks.

The visual review also caught two east-apron decorations overlapping resource
cache artwork. The barrel and flower tile were moved to clear the fibre and ore
cache footprints without moving any interactive object. The scene capture was
refreshed with a valid two-hero fixture that holds Ape still for art inspection;
it does not claim to exercise companion AI. The source sheet capture is unchanged.

After the resource-art cleanup, both original farming scenarios passed again
(complete loop: 52.0 seconds). A follow-up run exposed one further race in the
new Ape test: repeated HUD camera values during the title-to-game transition
could satisfy a drift-only check before the camera reached the player. The trace
showed the resulting click projected with an outdated midpoint. The helper now
requires both low drift and convergence to the player's position clamped to
world bounds. This is a test projection correction; application input, movement
and collision code remain unchanged. That intermediate run was 4 passed / 1
failed and is not reported as an all-green run.

Final repeat of the corrected navigation/save coverage:
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:8083 PLAYWRIGHT_EXTERNAL_SERVER=1 node_modules/.bin/playwright test tests/browser/visual-overhaul.spec.ts --workers=1 --repeat-each=3 --output=test-results/review-navigation-settled`.
**9 passed** (three scenarios repeated three times, 40.1 seconds). Final
post-correction typecheck and lint passed again. The production build and full
unit results above include the final resource-art placement; the camera helper
change affects tests only. All requested checks were executed before commits.
