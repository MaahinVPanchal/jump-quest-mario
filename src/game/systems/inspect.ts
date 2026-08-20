import type { BlockKind, EnemyKind, ItemKind, LevelData } from "../types";
import { WORLDS } from "../levels/worlds";
import { traverse } from "../levels/traverse";
import { analyzeLevelFor } from "./analyzer";
import { buildMovementProfile } from "./movementProfile";
import { CHARACTERS } from "../data/characters";
import type { CharacterData } from "../types";

/**
 * Stage inspector data.
 *
 * Two halves: what a stage is *built out of* (brick/block aggregation, tile
 * counts, populations) and what each hero can actually *reach* in it (gaps,
 * coins, checkpoints, secret, goal). Pure data — the panel just renders it.
 */

export interface StageComposition {
  /** Solid terrain tiles by kind. */
  tiles: { top: number; dirt: number; stone: number; solid: number; empty: number };
  /** Percentage of the grid that is solid terrain, 0-100. */
  density: number;
  /** Interactive blocks by kind, e.g. brick / question / hidden. */
  blocks: Record<string, number>;
  blockTotal: number;
  /** Bricks and blocks per 100 tiles of stage width — the "aggregation" read. */
  blocksPerHundred: number;
  items: Record<string, number>;
  itemTotal: number;
  enemies: Record<string, number>;
  enemyTotal: number;
  hazards: number;
  platforms: number;
  pipes: number;
  checkpoints: number;
  zones: Record<string, number>;
  hasSecret: boolean;
  hasBoss: boolean;
  widthTiles: number;
  heightTiles: number;
}

export interface ReachTally {
  total: number;
  reachable: number;
  unreachable: number;
  /** Up to eight offending coordinates, for the panel's detail list. */
  misses: { x: number; y: number; label?: string; detail?: string }[];
}

export interface HeroReach {
  heroId: string;
  heroName: string;
  jumpTiles: { width: number; height: number };
  gaps: ReachTally;
  widestGap: number;
  coins: ReachTally;
  stars: ReachTally;
  relics: ReachTally;
  checkpoints: ReachTally;
  blocks: ReachTally;
  secret: { present: boolean; reachable: boolean };
  goalReachable: boolean;
  /** Full spawn-to-flag walk, including walls and ceilings. */
  routeClear: boolean;
  routeNote: string;
}

export interface StageInspection {
  levelId: string;
  world: number;
  level: number;
  name: string;
  objective: string;
  composition: StageComposition;
  heroes: HeroReach[];
  /** Heroes who cannot walk the stage end to end. */
  blockedHeroes: string[];
}

const BLOCK_LABELS: Record<BlockKind, string> = {
  brick: "Brick",
  question: "Question",
  hidden: "Hidden",
  metal: "Metal",
  falling: "Falling",
  ice: "Ice",
} as Record<BlockKind, string>;

export const blockLabel = (kind: string): string => BLOCK_LABELS[kind as BlockKind] ?? kind;

function tally(
  points: { x: number; y: number; reachable: boolean; above?: number; label?: string }[],
): ReachTally {
  const misses = points.filter((p) => !p.reachable);
  return {
    total: points.length,
    reachable: points.length - misses.length,
    unreachable: misses.length,
    misses: misses.slice(0, 8).map((p) => ({
      x: p.x,
      y: p.y,
      ...(p.label ? { label: p.label } : {}),
      ...(p.above !== undefined && Number.isFinite(p.above) ? { detail: `${p.above}t above support` } : {}),
    })),
  };
}

export function stageComposition(level: LevelData): StageComposition {
  const counts = { top: 0, dirt: 0, stone: 0, solid: 0, empty: 0 };
  for (const row of level.tiles) {
    for (const t of row) {
      if (t === 0) counts.empty++;
      else {
        counts.solid++;
        if (t === 1) counts.top++;
        else if (t === 2) counts.dirt++;
        else counts.stone++;
      }
    }
  }
  const cells = level.widthTiles * level.heightTiles || 1;

  const bucket = <T extends string>(list: { [k: string]: unknown }[], key: string): Record<T, number> => {
    const out = {} as Record<string, number>;
    for (const entry of list) {
      const k = String(entry[key] ?? "other");
      out[k] = (out[k] ?? 0) + 1;
    }
    return out as Record<T, number>;
  };

  const blocks = bucket<BlockKind>(level.blocks as unknown as { [k: string]: unknown }[], "kind");
  const items = bucket<ItemKind>(level.items as unknown as { [k: string]: unknown }[], "type");
  const enemies = bucket<EnemyKind>(level.enemies as unknown as { [k: string]: unknown }[], "type");
  const zones = bucket(level.zones as unknown as { [k: string]: unknown }[], "kind");

  const blockTotal = level.blocks.length;
  return {
    tiles: counts,
    density: Math.round((counts.solid / cells) * 1000) / 10,
    blocks,
    blockTotal,
    blocksPerHundred: Math.round((blockTotal / Math.max(1, level.widthTiles)) * 1000) / 10,
    items,
    itemTotal: level.items.length,
    enemies,
    enemyTotal: level.enemies.length,
    hazards: level.hazards.length,
    platforms: level.platforms.length,
    pipes: level.pipes.length,
    checkpoints: level.checkpoints?.length ?? 0,
    zones,
    hasSecret: Boolean(level.secretZone),
    hasBoss: Boolean(level.boss),
    widthTiles: level.widthTiles,
    heightTiles: level.heightTiles,
  };
}

export function heroReach(level: LevelData, hero: CharacterData): HeroReach {
  const physics = WORLDS.find((w) => w.world === level.world)?.physics;
  const profile = buildMovementProfile(hero, physics);
  const a = analyzeLevelFor(level, profile);
  const route = traverse(level, profile);

  const byType = (type: string) => a.coins.filter((c) => c.label === type);
  const gapPoints = a.gaps.map((g) => ({
    x: g.x0,
    y: g.y,
    reachable: g.reachable,
    label: `${g.widthTiles}t gap${g.bridged ? " (platform)" : ""}`,
  }));

  return {
    heroId: hero.id,
    heroName: hero.name,
    jumpTiles: { width: profile.maxJumpDistanceTiles, height: profile.maxJumpHeightTiles },
    gaps: tally(gapPoints),
    widestGap: a.summary.widestGap,
    coins: tally(byType("coin")),
    stars: tally(byType("star")),
    relics: tally(byType("relic")),
    checkpoints: tally(a.checkpoints),
    blocks: tally(a.blocks),
    secret: { present: Boolean(a.secret), reachable: a.secret?.reachable ?? false },
    goalReachable: a.goal.reachable,
    routeClear: route.reachable,
    routeNote: route.reachable
      ? `walkable · ${route.nodes.length} stands`
      : (route.reason ?? "blocked"),
  };
}

export function inspectStage(level: LevelData, heroes = Object.values(CHARACTERS)): StageInspection {
  const reach = heroes.map((h) => heroReach(level, h));
  return {
    levelId: level.id,
    world: level.world,
    level: level.level,
    name: level.name,
    objective: level.objectives?.primary.description ?? level.objective ?? "Reach the goal flag.",
    composition: stageComposition(level),
    heroes: reach,
    blockedHeroes: reach.filter((r) => !r.routeClear || !r.goalReachable).map((r) => r.heroName),
  };
}
