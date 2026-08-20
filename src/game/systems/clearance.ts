import { CHARACTERS } from "../data/characters";
import { LEVELS } from "../levels";
import { WORLDS } from "../levels/worlds";
import type { CharacterData, LevelData } from "../types";
import { analyzeLevelFor } from "./analyzer";
import { buildMovementProfile } from "./movementProfile";

/**
 * "Can this hero actually walk the whole road map?"
 *
 * The analyzer answers that per stage; this rolls the answer up per hero and
 * per world so a single call tells us whether every one of the ten heroes can
 * finish all 32 stages, and exactly which gap/pickup blocks them if not.
 */

export interface StageClearance {
  levelId: string;
  world: number;
  level: number;
  name: string;
  clearable: boolean;
  blockedGaps: number;
  widestGap: number;
  /** Gaps this hero cannot cross, described in tiles. */
  issues: string[];
  goalReachable: boolean;
  hiddenBricks: number;
  unreachableCoins: number;
}

export interface HeroClearance {
  characterId: string;
  name: string;
  jumpWidthTiles: number;
  jumpHeightTiles: number;
  stages: StageClearance[];
  clearedStages: number;
  blockedStages: string[];
  clearsCampaign: boolean;
}

function stageReport(character: CharacterData, level: LevelData): StageClearance {
  const world = WORLDS.find((w) => w.world === level.world);
  const profile = buildMovementProfile(character, world?.physics);
  const a = analyzeLevelFor(level, profile);
  const issues = a.gaps
    .filter((g) => !g.reachable)
    .map((g) => `gap ${g.widthTiles}t at x=${g.x0} (max ${profile.maxJumpDistanceTiles}t)`);
  if (!a.goal.reachable) issues.push(`goal ${a.goal.above}t above support`);
  return {
    levelId: level.id,
    world: level.world,
    level: level.level,
    name: level.name,
    clearable: issues.length === 0,
    blockedGaps: a.summary.blockedGaps,
    widestGap: a.summary.widestGap,
    issues,
    goalReachable: a.goal.reachable,
    hiddenBricks: a.blocks.filter((b) => b.label === "hidden").length,
    unreachableCoins: a.summary.unreachableCoins,
  };
}

export function heroClearance(character: CharacterData, levels: LevelData[] = LEVELS): HeroClearance {
  const profile = buildMovementProfile(character);
  const stages = levels.map((l) => stageReport(character, l));
  const blocked = stages.filter((s) => !s.clearable).map((s) => s.levelId);
  return {
    characterId: character.id,
    name: character.name,
    jumpWidthTiles: profile.maxJumpDistanceTiles,
    jumpHeightTiles: profile.maxJumpHeightTiles,
    stages,
    clearedStages: stages.length - blocked.length,
    blockedStages: blocked,
    clearsCampaign: blocked.length === 0,
  };
}

export function campaignClearance(levels: LevelData[] = LEVELS): HeroClearance[] {
  return Object.values(CHARACTERS).map((c) => heroClearance(c, levels));
}

/** Compact console-friendly table used by the dev analyzer. */
export function clearanceSummary(levels: LevelData[] = LEVELS): string {
  return campaignClearance(levels)
    .map(
      (h) =>
        `${h.name.padEnd(8)} jump ${String(h.jumpWidthTiles).padStart(2)}t/${h.jumpHeightTiles}t  ` +
        `${h.clearedStages}/${h.stages.length} stages` +
        (h.clearsCampaign ? "  OK" : `  BLOCKED: ${h.blockedStages.join(", ")}`),
    )
    .join("\n");
}
