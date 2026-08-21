import type { LevelResult, SaveData } from "../types";
import { RULES } from "../config";
import { CHARACTERS } from "../data/characters";
import { FIRST_LEVEL_ID } from "../levels";

const KEY_PREFIX = "emberleaf.save.slot";
const GUEST_ID_KEY = "emberleaf.guest.id";
export const SAVE_VERSION = 1;
export const SLOT_COUNT = 3;

export function getGuestId(): string {
  if (typeof window === "undefined") return "guest";
  let guestId = window.localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = (globalThis.crypto && "randomUUID" in globalThis.crypto)
      ? `guest-${crypto.randomUUID()}`
      : `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

function guestSlotKey(slot: number): string {
  return `${KEY_PREFIX}.${getGuestId()}.${slot}`;
}

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
    currentLevelId: FIRST_LEVEL_ID,
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
    currentLevelId: raw.currentLevelId ?? FIRST_LEVEL_ID,
    save_version: SAVE_VERSION,
  };
}

export function loadSlot(slot: number): SaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(guestSlotKey(slot));
    if (!raw) return null;
    return migrate(JSON.parse(raw) as SaveData);
  } catch {
    return null;
  }
}

export function saveSlot(slot: number, data: SaveData): void {
  if (typeof window === "undefined") return;
  try {
    const guestId = getGuestId();
    window.localStorage.setItem(GUEST_ID_KEY, guestId);
    window.localStorage.setItem(
      guestSlotKey(slot),
      JSON.stringify({ ...data, lastPlayed: Date.now() }),
    );
  } catch {
    /* storage full or blocked - gameplay continues without persistence */
  }
}

export function deleteSlot(slot: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(guestSlotKey(slot));
}

export function listSlots(): (SaveData | null)[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadSlot(i + 1));
}

export function applyResult(save: SaveData, result: LevelResult): SaveData {
  const firstClear = !save.completedLevels.includes(result.levelId);
  const completed = save.completedLevels.includes(result.levelId)
    ? save.completedLevels
    : [...save.completedLevels, result.levelId];
  const unlocked = new Set(save.unlockedCharacters);
  for (const character of Object.values(CHARACTERS)) {
    if (character.unlockedBy && completed.includes(character.unlockedBy)) unlocked.add(character.id);
  }
  const next: SaveData = {
    ...save,
    coins: save.coins + (firstClear ? result.coins : 0),
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
