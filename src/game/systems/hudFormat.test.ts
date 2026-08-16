import { describe, expect, it } from "vitest";
import { formatCoins, formatCombo, formatLives, formatScore, formatTime, formatWorld } from "./hudFormat";

describe("HUD formatting", () => {
  it("zero-pads the score across every range", () => {
    expect(formatScore(0)).toBe("000000");
    expect(formatScore(7)).toBe("000007");
    expect(formatScore(1250)).toBe("001250");
    expect(formatScore(999999)).toBe("999999");
  });

  it("clamps out-of-range or invalid scores", () => {
    expect(formatScore(-50)).toBe("000000");
    expect(formatScore(1_500_000)).toBe("999999");
    expect(formatScore(Number.NaN)).toBe("000000");
    expect(formatScore(120.9)).toBe("000120");
  });

  it("keeps every score width identical", () => {
    for (let i = 0; i < 1000; i += 1) expect(formatScore(i * 997).length).toBe(6);
  });

  it("formats coins as xNN", () => {
    expect(formatCoins(0)).toBe("x00");
    expect(formatCoins(9)).toBe("x09");
    expect(formatCoins(42)).toBe("x42");
    expect(formatCoins(150)).toBe("x99");
    expect(formatCoins(-3)).toBe("x00");
    for (let c = 0; c <= 99; c += 1) expect(formatCoins(c).length).toBe(3);
  });

  it("formats time as 3 digits", () => {
    expect(formatTime(400)).toBe("400");
    expect(formatTime(30)).toBe("030");
    expect(formatTime(0)).toBe("000");
    expect(formatTime(-10)).toBe("000");
    expect(formatTime(1200)).toBe("999");
    for (let t = 0; t <= 999; t += 1) expect(formatTime(t).length).toBe(3);
  });

  it("formats lives as xNN and never goes negative", () => {
    expect(formatLives(3)).toBe("x03");
    expect(formatLives(0)).toBe("x00");
    expect(formatLives(-2)).toBe("x00");
    expect(formatLives(12)).toBe("x12");
  });

  it("keeps lives width stable across every range", () => {
    for (let l = -5; l <= 120; l += 1) expect(formatLives(l).length).toBe(3);
    expect(formatLives(999)).toBe("x99");
    expect(formatLives(Number.NaN)).toBe("x00");
    expect(formatLives(4.8)).toBe("x04");
  });

  it("keeps every HUD column aligned for mixed extreme values", () => {
    const cases: [number, number, number, number][] = [
      [0, 0, 0, 0],
      [5, 1, 9, 1],
      [12345, 42, 400, 3],
      [999999, 99, 999, 99],
      [-1, -1, -1, -1],
      [Number.NaN, Number.NaN, Number.NaN, Number.NaN],
    ];
    for (const [score, coins, time, lives] of cases) {
      const row = [formatScore(score), formatCoins(coins), formatWorld("1-1"), formatTime(time), formatLives(lives)];
      expect(row.map((cell) => cell.length)).toEqual([6, 3, 3, 3, 3]);
      expect(row.every((cell) => cell === cell.toUpperCase())).toBe(true);
      expect(row.some((cell) => cell.includes(" "))).toBe(false);
    }
  });

  it("uppercases the world label", () => {
    expect(formatWorld("1-1")).toBe("1-1");
    expect(formatWorld("emberleaf")).toBe("EMBERLEAF");
  });

  it("shows the combo only above 1x", () => {
    expect(formatCombo(1)).toBe("");
    expect(formatCombo(3)).toBe("COMBO x3");
  });
});
