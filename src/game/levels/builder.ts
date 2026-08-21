import type {
  BlockKind,
  BlockSpawn,
  BossDefinition,
  EnemyKind,
  EnemySpawn,
  ItemKind,
  ItemSpawn,
  LevelData,
  MovingPlatformSpawn,
  PipeSpawn,
  Vec2,
  ZoneKind,
  ZoneSpawn,
  SecretZone,
} from "../types";
import { getWorld } from "./worlds";

/** Tile indices understood by the renderer. */
export const T = { EMPTY: 0, TOP: 1, DIRT: 2, STONE: 3 } as const;

export interface BuildMeta {
  world: number;
  level: number;
  name: string;
  /** One-line gameplay identity, e.g. "vertical climb". */
  identity: string;
  /** Optional stage objective shown on the loading card. */
  objective?: string;
  widthTiles: number;
  heightTiles?: number;
  timeLimit?: number;
  starsRequired?: number;
}

/**
 * Composable geometry primitives. Levels are described as data through these
 * helpers, so new worlds/levels never require engine changes.
 */
export class LevelBuilder {
  readonly width: number;
  readonly height: number;
  readonly surface: number;
  readonly tiles: number[][];
  readonly items: ItemSpawn[] = [];
  readonly blocks: BlockSpawn[] = [];
  readonly enemies: EnemySpawn[] = [];
  readonly platforms: MovingPlatformSpawn[] = [];
  readonly pipes: PipeSpawn[] = [];
  readonly hazards: Vec2[] = [];
  readonly zones: ZoneSpawn[] = [];
  readonly checkpoints: Vec2[] = [];
  spawn: Vec2;
  goal: Vec2;
  boss?: BossDefinition;
  /** Hidden bonus region, used by the FIND_SECRET objective. */
  secret?: SecretZone;
  private uid = 0;

  constructor(width: number, height = 24) {
    this.width = width;
    this.height = height;
    this.surface = height - 5;
    this.tiles = Array.from({ length: height }, () => new Array<number>(width).fill(0));
    this.spawn = { x: 3, y: this.surface - 2 };
    this.goal = { x: width - 6, y: this.surface - 1 };
  }

  // ------------------------------------------------------------- geometry

