# Riko and the Emberleaf Meadow — v0.1 Vertical Slice

An original 2D side-scrolling platformer, playable in the browser, built as a Phaser 3 + TypeScript game embedded in this existing TanStack Start app. No Nintendo assets, names, music, or art — everything original (placeholder vector-style shapes now, replaceable later).

## Scope of this build

This first build is the polished vertical slice described in the brief (sections 85, 108, 113) — not 40 characters or 8 worlds. The architecture is built so those can be added later without rewrites.

Included:
- One original hero, "Riko" (scarf + goggles silhouette, bright teal/orange palette)
- One complete Level 1, "Emberleaf Meadow", ~300s timer, data-driven from a level JSON module
- 3 enemy types: Sprout Walker (stomp), Bramble Shell (stomp → shell you can kick), Puffwing Flyer (sine-wave flight)
- Coins, 3 hidden Golden Relics, question blocks, breakable blocks, hidden blocks
- 2 power-ups: Growth Orb (grow, break bricks, take one extra hit) and Fire Crystal (bouncing projectile, X to fire, max 4 active)
- 1 checkpoint, 1 secret route, 1 bonus coin room via a tunnel, 1 skilled-player shortcut
- Goal flag with end-of-level sequence, score/time/secrets/rank screen
- HUD, pause menu, lives, death/respawn, combo, save system with 3 slots
- Debug mode (F1–F10) enabled only in dev

Deferred (architecture supports them): world map, character select roster, bosses, achievements, ghost replay, mobile touch controls, cloud saves.

## Game feel targets

- 60 FPS, Arcade Physics with hand-tuned constants
- Acceleration/deceleration, separate walk and run speeds (Shift to run), air control
- ~120 ms jump buffering, ~120 ms coyote time, variable jump height (hold to go higher)
- Short 60 ms hit-stop on stomps, dust/particle feedback, restrained screen shake (toggleable)
- Smooth camera with dead zone and 25% look-ahead in the run direction, clamped to level bounds
- 5-layer parallax background (sky, clouds, hills, treeline, foreground grass)

## Level 1 shape

Teaches progressively: safe ground and coins → first question block → first walker → small gap → Growth Orb → breakable bricks → vertical climb → secret ledge (Relic 1) → checkpoint → mixed enemies + moving platforms → tunnel to bonus room (Relic 2) → hidden block chain to 1-Up → large gap with shortcut route → final enemy group → goal flag. Nothing lethal appears before it has been demonstrated safely.

## Technical approach

- `bun add phaser`. Game lives in `src/game/` and is loaded only in the browser (dynamic import behind a client-only mount) so SSR never evaluates Phaser.
- Route `/` becomes the game shell: title, save-slot select, and the canvas (16:9, 1280×720 internal, scaled with `Scale.FIT`).
- React owns only the shell chrome (title screen, slot select, settings). Phaser owns the gameplay loop, HUD, pause overlay, and level-complete screen so they stay frame-synced.
- Structure:
  - `src/game/config.ts` — tuning constants, no magic numbers in logic
  - `src/game/scenes/` — Boot, Preload, Title, Level, Pause, LevelComplete, GameOver
  - `src/game/entities/` — Player (split into Movement/Combat/PowerUp/Animation controllers), enemies, items, blocks, projectiles
  - `src/game/systems/` — InputManager (action-mapped: MOVE_LEFT/JUMP/ATTACK/…), CameraSystem, AudioManager, ParticleManager, PoolManager, ScoreSystem, SaveManager, EventBus
  - `src/game/data/` — typed `CharacterData`, `EnemyData`, `LevelData`, `ItemData`, `SaveData`; level 1 authored purely as data
  - `src/game/levels/level1.ts` — tile grid + object/enemy/item/secret/checkpoint arrays
- Art: generated at runtime as original vector-style textures (Phaser Graphics → texture) so the build has zero external asset dependencies; swap in drawn sprites later via the asset manifest.
- Audio: original short synthesized SFX via WebAudio (jump, coin, block, stomp, power-up, hurt, checkpoint, goal) plus a simple original looping melody, all behind volume settings and pooled.
- Save: versioned `save_version: 1` schema in localStorage, 3 slots, autosave on checkpoint and level complete, migration hook in place.
- Types strict, no `any`; every system is data-driven and reusable across future levels.

## How it will be verified

Playthrough in a headless browser: reach the flag, confirm coins/blocks/power-ups/enemies/checkpoint/death-respawn/pause/save all behave, and check the console is clean at 60 FPS. Edge cases from the brief (goal triggered twice, timer expiry, power-up while damaged, ceiling clipping on growth) are covered by guards in code.
