import type { LevelData, LevelObjective, LevelObjectives } from "../types";

const countCoins = (level: LevelData): number => level.items.filter((i) => i.type === "coin").length;

/** Enemies that stand on the main route and can actually be defeated. */
const beatableEnemies = (level: LevelData): number[] =>
  level.enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.type !== "piranha").map(({ i }) => i);

function coinObjective(level: LevelData): LevelObjective {
  // 60% of what the stage actually contains, so the target is always fair.
  const target = Math.max(5, Math.round(countCoins(level) * 0.6));
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
  const identity = (level.identity ?? "").toLowerCase();
  const hasWater = (level.zones ?? []).some((z) => z.kind === "water" || z.kind === "current");
  const secondary: LevelObjective[] = [];
  let primary: LevelObjective;

  if (level.boss) {
    const spare = Math.round(level.timeLimit * 0.3);
    primary = {
      type: "TIME_LIMIT",
      timeLimit: spare,
      target: spare,
      description: `Defeat ${level.boss.name} with ${spare}s left`,
      mandatory: false,
    };
    secondary.push(coinObjective(level));
  } else if (identity.includes("hanging") || (hasWater && identity.includes("no"))) {
    primary = {
      type: "NO_WATER",
      target: 0,
      description: hasWater ? "Never touch the water" : "Never touch the forest floor",
      mandatory: false,
    };
    secondary.push(coinObjective(level));
  } else if (hasWater && !identity.includes("water")) {
    primary = coinObjective(level);
    secondary.push(timeObjective(level, 0.5));
  } else {
    switch (level.level % 3) {
      case 1:
        primary = coinObjective(level);
        secondary.push(timeObjective(level, 0.5));
        break;
      case 2:
        primary = defeatObjective(level);
        secondary.push(coinObjective(level));
        break;
      default:
        primary = timeObjective(level, 0.55);
        secondary.push(coinObjective(level));
    }
  }

  if (level.secretZone) secondary.push(secretObjective);
  const objectives: LevelObjectives = { primary, ...(secondary.length ? { secondary } : {}) };
  return { ...level, objectives, requiredEnemies: beatableEnemies(level) };
}
