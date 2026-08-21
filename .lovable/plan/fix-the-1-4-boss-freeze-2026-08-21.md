# Fix the 1-4 boss freeze

## What is happening

World 1-4 does not pause — the game loop crashes and stops rendering, which looks identical to a pause.

Confirmed from the runtime error and the code: `Boss.hurt()` (src/game/entities/Boss.ts) runs `this.scene.tweens.add(...)`, but once the boss has been defeated it calls `die()` → `destroy()`, after which `this.scene` is `undefined`. The boss overlap handlers in `LevelScene` (player stomp, fireball hit) can still fire on the same or next physics step, so `hurt()` runs on a destroyed sprite and throws `Cannot read properties of undefined (reading 'tweens')`. The thrown error escapes the physics step and kills the update loop for the rest of the stage.

## The fix

1. Harden `Boss` against post-destroy use
   - `canBeHurt()` also requires an active sprite with a live scene, so `hurt()` returns `false` instead of throwing.
   - `die()` disables the body and immediately stops further damage; the defeat tween and `preUpdate` shooting logic both bail out when the sprite is no longer attached to a scene.
2. Detach the boss on defeat in `LevelScene`
   - Remove/disable the boss colliders and overlaps in the `onDefeated` hook so no handler can reach a destroyed boss.
   - Guard the stomp and fireball handlers with the same "boss still alive and active" check that already exists for `defeated`.
3. Same class of bug elsewhere
   - Audit the other overlap/collider callbacks that touch a possibly destroyed target (boss shots, shield overlap) and apply the same active check, so one destroyed object can never stop the loop again.
4. Verify 1-4 end to end
   - Run the level in a headless browser: fight the boss, defeat it, keep playing to the flag, and confirm no runtime error appears and the timer, enemies, and platforms keep moving after the boss dies.
   - Run the existing campaign test suite to confirm no regressions.

## Notes

No gameplay tuning changes: boss health, phases, and timings stay exactly as they are. This is a stability fix only.
