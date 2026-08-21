import type { LevelData, LevelObjective } from "../types";
import { GEM } from "../config";

const countCoins = (level: LevelData): number => level.items.filter((i) => i.type === "coin").length;

/** Enemies that stand on the main route and can actually be defeated. */
const beatableEnemies = (level: LevelData): number[] =>
  level.enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.type !== "piranha").map(({ i }) => i);

/** Every stage asks for the same simple thing: ten coins. */
export const COIN_GOAL = 10;

/** Gems pay out a coin bundle, so they count towards what a stage can give. */
const availableCoins = (level: LevelData): number =>
  countCoins(level) + level.items.filter((i) => i.type === "relic").length * GEM.coins;

function coinObjective(level: LevelData): LevelObjective {
  const target = Math.max(1, Math.min(availableCoins(level), COIN_GOAL));
  return {
    type: "COIN_TARGET",
    target,
    description: `Collect ${target} coins`,
    mandatory: false,
  };
}

const secretObjective: LevelObjective = {
  type: "FIND_SECRET",
  target: 1,
  description: "Find the hidden room",
  mandatory: false,
};

/**
 * Gives every stage a goal beyond "walk right". Objectives are derived from
 * what the level actually contains, so they are always achievable.
 */
export function assignObjectives(level: LevelData): LevelData {
  if (level.objectives) return level;
  // Stars are optional bonuses now - the one required goal is always coins.
  const coinPrimary = coinObjective(level);
  const extras: LevelObjective[] = [];
  if (level.boss) {
    const spare = Math.round(level.timeLimit * 0.3);
    extras.push({
      type: "TIME_LIMIT",
      timeLimit: spare,
      target: spare,
      description: `Defeat ${level.boss.name} with ${spare}s left`,
      mandatory: false,
    });
  }
  if (level.secretZone) extras.push(secretObjective);
  return {
    ...level,
    starsRequired: 0,
    objectives: { primary: coinPrimary, ...(extras.length ? { secondary: extras } : {}) },
    requiredEnemies: beatableEnemies(level),
  };
}
