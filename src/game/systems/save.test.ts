import { describe, expect, it } from "vitest";
import { applyResult, emptySave } from "./save";
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
  it("awards persistent coins once per stage while preserving replay records", () => {
    const first = applyResult(emptySave(), result);
    const replay = applyResult(first, { ...result, score: 2400, timeTaken: 60 });
    expect(first.coins).toBe(10);
    expect(replay.coins).toBe(10);
    expect(replay.bestScores["1-1"]).toBe(2400);
    expect(replay.bestTimes["1-1"]).toBe(60);
  });
});