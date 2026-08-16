import type { LevelData } from "../types";
import { LEVEL_1 } from "./level1";
import { buildLevel, WORLD_THEMES } from "./generate";
import { STAGE_THEMES } from "./themes";

/** Ten hand-themed stages, one per world. */
export const WORLD_SIZES = STAGE_THEMES.map(() => 1);

function buildCampaign(): LevelData[] {
  const out: LevelData[] = [];
  STAGE_THEMES.forEach((theme) => {
    if (theme.world === 1) out.push({ ...LEVEL_1, themeId: theme.id, buildSet: theme.buildSet });
    else out.push(buildLevel(theme.world, 1));
  });
  // Chain each stage to the next so completing one unlocks the following one.
  out.forEach((level, i) => {
    const next = out[i + 1];
    if (next) level.next = next.id;
    else delete level.next;
  });
  return out;
}

export const LEVELS: LevelData[] = buildCampaign();

export { WORLD_THEMES };

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

/** A stage is playable once the previous stage has been cleared. */
export function isLevelUnlocked(id: string, completed: readonly string[]): boolean {
  const index = levelIndex(id);
  if (index <= 0) return true;
  return completed.includes(LEVELS[index - 1]!.id);
}
