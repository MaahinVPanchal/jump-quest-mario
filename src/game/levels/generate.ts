import type {
  BlockSpawn,
  EnemySpawn,
  ItemSpawn,
  LevelData,
  MovingPlatformSpawn,
  PipeSpawn,
  Vec2,
} from "../types";
import { STAGE_THEMES, themeByWorld } from "./themes";

/** Legacy alias kept for briefing UI code that reads world names. */
export const WORLD_THEMES = STAGE_THEMES;

/** Deterministic RNG so every generated stage is identical between sessions. */
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0xffffffff;
  };
}

const HEIGHT = 24;
const SURFACE = 19;

export function buildLevel(world: number, level: number): LevelData {
  const theme = themeByWorld(world);
  const index = world - 1;
  const rand = rng(1337 + index * 7919);
  const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length)]!;

  const width = 180 + index * 4 + Math.floor(rand() * 20);
  const tiles: number[][] = Array.from({ length: HEIGHT }, () => new Array<number>(width).fill(0));

  const fill = (x0: number, x1: number, y0: number, y1: number, idx: number): void => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) if (tiles[y] && x >= 0 && x < width) tiles[y]![x] = idx;
  };
  const ground = (x0: number, x1: number): void => {
    fill(x0, x1, SURFACE, SURFACE, 1);
    fill(x0, x1, SURFACE + 1, HEIGHT - 1, 2);
  };

  // --- terrain: alternating slabs with pits that widen as the campaign goes on
  const segments: [number, number][] = [];
  const pitMin = 3 + Math.min(4, Math.floor(index / 10));
  let x = 0;
  while (x < width - 24) {
    const run = 16 + Math.floor(rand() * 20);
    const end = Math.min(width - 20, x + run);
    segments.push([x, end]);
    ground(x, end);
    x = end + pitMin + Math.floor(rand() * 3);
  }
  ground(width - 22, width - 1);
  segments.push([width - 22, width - 1]);

  // --- shelves and stair climbs
  const items: ItemSpawn[] = [];
  const blocks: BlockSpawn[] = [];
  const enemies: EnemySpawn[] = [];
  const platforms: MovingPlatformSpawn[] = [];
  const pipes: PipeSpawn[] = [];
  const hazards: Vec2[] = [];

  const coinRow = (x0: number, x1: number, y: number): void => {
    for (let cx = x0; cx <= x1; cx++) items.push({ type: "coin", x: cx, y });
  };

  // Difficulty curve: later worlds field more, faster, longer-ranged patrols.
  const enemyDensity = 12 + Math.floor(index * 1.4);
  // Complex architecture: staircases grow one step taller per world (world 10 = 10 high).
  const stairHeight = Math.min(10, 2 + index);
  const SAFE_START = 14;
  const checkpointXs: number[] = [];
  const safeFrom = (tx: number): boolean =>
    tx > SAFE_START && checkpointXs.every((cx) => Math.abs(tx - cx) > 6);
  const thirdSeg = segments[Math.floor(segments.length / 3)];
  const midSeg = segments[Math.floor(segments.length / 2)];
  if (thirdSeg) checkpointXs.push(thirdSeg[0] + 4);
  if (midSeg) checkpointXs.push(midSeg[0] + 4);
  segments.forEach(([sx, ex], i) => {
    if (ex - sx < 10) return;
    const shelfY = 8 + Math.floor(rand() * 6);
    const shelfX = sx + 3 + Math.floor(rand() * 4);
    const shelfW = 3 + Math.floor(rand() * 3);
    const tileIdx = world >= 5 ? 3 : 1;
    fill(shelfX, shelfX + shelfW, shelfY, shelfY, tileIdx);
    coinRow(shelfX, shelfX + shelfW, shelfY - 1);

    if (i % 2 === 0) {
      blocks.push({ kind: "question", x: shelfX + 1, y: shelfY - 4, contains: i % 4 === 0 ? "growthOrb" : "coin", coins: 3 });
      blocks.push({ kind: "brick", x: shelfX + 2, y: shelfY - 4 });
    }
    if (i === 1) blocks.push({ kind: "question", x: sx + 6, y: SURFACE - 4, contains: "fireCrystal" });
    if (i === 2) blocks.push({ kind: "question", x: sx + 6, y: SURFACE - 4, contains: "banana" });
    if (i === 3) blocks.push({ kind: "question", x: sx + 6, y: SURFACE - 4, contains: "catBell" });
    if (i === 3) blocks.push({ kind: "hidden", x: sx + 5, y: SURFACE - 5, contains: "oneUp" });

    // --- climbable buildings: pyramid stairs, towers and bridge decks
    if (ex - sx > 14) {
      const stepW = 1;
      const baseX = sx + 6;
      const up = i % 3 !== 2;
      for (let s = 0; s < stairHeight; s++) {
        const col = baseX + s * stepW;
        if (col >= ex - 2) break;
        const h = up ? s + 1 : stairHeight - s;
        fill(col, col, SURFACE - h, SURFACE - 1, world >= 5 ? 3 : 1);
      }
      // Landing deck on top of the stairs with a coin payout.
      const topX = Math.min(ex - 3, baseX + stairHeight);
      const topY = SURFACE - stairHeight;
      fill(topX, Math.min(ex - 1, topX + 3), topY, topY, world >= 5 ? 3 : 1);
      coinRow(topX, Math.min(ex - 1, topX + 3), topY - 1);
      // Tower: a stacked metal/brick column beside the deck, every other segment.
      if (i % 2 === 0) {
        const tx = Math.min(ex - 2, topX + 5);
        for (let h = 1; h <= Math.min(6, 2 + Math.floor(index / 2)); h++) {
          blocks.push({ kind: h % 3 === 0 ? "question" : "metal", x: tx, y: SURFACE - h * 2, ...(h % 3 === 0 ? { contains: "coin" as const, coins: 2 } : {}) });
        }
      }
    }

    const count = Math.min(6, 1 + Math.floor(rand() * (1 + enemyDensity / segments.length)));
    for (let n = 0; n < count; n++) {
      const kind = pick(theme.enemies);
      const ex0 = sx + 4 + Math.floor(rand() * Math.max(1, ex - sx - 6));
      // Never place a threat in the drop zone or on a checkpoint respawn pad.
      if (!safeFrom(ex0)) continue;
      if (kind === "ogre") enemies.push({ type: "ogre", x: ex0, y: shelfY + 1, patrol: 140 + Math.floor(rand() * 60) });
      else if (kind === "lobber")
        enemies.push({ type: "lobber", x: ex0, y: SURFACE - 1, direction: -1, patrol: 60 + Math.floor(rand() * 40) });
      else if (kind === "piranha") {
        pipes.push({ x: ex0, y: SURFACE - 2, target: { x: Math.min(width - 24, ex0 + 24), y: SURFACE - 1 }, label: `${theme.name} tunnel` });
        enemies.push({ type: "piranha", x: ex0, y: SURFACE - 2 });
      } else
        enemies.push({
          type: kind,
          x: ex0,
          y: SURFACE - 1,
          direction: rand() > 0.5 ? 1 : -1,
          patrol: 80 + Math.floor(rand() * 80),
        });
    }

    if (i > 0 && i % 2 === 1) {
      platforms.push({
        x: sx - pitMin,
        y: SURFACE - 2 - Math.floor(rand() * 3),
        widthTiles: 2 + Math.floor(rand() * 2),
        ...(rand() > 0.5 ? { dx: 3 + rand() * 2 } : { dy: -(3 + rand() * 2) }),
        duration: 2200 + Math.floor(rand() * 1200),
      });
    }
    // Traps: spike beds get longer and more frequent deeper into the campaign.
    if (world >= 2 && i % 2 === 1) {
      const trapX = sx + 8;
      const span = 1 + Math.min(3, Math.floor(index / 3));
      for (let t = 0; t < span; t++) if (safeFrom(trapX + t)) hazards.push({ x: trapX + t, y: SURFACE - 1 });
    }
    if (world >= 5 && i % 3 === 0 && safeFrom(sx + 13)) hazards.push({ x: sx + 13, y: SURFACE - 1 });
  });

  // --- stars: required from world 3 onward, more of them deeper in
  const starsRequired = world >= 2 ? Math.min(8, 2 + Math.floor(world / 2)) : 0;
  for (let s = 0; s < starsRequired; s++) {
    const seg = segments[Math.floor(((s + 1) / (starsRequired + 1)) * segments.length)] ?? segments[0]!;
    items.push({ type: "star", x: Math.min(width - 4, seg[0] + 6), y: 6 + ((s * 3) % 8), id: `star-${world}-${level}-${s}` });
  }

  // --- three secret relics
  for (let r = 0; r < 3; r++) {
    const seg = segments[Math.floor(((r + 1) / 4) * segments.length)] ?? segments[0]!;
    items.push({ type: "relic", x: Math.min(width - 3, seg[0] + 10), y: 5 + r * 4, id: `relic-${world}-${level}-${r}` });
  }

  // --- world boss guarding the run-up to the flag
  const bossX = width - 16;
  // Gunner escort so the run-up to the boss keeps pressure on.
  if (world >= 3) enemies.push({ type: "lobber", x: bossX - 12, y: SURFACE - 1, direction: -1, patrol: 40 });
  enemies.push({ type: "boss", x: bossX, y: SURFACE - 1, variant: theme.id, patrol: 190, direction: -1 });

  const mid = segments[Math.floor(segments.length / 2)]!;
  const third = segments[Math.floor(segments.length / 3)]!;

  return {
    id: `${world}-${level}`,
    world,
    level,
    name: theme.name,
    timeLimit: 300 + index * 2,
    widthTiles: width,
    heightTiles: HEIGHT,
    tiles,
    spawn: { x: 3, y: SURFACE - 2 },
    goal: { x: width - 5, y: SURFACE - 1 },
    checkpoints: [
      { x: third[0] + 4, y: SURFACE - 1 },
      { x: mid[0] + 4, y: SURFACE - 1 },
    ],
    enemies,
    items,
    blocks,
    platforms,
    pipes,
    hazards,
    music: "level",
    ...(starsRequired ? { starsRequired } : {}),
    skyColor: theme.sky,
    buildSet: theme.buildSet,
    themeId: theme.id,
    bossRequired: true,
  };
}
