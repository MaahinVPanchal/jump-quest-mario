# Full 32-stage bug and loophole audit

## Verified current state

The existing static campaign suite passes **90 tests**, including baseline traversal for all 32 stages and all 10 heroes. However, those checks do not yet model several runtime rules, so a green test can still hide a softlock or unfair stage.

### Confirmed systemic defects

1. **Moving-platform distance uses inconsistent units**
   - Runtime and traversal treat `dx`/`dy` as tiles, while two gap analyzers divide the same values by `TILE`.
   - This can incorrectly mark a platform-assisted gap as blocked or safe.

2. **Checkpoint restarts lose objective state**
   - Collected objects stay removed after death, but the objective tracker starts again at zero.
   - Coins collected before a checkpoint can disappear from objective progress while remaining unavailable in the stage.

3. **Checkpoint order can move backward after restart**
   - The reached checkpoint index resets when the scene restarts even though a checkpoint snapshot survives.
   - An earlier checkpoint can reactivate and overwrite later progress.

4. **Gem-star persistence is incomplete**
   - A relic grants a generated `:gem-star`, but stage restore only recognizes normal star item IDs.
   - The saved bonus can disappear from the live stage HUD after refresh or re-entry.

5. **“10 coins every stage” silently degrades**
   - The objective generator lowers the target when its limited coin count sees fewer than 10.
   - Boss stages 1-4, 2-4, 3-4, and 4-4 expose targets below 10; block-contained coins are also omitted from availability calculation.

6. **Runtime hazards are absent from route proof**
   - Traversal treats geometric support as safe and does not model spikes, lava, falling blocks, timed platforms, wind/current zones, enemy occupancy, or boss arenas.
   - This leaves false-positive “clearable” results, especially in Worlds 4–8.

7. **Piranha enemies are silently deleted when no pipe exists**
   - The polish pass removes every piranha that cannot be assigned to a pipe, changing authored enemy sets without reporting it.
   - Water, lava, and forge recipes can therefore lose intended enemies.

8. **Bosses are not confined to their arenas**
   - Boss movement follows the hero without explicit arena bounds; the supplied 1-4 capture shows the guardian camping the goal.
   - This can make the exit overlap noisy or unsafe even though map geometry is valid.

9. **Scene-owned physics collections are not fully reset**
   - Hazard and boss-collider tracking can retain stale references across scene restarts.
   - Repeated deaths/restarts can recreate the destroyed-object failure class that caused the 1-4 freeze.

10. **Analyzer success is partly produced by auto-repair before tests run**
    - Campaign generation mutates levels through validation, polish, and route repair, then tests only the repaired output.
    - Regressions in authored recipes can be hidden instead of reported with their original level and coordinates.

### Confirmed stage-specific outliers

- **1-4, 2-4, 3-4, 4-4:** fewer than 10 counted coins and boss/goal arena overlap risk.
- **All boss finales (1-4 through 8-4):** need arena-bound, defeat, projectile-cleanup, and post-defeat exit checks.
- **4-2:** zero interactive blocks and zero loose coins; its objective depends entirely on one relic bundle, creating a single-point failure.
- **6-3:** one checkpoint is reported unreachable by the current per-hero inspector despite the broad route test passing.
- **Worlds 3, 5, and 8:** authored piranhas may be removed because affected stages do not provide matching pipe mouths.
- **Worlds 4–8:** static reachability is least reliable because wind, low gravity, ice, lava, timed/falling platforms, and mixed zones are not represented in the proof.

## Implementation plan

### 1. Make the audit truthful and non-destructive

- Separate raw recipe validation from repair so every original defect is retained before mutation.
- Normalize moving-platform travel units and share one calculation between runtime, traversal, validator, analyzer, and inspector.
- Extend validation to report spawn/goal support, bidirectional routes, lethal landings, timed-platform dependence, falling-block recovery, checkpoint-to-goal routes, collectible reachability, pipe destinations, boss arena bounds, and required coin supply.
- Add a per-stage audit record with severity, coordinates, affected heroes, repair status, and remaining manual-review items.

### 2. Repair all 32 stages in campaign order

- Re-run the enhanced audit for every hero on every stage and hand-fix each reported location rather than relying on invisible auto-repair.
- Preserve each world’s identity while adding readable approach steps, safe landing strips, return routes, checkpoint support, and recovery platforms.
- Guarantee at least 10 reachable coin value in every stage, with more than one source so one missed pickup cannot invalidate the objective.
- Fix 4-2’s empty block/coin layout and 6-3’s unreachable checkpoint.
- Add valid pipe mouths for intended piranhas or replace those spawns explicitly; never silently delete authored enemies.
- Constrain every boss to a marked arena and keep the goal safely outside its active movement range until defeat.

### 3. Close runtime and persistence loopholes

- Store and restore checkpoint index plus objective counters, collected IDs, score, coins, relics, and stage stars as one coherent snapshot.
- Prevent an earlier checkpoint from replacing later progress after respawn or backtracking.
- Restore both normal stars and relic-awarded gem stars consistently after refresh and replay.
- Reset scene-owned arrays/colliders on every create/shutdown and guard delayed callbacks and collision handlers against inactive objects.
- Ensure completion, game over, retry, menu exit, and full-campaign completion persist the correct resume stage without unexpectedly falling back to 1-1.

### 4. Add exhaustive regression coverage

- Add table-driven tests for all **32 stages × 10 heroes** covering forward completion, backward recovery, every checkpoint-to-goal segment, all coins/stars/relics/secrets, and boss access.
- Add raw-recipe tests so auto-repair can no longer conceal malformed authored geometry.
- Add runtime tests for checkpoint death/restart, repeated scene restart, pipe entry/exit, moving/falling platforms, shell chains, projectile teardown, every boss defeat, post-boss goal access, star/gem refresh, and campaign resume.
- Add a browser smoke run for each stage that confirms the timer and update loop continue, no uncaught error occurs, and completion advances correctly.

### 5. Surface the final bug list

- Extend the Stage Inspector with an Audit summary showing each stage’s resolved findings, remaining warnings, exact coordinates, and affected heroes.
- Produce a concise 1-1 through 8-4 checklist from the same tested data so the in-game report and automated tests cannot disagree.

## Acceptance criteria

- Every stage passes raw validation without requiring emergency route insertion.
- Every hero has a valid spawn-to-goal path and a valid path from each checkpoint to the goal.
- Every stage permits backtracking or provides an explicit irreversible transition with no required content behind it.
- Every stage contains at least 10 reachable coin value; stars remain optional and gem rewards persist correctly.
- All intended enemies remain present, all eight bosses stay inside their arenas, and no stale callback can freeze the loop.
- Refresh, death, restart, game over, menu exit, and completion preserve the correct stage and progress.
- Automated static and browser suites pass for all 32 stages with zero uncaught runtime errors.