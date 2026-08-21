import { beforeEach, describe, expect, it } from "vitest";
import { applyResult, emptySave, loadSlot, saveSlot } from "./save";
import type { LevelResult } from "../types";

const result: LevelResult = {
  levelId: "1-1",
  score: 1200,
  coins: 10,
  relics: 0,
  relicIds: [],
  enemies: 2,
  timeLeft: 120,
  timeTaken: 80,
  damageTaken: 0,
  stars: 0,
  rank: "A",
};

describe("campaign rewards", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    const api = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, String(value));
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    };
    Object.defineProperty(globalThis, "localStorage", { value: api, configurable: true });
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: api },
      configurable: true,
    });
  });

  it("awards persistent coins once per stage while preserving replay records", () => {
    const first = applyResult(emptySave(), result);
    const replay = applyResult(first, { ...result, score: 2400, timeTaken: 60 });
    expect(first.coins).toBe(10);
    expect(replay.coins).toBe(10);
    expect(replay.bestScores["1-1"]).toBe(2400);
    expect(replay.bestTimes["1-1"]).toBe(60);
  });

  it("stores progress under a stable guest id so different guests do not overwrite each other", () => {
    const guestA = "guest-alpha";
    const guestB = "guest-beta";

    localStorage.setItem("emberleaf.guest.id", guestA);
    const a = emptySave("Guest A");
    a.currentLevelId = "1-4";
    saveSlot(1, a);

    localStorage.setItem("emberleaf.guest.id", guestB);
    const b = emptySave("Guest B");
    b.currentLevelId = "2-3";
    saveSlot(1, b);

    localStorage.setItem("emberleaf.guest.id", guestA);
    expect(loadSlot(1)?.currentLevelId).toBe("1-4");

    localStorage.setItem("emberleaf.guest.id", guestB);
    expect(loadSlot(1)?.currentLevelId).toBe("2-3");
  });
});