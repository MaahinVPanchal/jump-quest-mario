import type { BlockKind, LevelData } from "../types";

/**
 * Brick-based difficulty pass.
 *
 * Every stage gets extra brick architecture whose density, height and mix
 * escalate with the world number: world 1 gets a couple of friendly reward
 * rows, world 8 gets hurdles, staircases, low ceilings and falling spans.
 * Bricks are only ever placed in empty air above solid ground, never inside
 * the spawn run-up, the goal approach, a pipe or an existing block, so the
 * validator still proves the route afterwards.
 */

interface Cell {
  x: number;
  y: number;
}

const solid = (level: LevelData, x: number, y: number): boolean =>
  y >= 0 && y < level.heightTiles && x >= 0 && x < level.widthTiles && (level.tiles[y]?.[x] ?? 0) !== 0;

function floorAt(level: LevelData, x: number): number | null {
  for (let y = level.heightTiles - 1; y >= 0; y--) {
    if (solid(level, x, y) && !solid(level, x, y - 1)) return y;
  }
  return null;
}

export interface BrickTuning {
  /** Number of brick formations added. */
  clusters: number;
  /** Tallest hurdle stack, in tiles. */
  maxStack: number;
  /** Chance-like index deciding how many formations are hazardous. */
  hazardEvery: number;
}

export function brickTuning(world: number): BrickTuning {
  const w = Math.max(1, Math.min(8, world));
  return {
    clusters: 2 + w,
    maxStack: w <= 2 ? 1 : w <= 5 ? 2 : 3,
    hazardEvery: w <= 2 ? 99 : w <= 4 ? 3 : 2,
  };
}

export function applyBrickDifficulty(level: LevelData): LevelData {
  const tuning = brickTuning(level.world);
  const taken = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  for (const b of level.blocks) taken.add(key(b.x, b.y));
  for (const i of level.items) taken.add(key(i.x, i.y));
  for (const p of level.pipes) for (let dy = -3; dy <= 3; dy++) for (let dx = -2; dx <= 2; dx++) taken.add(key(p.x + dx, p.y + dy));

  const free = (x: number, y: number): boolean =>
    x > 0 && x < level.widthTiles - 1 && y > 1 && !solid(level, x, y) && !taken.has(key(x, y));

  const put = (kind: BlockKind, x: number, y: number, contains?: LevelData["items"][number]["type"]): void => {
    if (!free(x, y)) return;
    taken.add(key(x, y));
    level.blocks.push({ kind, x, y, ...(contains ? { contains } : {}) });
  };

  const coin = (x: number, y: number): void => {
    if (!free(x, y)) return;
    taken.add(key(x, y));
    level.items.push({ type: "coin", x, y });
  };

  const start = Math.max(18, level.spawn.x + 14);
  const end = Math.min(level.widthTiles - 18, level.goal.x - 10);
  if (end - start < 20) return level;

  const spots: Cell[] = [];
  for (let i = 0; i < tuning.clusters; i++) {
    const x = Math.round(start + ((end - start) * (i + 1)) / (tuning.clusters + 1));
    const y = floorAt(level, x);
    if (y === null) continue;
    spots.push({ x, y });
  }

  spots.forEach((spot, i) => {
    const ground = spot.y;
    const pattern = (level.world + i) % 4;
    const hazardous = i % tuning.hazardEvery === 0 && level.world >= 3;

    if (pattern === 0) {
      // Reward row with a question block in the middle.
      const width = 3 + Math.floor(level.world / 2);
      const rowY = ground - 4;
      for (let k = 0; k < width; k++) put("brick", spot.x + k, rowY);
      put("question", spot.x + Math.floor(width / 2), rowY, "coin");
      for (let k = 0; k < width; k += 2) coin(spot.x + k, rowY - 2);
      return;
    }

    if (pattern === 1) {
      // Hurdle: short brick stacks the hero must hop over.
      for (let s = 0; s < tuning.maxStack; s++) {
        put("brick", spot.x, ground - 1 - s);
        put("brick", spot.x + 4, ground - 1 - s);
      }
      coin(spot.x + 2, ground - 3);
      return;
    }

    if (pattern === 2) {
      // Brick staircase climbing to a coin shelf.
      const steps = 2 + Math.min(3, Math.floor(level.world / 2));
      for (let s = 0; s < steps; s++) {
        for (let h = 0; h <= s; h++) put(hazardous ? "falling" : "brick", spot.x + s, ground - 1 - h);
      }
      coin(spot.x + steps, ground - steps - 1);
      put("hidden", spot.x + steps + 2, ground - 5, "oneUp");
      return;
    }

    // Low brick ceiling forcing a tight corridor (harder worlds only).
    const ceilY = ground - (level.world >= 5 ? 4 : 5);
    for (let k = 0; k < 5 + level.world; k++) put(hazardous ? "falling" : "brick", spot.x + k, ceilY);
    coin(spot.x + 2, ceilY - 2);
    coin(spot.x + 4, ceilY - 2);
  });

  return level;
}