  fill(x0: number, x1: number, y0: number, y1: number, idx: number = T.STONE): this {
    for (let y = Math.max(0, y0); y <= Math.min(this.height - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(this.width - 1, x1); x++) this.tiles[y]![x] = idx;
    return this;
  }

  /** Solid ground slab with a grass/top cap. */
  ground(x0: number, x1: number, top = this.surface): this {
    this.fill(x0, x1, top, top, T.TOP);
    this.fill(x0, x1, top + 1, this.height - 1, T.DIRT);
    return this;
  }

  /** Alternating slabs and pits across a span. */
  brokenGround(x0: number, x1: number, runMin: number, runMax: number, gap: number, top = this.surface): this {
    let x = x0;
    let i = 0;
    while (x < x1) {
      const run = runMin + ((i * 7) % Math.max(1, runMax - runMin + 1));
      const end = Math.min(x1, x + run);
      this.ground(x, end, top);
      x = end + gap + (i % 2);
      i++;
    }
    return this;
  }

  /** Ascending or descending staircase of solid blocks. */
  stairs(x: number, baseY: number, steps: number, dir: 1 | -1 = 1, idx: number = T.STONE): this {
    for (let s = 0; s < steps; s++) {
      const sx = x + s * dir;
      this.fill(sx, sx, baseY - s, baseY, idx);
    }
    return this;
  }

  /** Free-floating ledge. */
  ledge(x: number, y: number, w: number, idx: number = T.TOP): this {
    this.fill(x, x + w - 1, y, y, idx);
    return this;
  }

  /** Thin plank bridge with support posts at both ends. */
  bridge(x0: number, x1: number, y: number): this {
    this.fill(x0, x1, y, y, T.TOP);
    this.fill(x0, x0, y + 1, y + 2, T.STONE);
    this.fill(x1, x1, y + 1, y + 2, T.STONE);
    return this;
  }

  /** Zig-zag of short ledges climbing upward. */
  zigzag(x: number, y: number, count: number, dx = 4, dy = 3, w = 3): this {
    for (let i = 0; i < count; i++) {
      const sx = x + (i % 2 === 0 ? 0 : dx);
      this.ledge(sx, y - i * dy, w);
    }
    return this;
  }

  /**
   * Vertical shaft with alternating wall ledges to climb.
   * The shaft always stands on solid ground (never over an abyss) and both
   * walls keep a walk-through doorway — entry at the bottom, exit at the top —
   * so a shaft is something you climb through, never a dead end.
   */
  shaft(x: number, yTop: number, yBottom: number, wallW = 2, step = 3, w = 3): this {
    const left = x - wallW;
    const rightStart = x + 8;
    const rightEnd = x + 8 + wallW - 1;
    // Solid floor under the whole footprint plus a run-up on either side.
    this.ground(left - 5, rightEnd + 5, yBottom);
    this.fill(left, x - 1, yTop, yBottom - 1, T.STONE);
    this.fill(rightStart, rightEnd, yTop, yBottom - 1, T.STONE);
    // Entry doorway at the foot of the left wall (walk straight in).
    this.fill(left, x - 1, yBottom - 3, yBottom - 1, T.EMPTY);
    // Exit doorway at the head of the right wall.
    this.fill(rightStart, rightEnd, yTop + 1, yTop + 3, T.EMPTY);
    this.ledge(rightEnd + 1, yTop + 4, w + 2);
    let side = 0;
    for (let y = yBottom - step; y > yTop + 1; y -= step) {
      this.ledge(side % 2 === 0 ? x : x + 8 - w, y, w);
      side++;
    }
    // A landing ledge right at the exit door so the last hop is never blind.
    this.ledge(x + 8 - w, yTop + 3, w);
    return this;
  }



  /** Tower of stacked blocks with a flat roof. */
  tower(x: number, baseY: number, height: number, w = 3): this {
    this.fill(x, x + w - 1, baseY - height, baseY, T.STONE);
    this.fill(x - 1, x + w, baseY - height, baseY - height, T.TOP);
    return this;
  }

  /** Row of small floating islands. */
  islands(x: number, y: number, count: number, gap = 5, w = 3, drop = 0): this {
    for (let i = 0; i < count; i++) this.ledge(x + i * (w + gap), y + i * drop, w);
    return this;
  }

  /** Ceiling band, useful for tunnels and forge corridors. */
  ceiling(x0: number, x1: number, y: number, thickness = 2): this {
    this.fill(x0, x1, y, y + thickness - 1, T.STONE);
    return this;
  }

  /** Arch: two pillars and a spanning roof. */
  arch(x: number, baseY: number, height: number, span: number): this {
    this.fill(x, x, baseY - height, baseY, T.STONE);
    this.fill(x + span, x + span, baseY - height, baseY, T.STONE);
    this.fill(x, x + span, baseY - height, baseY - height, T.TOP);
    return this;
  }

  // ---------------------------------------------------------- populating

  coins(x: number, y: number, count = 1, step = 1): this {
    for (let i = 0; i < count; i++) this.items.push({ type: "coin", x: x + i * step, y });
    return this;
  }

  /** Coins along an arc, reading as a jump path. */
  coinArc(x: number, y: number, count = 5): this {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      this.items.push({ type: "coin", x: x + i, y: Math.round(y - Math.sin(t * Math.PI) * 3) });
    }
    return this;
  }

  item(type: ItemKind, x: number, y: number): this {
    this.items.push({ type, x, y, id: `${type}-${x}-${y}-${this.uid++}` });
    return this;
  }

  star(x: number, y: number, world: number, level: number): this {
    this.items.push({ type: "star", x, y, id: `star-${world}-${level}-${this.uid++}` });
    return this;
  }

  relic(x: number, y: number, world: number, level: number): this {
    this.items.push({ type: "relic", x, y, id: `relic-${world}-${level}-${this.uid++}` });
    return this;
  }

  block(kind: BlockKind, x: number, y: number, contains?: ItemKind, coins?: number): this {
    this.blocks.push({ kind, x, y, ...(contains ? { contains } : {}), ...(coins ? { coins } : {}) });
    return this;
  }

