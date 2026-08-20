import type { LevelData } from "../types";
import { buildCampaign } from "./campaign";
import { WORLDS, getWorld } from "./worlds";

/** Four hand-designed stages per world, eight worlds, 32 stages total. */
export const WORLD_SIZES = [4, 4, 4, 4, 4, 4, 4, 4];

export const LEVELS: LevelData[] = buildCampaign();

export { WORLDS, getWorld };

/** Legacy alias kept for the briefing UI. */
export const WORLD_THEMES = WORLDS;

export const FIRST_LEVEL_ID = LEVELS[0]!.id;

export function getLevel(id: string): LevelData {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]!;
}

export function levelIndex(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}

export function nextLevelId(id: string): string | null {
  const index = levelIndex(id);
  return LEVELS[index + 1]?.id ?? null;
}

export function levelsOfWorld(world: number): LevelData[] {
  return LEVELS.filter((l) => l.world === world);
}

/** A stage is playable once the previous stage has been cleared. */
export function isLevelUnlocked(id: string, completed: readonly string[]): boolean {
  const index = levelIndex(id);
  if (index <= 0) return true;
  return completed.includes(LEVELS[index - 1]!.id);
}
