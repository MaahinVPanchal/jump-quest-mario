import { TILE } from "../config";
import type { LevelData } from "../types";
import { BASELINE_PROFILE, type MovementProfile } from "../systems/movementProfile";
import { T } from "./builder";

export interface LevelIssue {
  kind:
    | "gap-too-wide"
    | "step-too-high"
    | "spawn-unsupported"
    | "goal-unsupported"
    | "coin-unreachable"
    | "block-unreachable"
    | "time-too-short"
    | "coin-target-impossible";
  detail: string;
  /** Whether the validator patched the level automatically. */
  repaired: boolean;
}

export interface LevelReport {
  levelId: string;
  widthTiles: number;
  /** Reachable coins along the main route. */
  coins: number;
  /** Longest pit the player must clear, in tiles. */
  widestGap: number;
  /** Tallest required step-up, in tiles. */
  tallestStep: number;
  issues: LevelIssue[];
  ok: boolean;
}

const solid = (level: LevelData, x: number, y: number): boolean =>
  y >= 0 && y < level.heightTiles && x >= 0 && x < level.widthTiles && (level.tiles[y]?.[x] ?? 0) !== 0;

/** Lowest standable tile in a column (the floor); null when the column is a pit. */
function floorAt(level: LevelData, x: number): number | null {
  for (let y = level.heightTiles - 1; y >= 0; y--) {
    if (solid(level, x, y) && !solid(level, x, y - 1)) return y;
  }
  return null;
}

/** Highest standable tile in a column — used for climbs and ledges. */
function highestSurface(level: LevelData, x: number): number | null {
  for (let y = 0; y < level.heightTiles; y++) {
    if (solid(level, x, y) && !solid(level, x, y - 1)) return y;
  }
  return null;
}

function coveredByPlatform(level: LevelData, x0: number, x1: number): boolean {
  return level.platforms.some((p) => {
    const dx = Math.abs(p.dx ?? 0) / TILE;
    const left = p.x - dx;
    const right = p.x + p.widthTiles - 1 + dx;
    return right >= x0 - 1 && left <= x1 + 1;
  });
}

function placeLedge(level: LevelData, x: number, y: number, w: number): void {
  if (y < 1 || y >= level.heightTiles) return;
  for (let i = 0; i < w; i++) {
    const cx = x + i;
    if (cx < 0 || cx >= level.widthTiles) continue;
    const row = level.tiles[y];
    if (row) row[cx] = T.TOP;
  }
}

/**
 * Walks the level left to right, proving that every pit and every step-up on
 * the main route sits inside the movement envelope. Anything outside it is
 * repaired by inserting a stepping platform rather than shipping a dead end.
 */
