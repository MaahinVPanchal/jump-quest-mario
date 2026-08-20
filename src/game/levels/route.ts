import type { LevelData } from "../types";
import { BASELINE_PROFILE, type MovementProfile } from "../systems/movementProfile";
import { T } from "./builder";
import { standings, traverse } from "./traverse";

/**
 * Guarantees an end-to-end route.
 *
 * Gap scanning alone cannot see walls, sealed arenas or ceilings, so this pass
 * walks the level the way a player does (see `traverse`) and, whenever the flag
 * is unreachable for the weakest hero, lays a short chain of stepping ledges —
 * carving the headroom they need — from the frontier toward the goal.
 *
 * Every brick it adds is real terrain, so the result stays readable: ledges you
 * can stand on and doorways you can run through, never invisible help.
 */

const carveHeadroom = (level: LevelData, x: number, y: number, tiles = 3): void => {
  for (let i = 1; i <= tiles; i++) {
    const row = level.tiles[y - i];
    if (row && x >= 0 && x < level.widthTiles) row[x] = T.EMPTY;
  }
};

const place = (level: LevelData, x: number, y: number, id: number = T.TOP): void => {
  if (x < 0 || x >= level.widthTiles || y < 1 || y >= level.heightTiles) return;
  const row = level.tiles[y];
  if (row) row[x] = id;
};

/** Standing row nearest the goal flag, creating one when the flag hangs in air. */
function goalStanding(level: LevelData): number {
  const near = standings(level, level.goal.x);
  const best = near.reduce<number | null>(
    (acc, y) => (acc === null || Math.abs(y - level.goal.y) < Math.abs(acc - level.goal.y) ? y : acc),
    null,
  );
  return best ?? level.goal.y;
}

export function ensureRoute(
  level: LevelData,
  profile: MovementProfile = BASELINE_PROFILE,
  maxLedges = 160,
): { repaired: number; reachable: boolean } {
  const span = Math.max(3, profile.safeJumpDistanceTiles);
  const up = Math.max(2, profile.safeJumpHeightTiles);
  let repaired = 0;

  for (let i = 0; i < maxLedges; i++) {
    const result = traverse(level, profile);
    if (result.reachable) return { repaired, reachable: true };
    if (result.nodes.length === 0) return { repaired, reachable: false };

    const gx = level.goal.x;
    const gy = goalStanding(level);

    // Frontier: the reachable stand closest to the flag.
    let from = result.nodes[0]!;
    let bestScore = Infinity;
    for (const n of result.nodes) {
      const score = Math.abs(n[0] - gx) + Math.abs(n[1] - gy) * 1.4;
      if (score < bestScore) {
        bestScore = score;
        from = n;
      }
    }

    const [fx, fy] = from;
    const dirX = gx === fx ? 1 : Math.sign(gx - fx);
    const stepX = Math.max(2, Math.min(span, Math.abs(gx - fx) || span));
    const nx = Math.max(1, Math.min(level.widthTiles - 4, fx + dirX * stepX));
    const dy = fy - gy;
    const climb = Math.max(-4, Math.min(up - 1, dy));
    const ny = Math.max(2, Math.min(level.heightTiles - 3, fy - climb));

    // Doorway through anything between the frontier and the new ledge.
    const lo = Math.min(fy, ny);
    for (let cx = Math.min(fx, nx); cx <= Math.max(fx, nx) + 2; cx++) carveHeadroom(level, cx, lo, 3);
    carveHeadroom(level, fx, fy, 3);

    // The stepping ledge itself: the tile goes one row below the target stand,
    // so the hero ends up standing exactly at `ny`.
    for (let w = 0; w < 3; w++) {
      place(level, nx + w, ny + 1);
      carveHeadroom(level, nx + w, ny + 1, 4);
    }
    repaired++;

    // Once we are beside the flag, make sure it has a landing strip.
    if (Math.abs(nx - gx) <= span && Math.abs(ny - gy) <= up) {
      for (let x = Math.min(nx, gx) - 1; x <= Math.max(nx, gx) + 2; x++) {
        if (standings(level, x).some((s) => Math.abs(s - gy) <= 1)) continue;
        place(level, x, gy + 1);
        carveHeadroom(level, x, gy + 1, 3);
      }
    }
  }

  return { repaired, reachable: traverse(level, profile).reachable };
}

export function ensureRoutes(levels: LevelData[], profile?: MovementProfile): LevelData[] {
  for (const level of levels) ensureRoute(level, profile);
  return levels;
}
