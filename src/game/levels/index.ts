import type { LevelData } from "../types";
import { LEVEL_1 } from "./level1";
import { LEVEL_2 } from "./level2";

export const LEVELS: LevelData[] = [LEVEL_1, LEVEL_2];

export const FIRST_LEVEL_ID = LEVEL_1.id;

export function getLevel(id: string): LevelData {
  return LEVELS.find((l) => l.id === id) ?? LEVEL_1;
}

export function nextLevelId(id: string): string | null {
  const level = getLevel(id);
  if (level.next) return level.next;
  const index = LEVELS.findIndex((l) => l.id === id);
  return LEVELS[index + 1]?.id ?? null;
}
