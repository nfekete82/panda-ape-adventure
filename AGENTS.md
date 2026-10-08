# Development rules

- Work only in this repository. Never modify neighboring projects, global settings, credentials or unrelated containers.
- Keep TypeScript strict, with `noUncheckedIndexedAccess`; do not silence errors with `any` or unsafe casts.
- Use npm workspaces. Commit the lockfile and pin dependency versions. Node 24 LTS is the reference runtime.
- Phaser is exactly 4.2.1. Inspect its installed sources and declarations for API changes; Phaser 3 examples are not authoritative. In particular, `Geom.Point` is gone, and canvas spritesheets are created through CanvasTexture.
- `packages/shared` owns the deterministic collision map, input validation, protocol and simulation. It must not import Phaser, browser APIs, sockets or file I/O.
- Online gameplay is server authoritative. Clients send bounded intent only, never player positions, damage, loot or enemy decisions. Apply actions to the shared room once. Prediction affects rendering only.
- Render assets in `apps/game/src/art.ts`; keep texture keys and frame contracts stable so external art can replace the generator. Document provenance and license for every new asset. No runtime CDN dependencies.
- Persistence implementations must conform to `SaveStore`, serialize concurrent writes and use atomic replacement. Reconnect tokens must never appear in logs or invites.
- Limit rooms to two unique heroes. Reserve disconnected seats for 60 seconds. Validate every message and enforce payload, rate, sequence and capacity limits.
- Keep browser URLs relative to the current origin. Route `/ws` through Vite during development and nginx in production.
- Before committing: run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, and browser tests when Chromium is available. Changes to network logic require real WebSocket integration tests; combat/collision changes require simulation tests.
- Container changes require both Compose configuration checks and affected image builds. Test a production restart when persistence/reconnect changes.
- Never report unexecuted tests as successful. Record environmental limitations in `docs/VALIDATION.md`.
- Use descriptive English commits. Never replace remote history, force-push, or make the repository public.
