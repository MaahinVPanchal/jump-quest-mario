import type { LevelData } from "../types";
import { analyzeLevelFor, floorAt, heightAboveSupport, solid, surfaces } from "../systems/analyzer";
import { BASELINE_PROFILE, type MovementProfile } from "../systems/movementProfile";

/**
 * Final end-to-end pass over a stage.
 *
 * The brick/difficulty and generator passes can leave artefacts that read as
 * broken to a player: bricks and coins floating over a bottomless pit, enemies
 * or checkpoints spawned into thin air, pickups parked above every possible
 * jump, or missing ground after the goal. This pass repairs all of those so
 * every stage is coherent from spawn to flag.
 */

const key = (x: number, y: number) => `${x},${y}`;

function nearestGroundedX(level: LevelData, x: number): number | null {
  for (let d = 1; d < level.widthTiles; d++) {
    if (floorAt(level, x - d) !== null) return x - d;
    if (floorAt(level, x + d) !== null) return x + d;
  }
  return null;
}

/** Solid tile id used by this level's terrain, for patching ground. */
function groundTileId(level: LevelData): number {
  for (let x = 0; x < level.widthTiles; x++) {
    const f = floorAt(level, x);
    if (f !== null) return level.tiles[f]?.[x] ?? 1;
  }
  return 1;
}

function fillColumn(level: LevelData, x: number, top: number, id: number): void {
  for (let y = top; y < level.heightTiles; y++) {
    const row = level.tiles[y];
    if (row) row[x] = id;
  }
}

export function polishLevel(
  level: LevelData,
  profile: MovementProfile = BASELINE_PROFILE,
): LevelData {
  const maxGap = profile.maxJumpDistanceTiles;
  const maxHeight = profile.maxJumpHeightTiles;
  const span = Math.max(2, Math.floor(maxGap / 2));
  const id = groundTileId(level);

  // 1. Ground must exist under spawn and from the goal to the level edge.
  const goalFloor = floorAt(level, level.goal.x) ?? floorAt(level, level.goal.x - 1);
  const patchTop = goalFloor ?? level.heightTiles - 3;
  for (let x = Math.max(0, level.goal.x - 3); x < level.widthTiles; x++) {
    if (floorAt(level, x) === null) fillColumn(level, x, patchTop, id);
  }
  for (let x = 0; x <= level.spawn.x + 2; x++) {
    if (floorAt(level, x) === null) fillColumn(level, x, floorAt(level, level.spawn.x + 3) ?? patchTop, id);
  }

  const taken = new Set<string>();
  for (const b of level.blocks) taken.add(key(b.x, b.y));
  for (const i of level.items) taken.add(key(i.x, i.y));

  // 2. Blocks: never inside terrain, never over a pit, never out of reach.
  const blocks: LevelData["blocks"] = [];
  for (const b of level.blocks) {
    if (solid(level, b.x, b.y)) continue;
    let { x, y } = b;
    if (floorAt(level, x) === null) {
      const nx = nearestGroundedX(level, x);
      if (nx === null) continue;
      if (Math.abs(nx - x) > maxGap) continue;
      x = nx;
      y = (floorAt(level, nx) ?? y) - 4;
    }
    let above = heightAboveSupport(level, x, y, span);
    if (above > maxHeight) {
      const support = surfaces(level, x).find((s) => s > y) ?? floorAt(level, x);
      if (support === null || support === undefined) continue;
      y = support - Math.max(3, profile.safeJumpHeightTiles);
    }
    if (y < 1 || solid(level, x, y)) continue;
    above = heightAboveSupport(level, x, y, span);
    if (above > maxHeight) continue;
    if (taken.has(key(x, y)) && (x !== b.x || y !== b.y)) continue;
    taken.add(key(x, y));
    blocks.push({ ...b, x, y });
  }
  level.blocks = blocks;

  // 3. Items: relocate over-pit or unreachable pickups, drop hopeless ones.
  const items: LevelData["items"] = [];
  for (const it of level.items) {
    let { x, y } = it;
    if (floorAt(level, x) === null) {
      const nx = nearestGroundedX(level, x);
      if (nx === null) continue;
      x = nx;
      y = Math.min(y, (floorAt(level, nx) ?? y) - 2);
    }
    if (heightAboveSupport(level, x, y, span) > maxHeight) {
      const support = surfaces(level, x).find((s) => s > y) ?? floorAt(level, x);
      if (support === null || support === undefined) continue;
      y = support - Math.max(2, profile.safeJumpHeightTiles);
    }
    if (y < 1 || solid(level, x, y)) continue;
    if (heightAboveSupport(level, x, y, span) > maxHeight) continue;
    items.push({ ...it, x, y });
  }
  level.items = items;

  // 4. Enemies stand on ground (flyers may hover).
  level.enemies = level.enemies.flatMap((e) => {
    if (e.type === "flyer") return [e];
    if (e.type === "piranha") {
      // Piranhas only make sense inside a pipe mouth.
      const pipe = level.pipes.find((p) => Math.abs(p.x - e.x) <= 1);
      if (pipe) return [{ ...e, x: pipe.x, y: pipe.y }];
      const near = level.pipes
        .slice()
        .sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0];
      return near ? [{ ...e, x: near.x, y: near.y }] : [];
    }
    if (floorAt(level, e.x) !== null) return [e];
    const nx = nearestGroundedX(level, e.x);
    if (nx === null) return [];
    return [{ ...e, x: nx, y: (floorAt(level, nx) ?? e.y) - 1 }];
  });

  // 5. Checkpoints always land on solid ground.
  if (level.checkpoints?.length) {
    level.checkpoints = level.checkpoints.flatMap((c) => {
      if (floorAt(level, c.x) !== null) return [c];
      const nx = nearestGroundedX(level, c.x);
      if (nx === null) return [];
      return [{ ...c, x: nx, y: (floorAt(level, nx) ?? c.y) - 1 }];
    });
  }

  return level;
}

/** Polish every stage and report anything still unresolved (dev aid). */
export function polishLevels(levels: LevelData[], profile: MovementProfile = BASELINE_PROFILE): LevelData[] {
  return levels.map((l) => {
    const polished = polishLevel(l, profile);
    // Second pass catches geometry that moved during the first.
    const again = polishLevel(polished, profile);
    analyzeLevelFor(again, profile);
    return again;
  });
}