  blockRow(kind: BlockKind, x: number, y: number, count: number): this {
    for (let i = 0; i < count; i++) this.block(kind, x + i, y);
    return this;
  }

  enemy(type: EnemyKind, x: number, y: number, patrol = 110, direction: -1 | 1 = -1): this {
    this.enemies.push({ type, x, y, patrol, direction });
    return this;
  }

  /** Sprinkle a world's enemy mix across a span at ground height. */
  patrol(types: EnemyKind[], x0: number, x1: number, count: number, y = this.surface - 1): this {
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length]!;
      const x = Math.round(x0 + ((x1 - x0) * (i + 1)) / (count + 1));
      this.enemy(type, x, type === "flyer" ? y - 5 : y, 90 + (i % 3) * 40, i % 2 ? 1 : -1);
    }
    return this;
  }

  platform(x: number, y: number, widthTiles: number, motion: { dx?: number; dy?: number }, duration = 2400): this {
    this.platforms.push({ x, y, widthTiles, ...motion, duration });
    return this;
  }

  hazard(x: number, y: number, count = 1): this {
    for (let i = 0; i < count; i++) this.hazards.push({ x: x + i, y });
    return this;
  }

  /** Lava / water pool: hazard band plus its environment zone. */
  pool(kind: ZoneKind, x0: number, x1: number, yTop: number, yBottom = this.height - 1, force?: number): this {
    this.zones.push({ kind, x: x0, y: yTop, w: x1 - x0 + 1, h: yBottom - yTop + 1, ...(force ? { force } : {}) });
    if (kind === "lava") for (let x = x0; x <= x1; x++) this.hazards.push({ x, y: yTop });
    return this;
  }

  zone(kind: ZoneKind, x: number, y: number, w: number, h: number, force?: number): this {
    this.zones.push({ kind, x, y, w, h, ...(force ? { force } : {}) });
    return this;
  }

  pipe(x: number, y: number, target: Vec2, label: string): this {
    this.pipes.push({ x, y, target, label });
    return this;
  }

  checkpoint(x: number, y = this.surface - 1): this {
    this.checkpoints.push({ x, y });
    return this;
  }

  /** Hidden bonus pocket carved under the floor, reached by a pipe. */
  secretRoom(x: number, y: number, w = 8, reward: ItemKind = "oneUp"): this {
    this.fill(x - 1, x + w, y - 1, y + 2, T.EMPTY);
    this.fill(x - 1, x + w, y + 2, y + 2, T.STONE);
    this.coins(x, y, w - 1);
    this.item(reward, x + Math.floor(w / 2), y - 1);
    this.secret = { x: x - 1, y: y - 1, w: w + 2, h: 4, label: "Hidden room" };
    return this;
  }

  setBoss(kind: BossDefinition["kind"], name: string, health: number, x: number, y: number): this {
    this.boss = { kind, name, health, x, y };
    return this;
  }

  // -------------------------------------------------------------- output

  build(meta: BuildMeta): LevelData {
    const world = getWorld(meta.world);
    return {
      id: `${meta.world}-${meta.level}`,
      world: meta.world,
      level: meta.level,
      name: meta.name,
      identity: meta.identity,
      ...(meta.objective ? { objective: meta.objective } : {}),
      timeLimit: meta.timeLimit ?? 320,
      widthTiles: this.width,
      heightTiles: this.height,
      tiles: this.tiles,
      spawn: this.spawn,
      goal: this.goal,
      checkpoints: this.checkpoints,
      enemies: this.enemies,
      items: this.items,
      blocks: this.blocks,
      platforms: this.platforms,
      pipes: this.pipes,
      hazards: this.hazards,
      zones: this.zones,
      physics: world.physics,
      music: "level",
      ...(meta.starsRequired ? { starsRequired: meta.starsRequired } : {}),
      ...(this.boss ? { boss: this.boss } : {}),
      ...(this.secret ? { secretZone: this.secret } : {}),
      skyColor: world.skyColor,
      buildSet: world.buildSet,
    };
  }
}
