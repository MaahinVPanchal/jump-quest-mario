import type { LevelData } from "../types";
import { BASELINE_PROFILE, type MovementProfile } from "../systems/movementProfile";

/**
 * Coarse but honest traversability check: walks the tile grid the way a player
 * does (stand on a surface, need headroom, walk/jump between surfaces) and
 * answers whether the goal is reachable from the spawn.
 *
 * The analyzer only measures gaps and point heights; this catches walls,
 * ceilings and sealed arenas that a gap scan cannot see.
 */

const HEAD = 2; // tiles of clearance a hero needs above the tile it stands on

export const isSolid = (l: LevelData, x: number, y: number): boolean =>
  y >= 0 && y < l.heightTiles && x >= 0 && x < l.widthTiles && (l.tiles[y]?.[x] ?? 0) !== 0;

const outside = (l: LevelData, x: number, y: number): boolean =>
  x < 0 || x >= l.widthTiles || y < 0 || y >= l.heightTiles;

/** Can a hero occupy the space whose feet rest on top of tile row `y`? */
function clear(l: LevelData, x: number, y: number): boolean {
  for (let i = 1; i <= HEAD; i++) {
    if (outside(l, x, y - i)) continue;
    if (isSolid(l, x, y - i)) return false;
  }
  return true;
}

/** Standable surfaces in a column: solid tile with headroom above it. */
export function standings(l: LevelData, x: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < l.heightTiles; y++) {
    if (isSolid(l, x, y) && !isSolid(l, x, y - 1) && clear(l, x, y - 1)) out.push(y - 1);
  }
  for (const p of l.platforms) if (x >= p.x && x < p.x + p.widthTiles) out.push(p.y - 1);
  return [...new Set(out)].sort((a, b) => a - b);
}

/** A column is passable in a band if it is not solid all the way through it. */
function bandOpen(l: LevelData, x: number, yTop: number, yBottom: number): boolean {
  let run = 0;
  for (let y = Math.max(0, yTop); y <= Math.min(l.heightTiles - 1, yBottom); y++) {
    if (!isSolid(l, x, y)) {
      run++;
      if (run >= HEAD) return true;
    } else run = 0;
  }
  return false;
}

export interface TraverseResult {
  reachable: boolean;
  visited: number;
  /** Farthest x column the hero can stand on. */
  farthestX: number;
  /** Every standable tile the hero can actually get to, as [x, y] pairs. */
  nodes: Array<[number, number]>;
  /** Description of what stopped progress, when blocked. */
  reason?: string;
}


export function traverse(level: LevelData, profile: MovementProfile = BASELINE_PROFILE): TraverseResult {
  const maxUp = Math.max(1, profile.maxJumpHeightTiles);
  const maxSpan = Math.max(2, profile.maxJumpDistanceTiles);
  const key = (x: number, y: number) => y * level.widthTiles + x;

  // Start from any surface under/near the spawn.
  const startNodes: Array<[number, number]> = [];
  for (let x = Math.max(0, level.spawn.x - 2); x <= level.spawn.x + 2; x++) {
    for (const y of standings(level, x)) if (y >= level.spawn.y - 3) startNodes.push([x, y]);
  }
  if (startNodes.length === 0) return { reachable: false, visited: 0, farthestX: level.spawn.x, nodes: [], reason: "spawn has no floor" };

  const seen = new Set<number>();
  const nodes: Array<[number, number]> = [];
  const queue = [...startNodes];
  for (const [x, y] of startNodes) {
    seen.add(key(x, y));
    nodes.push([x, y]);
  }
  let farthest = 0;

  while (queue.length) {
    const [x, y] = queue.shift()!;
    farthest = Math.max(farthest, x);

    const push = (nx: number, ny: number) => {
      if (nx < 0 || nx >= level.widthTiles || ny < 0 || ny >= level.heightTiles) return;
      const k = key(nx, ny);
      if (seen.has(k)) return;
      seen.add(k);
      nodes.push([nx, ny]);
      queue.push([nx, ny]);
    };

    for (let dx = -maxSpan; dx <= maxSpan; dx++) {
      const nx = x + dx;
      if (nx < 0 || nx >= level.widthTiles) continue;
      const cost = Math.abs(dx);
      for (const ny of standings(level, nx)) {
        const up = y - ny;
        if (up > maxUp) continue;
        // Falling is free; jumping up costs part of the horizontal budget.
        if (up > 0 && cost > maxSpan - Math.floor(up / 2)) continue;
        // Every column crossed must have a passable slot.
        let blocked = false;
        const top = Math.min(y, ny) - maxUp;
        const bottom = Math.max(y, ny) + 1;
        const step = dx >= 0 ? 1 : -1;
        for (let cx = x + step; cx !== nx + step; cx += step) {
          if (!bandOpen(level, cx, top, bottom)) {
            blocked = true;
            break;
          }
        }
        if (!blocked) push(nx, ny);
      }
    }
    // Pipes are teleports.
    for (const p of level.pipes) {
      if (Math.abs(p.x - x) <= 2 && Math.abs(p.y - y) <= 3) {
        for (const ty of standings(level, p.target.x)) if (Math.abs(ty - p.target.y) <= 4) push(p.target.x, ty);
      }
    }
  }

  const goalOk = (() => {
    for (let x = level.goal.x - 2; x <= level.goal.x + 2; x++)
      for (const y of standings(level, x)) if (Math.abs(y - level.goal.y) <= 3 && seen.has(key(x, y))) return true;
    return false;
  })();

  return {
    reachable: goalOk,
    visited: seen.size,
    farthestX: farthest,
    nodes,
    ...(goalOk ? {} : { reason: `stuck at x=${farthest} of ${level.widthTiles} (goal x=${level.goal.x})` }),
  };
}
