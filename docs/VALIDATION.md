# Executed validation — 8 October 2026

Reference environment: macOS on Apple Silicon, Node 25.9.0 / npm 11.12.1 on the host, Node 24 in Docker, OrbStack Docker 29.4.0. Recommended development runtime is Node 24 LTS. Dependencies are pinned in the lockfile; Phaser is exactly 4.2.1.

| Check                                       | Actual result                                                    |
| ------------------------------------------- | ---------------------------------------------------------------- |
| TypeScript strict check                     | Passed for shared, server, game, tests, scripts and tool configs |
| ESLint                                      | Passed                                                           |
| Prettier check                              | Passed                                                           |
| Vitest                                      | 14 tests passed across 3 files                                   |
| Shared package build                        | Passed                                                           |
| Server production build                     | Passed                                                           |
| Vite production build                       | Passed; bundled local engine/assets, no runtime CDN              |
| Chromium against production nginx           | 2 browser tests passed                                           |
| Chromium against Vite development container | Same 2 browser tests passed                                      |
| Production Compose config                   | Passed                                                           |
| Development Compose config                  | Passed                                                           |
| Production server + web images, ARM64       | Built successfully; both run healthy                             |
| Production server + web images, AMD64       | Built successfully under emulation on Apple Silicon              |
| Non-root development image                  | Built and started successfully; Vite and server reachable        |
| `npm run test:docker`                       | Passed real Compose restart and two-session restoration          |
| npm audit                                   | Zero reported vulnerabilities after dependency fixes             |

## What the tests prove

Simulation tests exercise diagonal normalization, obstacle sliding, damage/cooldowns, combo damage, ranged projectiles, shield reduction, invulnerability, potion healing/revival, XP/levels, loot, NPC quest rewards, boss defeat and the guardian's pre-damage warning.

Room/protocol tests verify shared world membership, unique hero ownership, the two-player cap, invalid-room rejection, active-session takeover rejection, disconnect reservation/expiry, and malformed/unbounded input rejection. The persistence test performs concurrent saves, restores HP and reconnect identity, preserves a disconnected token's expiry and ignores corrupt snapshots.

The real WebSocket test starts an isolated server on port 3002. Panda and Ape join one room, duplicate selection is rejected, Ape observes Panda's movement, both receive damage to the same enemy IDs, saving is acknowledged and a disconnected Ape reconnects with the same identity. Additional socket tests enforce message rate and payload limits.

Browser tests launch independent Chromium contexts. They verify a visible rendered canvas/HUD, solo movement, inventory, Escape pause, local save, Panda/Ape selection, one shared room, both rendered players, mutual observed movement, shared enemy damage and tab-local reconnect after page reload. A third test verifies automatic recovery after transport loss and cancellation of a pending reconnect when returning to title. No JavaScript page errors occurred in the successful runs. Screenshots are checked visually and selected captures are committed under `docs/screenshots/`.

The Docker test uses `/ws` through nginx, creates both players, moves and saves, runs `docker compose restart`, and reconnects both original tokens. It compares hero identities, positions, HP and shared enemy IDs/HP after restart. Both production services are healthy and use non-root users (`node`, `101`). The internal server port is not published.

## Earlier failures and corrections

The sandbox initially blocked npm network access and the isolated integration server's local port. Those checks were rerun with execution access and passed; none is counted as passed from the blocked runs. GitHub keychain authentication also required execution access.

Actual Phaser 4 type errors exposed removed `Geom.Point` and the canvas spritesheet texture contract; both were corrected against the installed 4.2.1 sources. Browser tests found a zero-sized HUD parent, Escape immediately cancelling the newly opened native dialog, and mismatched storage for reload recovery. These were corrected and the complete browser scenarios rerun successfully. Critical transitive dependency findings were resolved by pinning/overriding the patched version; the final online audit reported zero findings.

Port 8081 was occupied by another service. It was left untouched. The development smoke test used 18080, and only the project's temporary test container was removed afterward. The production game remains at port 8080.

## Scope and limits

- Local authoritative co-op is tested; Internet matchmaking/accounts and a public production-service threat model are outside this slice.
- AMD64 images were built on Apple Silicon under emulation, not exercised on a separate physical Linux AMD64 machine. ARM64 production and development stacks were exercised directly.
- Chromium was tested; Safari/Firefox and a physical gamepad were not manually exercised.
- No universal 60 FPS claim: this is a responsive desktop slice targeting 60 FPS. Hardware-specific profiling remains open.
- Current directional art and attack/cast poses are simplified procedural assets. More animation frames, advanced pathfinding, additional regions, permanent campaign saves and touch movement remain extensions, documented in `ARCHITECTURE.md`.
- Recent co-op recovery has a 60-second token window. Historical snapshots remain in the volume but do not become permanent campaign saves.
- GitHub Actions is configured to execute checks and multi-architecture builds remotely. Remote execution status must be checked separately; local success does not imply remote success.

GitHub target: **private** `nfekete82/panda-ape-adventure`; checked absent before creation. No existing repository history was replaced.
