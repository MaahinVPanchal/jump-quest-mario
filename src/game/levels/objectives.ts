import type { LevelData, LevelObjective, LevelObjectives } from "../types";

const countCoins = (level: LevelData): number => level.items.filter((i) => i.type === "coin").length;

/** Enemies that stand on the main route and can actually be defeated. */
const beatableEnemies = (level: LevelData): number[] =>
  level.enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.type !== "piranha").map(({ i }) => i);

/** Every stage asks for the same simple thing: ten coins. */
export const COIN_GOAL = 10;

function coinObjective(level: LevelData): LevelObjective {
  const target = Math.max(1, Math.min(countCoins(level), COIN_GOAL));
  return {
    type: "COIN_TARGET",
    target,
    description: `Collect ${target} coins`,
    mandatory: false,
  };
}

function defeatObjective(level: LevelData): LevelObjective {
  const target = Math.max(1, Math.round(beatableEnemies(level).length * 0.8));
  return {
    type: "DEFEAT_ALL",
    target,
    description: `Defeat ${target} enemies`,
    mandatory: false,
  };
}

function timeObjective(level: LevelData, share = 0.6): LevelObjective {
  const limit = Math.round(level.timeLimit * share);
  return {
    type: "TIME_LIMIT",
    timeLimit: limit,
    target: limit,
    description: `Reach the goal with ${limit}s left`,
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
  const coinsAvailable = countCoins(level);
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