export function validateLevel(level: LevelData, profile: MovementProfile = BASELINE_PROFILE): LevelReport {
  const issues: LevelIssue[] = [];
  const maxGap = profile.safeJumpDistanceTiles;
  const maxStep = profile.safeJumpHeightTiles;
  let widestGap = 0;
  let tallestStep = 0;

  // --- spawn support ------------------------------------------------------
  if (floorAt(level, level.spawn.x) === null) {
    placeLedge(level, level.spawn.x - 2, Math.min(level.heightTiles - 2, level.spawn.y + 2), 5);
    issues.push({ kind: "spawn-unsupported", detail: "spawn had no ground below it", repaired: true });
  }

  // --- pits ---------------------------------------------------------------
  let x = 0;
  while (x < level.widthTiles) {
    if (floorAt(level, x) !== null) {
      x++;
      continue;
    }
    const start = x;
    while (x < level.widthTiles && floorAt(level, x) === null) x++;
    const end = x - 1;
    const width = end - start + 1;
    widestGap = Math.max(widestGap, width);
    if (width <= maxGap || coveredByPlatform(level, start, end)) continue;
    if (start === 0 || end === level.widthTiles - 1) continue; // level edges, not a route

    const leftY = floorAt(level, start - 1) ?? level.heightTiles - 6;
    const rightY = floorAt(level, end + 1) ?? leftY;
    const restY = Math.max(2, Math.min(leftY, rightY) - 1);
    const pieces = Math.ceil((width + 1) / maxGap) - 1;
    for (let i = 1; i <= pieces; i++) {
      const cx = Math.round(start - 1 + ((width + 1) * i) / (pieces + 1));
      placeLedge(level, cx - 1, restY, 3);
    }
    issues.push({
      kind: "gap-too-wide",
      detail: `pit at x=${start}..${end} was ${width} tiles (max ${maxGap}); added ${pieces} stepping platform(s)`,
      repaired: true,
    });
  }

  // --- step-ups -----------------------------------------------------------
  for (let cx = 1; cx < level.widthTiles; cx++) {
    const prev = floorAt(level, cx - 1);
    const cur = floorAt(level, cx);
    if (prev === null || cur === null) continue;
    const rise = prev - cur; // positive = step up
    if (rise <= 0) continue;
    tallestStep = Math.max(tallestStep, rise);
    if (rise <= maxStep) continue;
    // Insert a mid-height shelf just before the wall.
    const shelfY = cur + Math.floor(rise / 2);
    placeLedge(level, cx - 3, shelfY, 3);
    issues.push({
      kind: "step-too-high",
      detail: `${rise}-tile wall at x=${cx} (max ${maxStep}); added a shelf`,
      repaired: true,
    });
  }

  // --- goal ---------------------------------------------------------------
  const goalFloor = floorAt(level, level.goal.x);
  if (goalFloor === null) {
    placeLedge(level, level.goal.x - 3, level.goal.y + 1, 7);
    issues.push({ kind: "goal-unsupported", detail: "goal flag floated over a pit", repaired: true });
  }
  level.goalMeta = { type: "GOAL_FLAG", position: { ...level.goal }, activationRadius: TILE };

  // --- collectible meaning -------------------------------------------------
  let reachableCoins = 0;
  for (const item of level.items) {
    if (item.type !== "coin") continue;
    const surface = highestSurface(level, item.x) ?? floorAt(level, item.x);
    const base = surface ?? level.heightTiles - 5;
    const above = base - item.y;
    if (above > profile.maxJumpHeightTiles + 1) {
      item.y = base - profile.safeJumpHeightTiles;
      issues.push({
        kind: "coin-unreachable",
        detail: `coin at x=${item.x} sat ${above} tiles above the nearest surface; lowered`,
        repaired: true,
      });
    }
    reachableCoins++;
  }

  // --- bricks / question blocks must be punchable from a surface -----------
  for (const block of level.blocks) {
    const surface = highestSurface(level, block.x) ?? floorAt(level, block.x);
    if (surface === null) continue;
    const above = surface - block.y;
    if (above > profile.maxJumpHeightTiles + 1) {
      block.y = surface - profile.safeJumpHeightTiles;
      issues.push({
        kind: "block-unreachable",
        detail: `block at x=${block.x} was above the jump ceiling; lowered`,
        repaired: true,
      });
    }
  }

  // --- pacing --------------------------------------------------------------
  const minTime = Math.ceil((level.widthTiles * TILE) / (profile.runSpeed * 0.55)) + 45;
  if (level.timeLimit < minTime) {
    level.timeLimit = minTime;
    issues.push({
      kind: "time-too-short",
      detail: `time limit raised to ${minTime}s for a ${level.widthTiles}-tile stage`,
      repaired: true,
    });
  }

  return {
    levelId: level.id,
    widthTiles: level.widthTiles,
    coins: reachableCoins,
    widestGap,
    tallestStep,
    issues,
    ok: issues.length === 0,
  };
}

/** Dev analyzer: prints one line per level plus every repair that was applied. */
export function analyzeLevels(levels: LevelData[]): LevelReport[] {
  const reports = levels.map((l) => validateLevel(l));
  if (typeof console !== "undefined" && import.meta.env?.DEV) {
    for (const r of reports) {
      if (r.ok) continue;
      // eslint-disable-next-line no-console
      console.info(
        `[level ${r.levelId}] gap ${r.widestGap} step ${r.tallestStep} — ${r.issues
          .map((i) => i.kind)
          .join(", ")}`,
      );
    }
  }
  return reports;
}
