import { TILE } from "../config";
import type { LevelData } from "../types";
import { BASELINE_PROFILE, type MovementProfile } from "./movementProfile";

/**
 * Read-only analysis of a level measured against ONE character's movement
 * envelope. Nothing here mutates the level (that is the validator's job) — it
 * exists so the debug overlay can colour the world by reachability.
 */

export interface GapInfo {
  x0: number;
  x1: number;
  widthTiles: number;
  /** Top tile row of the ledges on either side, for drawing. */
  y: number;
  reachable: boolean;
  /** A moving platform bridges the pit. */
  bridged: boolean;
}

export interface PointInfo {
  x: number;
  y: number;
  reachable: boolean;
  /** Tiles above the nearest standable surface. */
  above: number;
  label?: string;
}

export interface RectInfo {
  x: number;
  y: number;
  w: number;
  h: number;
  reachable: boolean;
  label: string;
}

export interface LevelAnalysis {
  levelId: string;
  profile: MovementProfile;
  gaps: GapInfo[];
  coins: PointInfo[];
  blocks: PointInfo[];
  checkpoints: PointInfo[];
  secret?: RectInfo;
  goal: PointInfo;
  summary: {
    gaps: number;
    blockedGaps: number;
    coins: number;
    unreachableCoins: number;
    widestGap: number;
    maxGap: number;
    maxHeight: number;
  };
}

export const solid = (level: LevelData, x: number, y: number): boolean =>
  y >= 0 && y < level.heightTiles && x >= 0 && x < level.widthTiles && (level.tiles[y]?.[x] ?? 0) !== 0;

export function floorAt(level: LevelData, x: number): number | null {
  for (let y = level.heightTiles - 1; y >= 0; y--) {
    if (solid(level, x, y) && !solid(level, x, y - 1)) return y;
  }
  return null;
}

/** Every standable tile top in a column, plus tops of solid block stacks. */
export function surfaces(level: LevelData, x: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < level.heightTiles; y++) {
    if (solid(level, x, y) && !solid(level, x, y - 1)) out.push(y);
  }
  for (const b of level.blocks) if (b.x === x) out.push(b.y);
  for (const p of level.platforms) {
    if (x >= p.x && x < p.x + p.widthTiles) out.push(p.y);
  }
  return out.sort((a, b) => a - b);
}

/** Tiles a point sits above the best surface a hero could launch from. */
export function heightAboveSupport(level: LevelData, x: number, y: number, maxSpan: number): number {
  let best = Infinity;
  for (let sx = x - maxSpan; sx <= x + maxSpan; sx++) {
    for (const sy of surfaces(level, sx)) {
      if (sy <= y) continue;
      // Distant supports cost part of the jump budget.
      const penalty = Math.abs(sx - x) * 0.5;
      best = Math.min(best, sy - y + penalty);
    }
  }
  return best === Infinity ? Infinity : Math.round(best);
}

function bridgedByPlatform(level: LevelData, x0: number, x1: number): boolean {
  return level.platforms.some((p) => {
    const dx = Math.abs(p.dx ?? 0) / TILE;
    return p.x + p.widthTiles - 1 + dx >= x0 - 1 && p.x - dx <= x1 + 1;
  });
}

export function analyzeLevelFor(
  level: LevelData,
  profile: MovementProfile = BASELINE_PROFILE,
): LevelAnalysis {
  const maxGap = profile.maxJumpDistanceTiles;
  const maxHeight = profile.maxJumpHeightTiles;

  const gaps: GapInfo[] = [];
  let x = 0;
  let widest = 0;
  while (x < level.widthTiles) {
    if (floorAt(level, x) !== null) {
      x++;
      continue;
    }
    const start = x;
    while (x < level.widthTiles && floorAt(level, x) === null) x++;
    const end = x - 1;
    const width = end - start + 1;
    if (start === 0 || end === level.widthTiles - 1) continue;
    widest = Math.max(widest, width);
    const bridged = bridgedByPlatform(level, start, end);
    gaps.push({
      x0: start,
      x1: end,
      widthTiles: width,
      y: floorAt(level, start - 1) ?? floorAt(level, end + 1) ?? level.heightTiles - 5,
      reachable: bridged || width <= maxGap,
      bridged,
    });
  }

  const pointInfo = (px: number, py: number, label?: string): PointInfo => {
    const above = heightAboveSupport(level, px, py, Math.max(2, Math.floor(maxGap / 2)));
    return { x: px, y: py, above, reachable: above <= maxHeight + 1, ...(label ? { label } : {}) };
  };

  const coins = level.items
    .filter((i) => i.type === "coin" || i.type === "star" || i.type === "relic")
    .map((i) => pointInfo(i.x, i.y, i.type));
  const blocks = level.blocks.map((b) => pointInfo(b.x, b.y, b.kind));
  const checkpoints = (level.checkpoints ?? []).map((c) => pointInfo(c.x, c.y, "checkpoint"));
  const goal = pointInfo(level.goal.x, level.goal.y, "goal");

  const secretZone = level.secretZone;
  const secret: RectInfo | undefined = secretZone
    ? {
        x: secretZone.x,
        y: secretZone.y,
        w: secretZone.w,
        h: secretZone.h,
        label: secretZone.label ?? "Secret",
        reachable:
          level.pipes.some(
            (p) =>
              p.target.x >= secretZone.x - 2 &&
              p.target.x <= secretZone.x + secretZone.w + 2 &&
              p.target.y >= secretZone.y - 3 &&
              p.target.y <= secretZone.y + secretZone.h + 3,
          ) || pointInfo(secretZone.x + Math.floor(secretZone.w / 2), secretZone.y).reachable,
      }
    : undefined;

  return {
    levelId: level.id,
    profile,
    gaps,
    coins,
    blocks,
    checkpoints,
    goal,
    ...(secret ? { secret } : {}),
    summary: {
      gaps: gaps.length,
      blockedGaps: gaps.filter((g) => !g.reachable).length,
      coins: coins.length,
      unreachableCoins: coins.filter((c) => !c.reachable).length,
      widestGap: widest,
      maxGap,
      maxHeight,
    },
  };
}
