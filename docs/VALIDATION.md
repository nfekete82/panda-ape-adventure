# Executed validation — version 0.2.0, 8 October 2026

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
