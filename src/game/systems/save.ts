import type { LevelResult, SaveData } from "../types";
import { RULES } from "../config";
import { CHARACTERS } from "../data/characters";

const KEY_PREFIX = "emberleaf.save.slot";
export const SAVE_VERSION = 1;
export const SLOT_COUNT = 3;

export function emptySave(name = "Player"): SaveData {
  return {
    save_version: SAVE_VERSION,
    name,
    createdAt: Date.now(),
    lastPlayed: Date.now(),
    playTimeMs: 0,
    coins: 0,
    lives: RULES.startingLives,
    completedLevels: [],
    bestScores: {},
    bestTimes: {},
    levelStars: {},
    starIds: [],
    relics: [],
    unlockedCharacters: ["riko"],
    settings: { master: 0.8, music: 0.5, sfx: 0.8, screenShake: true, pixelPerfect: true },
  };
}

/** Forward-migrates older save payloads to the current schema. */
function migrate(raw: Partial<SaveData> & { save_version?: number }): SaveData {
  const base = emptySave(raw.name ?? "Player");
  return {
    ...base,
    ...raw,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    levelStars: { ...base.levelStars, ...(raw.levelStars ?? {}) },
    starIds: raw.starIds ?? [],
    save_version: SAVE_VERSION,
  };
}

export function loadSlot(slot: number): SaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}${slot}`);
    if (!raw) return null;
    return migrate(JSON.parse(raw) as SaveData);
  } catch {
    return null;
  }
}

export function saveSlot(slot: number, data: SaveData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${KEY_PREFIX}${slot}`,
      JSON.stringify({ ...data, lastPlayed: Date.now() }),
    );
  } catch {
    /* storage full or blocked - gameplay continues without persistence */
  }
}

export function deleteSlot(slot: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${KEY_PREFIX}${slot}`);
}

export function listSlots(): (SaveData | null)[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadSlot(i + 1));
}

export function applyResult(save: SaveData, result: LevelResult): SaveData {
  const completed = save.completedLevels.includes(result.levelId)
    ? save.completedLevels
    : [...save.completedLevels, result.levelId];
  const unlocked = new Set(save.unlockedCharacters);
  for (const character of Object.values(CHARACTERS)) {
    if (character.unlockedBy && completed.includes(character.unlockedBy)) unlocked.add(character.id);
  }
  const next: SaveData = {
    ...save,
    coins: save.coins + result.coins,
    completedLevels: completed,
    unlockedCharacters: Array.from(unlocked),
    bestScores: {
      ...save.bestScores,
      [result.levelId]: Math.max(save.bestScores[result.levelId] ?? 0, result.score),
    },
    bestTimes: {
      ...save.bestTimes,
      [result.levelId]: Math.min(
        save.bestTimes[result.levelId] ?? Number.MAX_SAFE_INTEGER,
        result.timeTaken,
      ),
    },
    relics: Array.from(new Set([...save.relics, ...result.relicIds])),
    levelStars: {
      ...save.levelStars,
      [result.levelId]: Math.max(save.levelStars[result.levelId] ?? 0, result.stars),
    },
  };
  return next;
}
