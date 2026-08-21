import { describe, expect, it } from "vitest";
import { LEVELS } from "./index";
import { validateLevel } from "./validate";
import { BASELINE_PROFILE } from "../systems/movementProfile";

describe("campaign geometry", () => {
  it("has a sane movement envelope", () => {
    expect(BASELINE_PROFILE.safeJumpDistanceTiles).toBeGreaterThanOrEqual(3);
    expect(BASELINE_PROFILE.safeJumpHeightTiles).toBeGreaterThanOrEqual(2);
  });

  it("is fully repaired: a second validation pass finds nothing to fix", () => {
    for (const level of LEVELS) {
      const report = validateLevel(level);
      const blocking = report.issues.filter(
        (i) => i.kind === "gap-too-wide" || i.kind === "step-too-high" || i.kind === "goal-unsupported",
      );
      expect(blocking, `${level.id}: ${blocking.map((b) => b.detail).join("; ")}`).toEqual([]);
    }
  });

  it("gives every stage an objective with an achievable target", () => {
    for (const level of LEVELS) {
      const primary = level.objectives?.primary;
      expect(primary, level.id).toBeTruthy();
      if (primary?.type === "COIN_TARGET") {
        const coins =
          level.items.filter((i) => i.type === "coin").length +
          level.items.filter((i) => i.type === "relic").length * 10;
        expect(primary.target ?? 0, level.id).toBeLessThanOrEqual(coins);
      }
      if (primary?.type === "DEFEAT_ALL") {
        expect(primary.target ?? 0, level.id).toBeLessThanOrEqual(level.enemies.length);
      }
      if (primary?.type === "TIME_LIMIT") {
        expect(primary.timeLimit ?? 0, level.id).toBeLessThan(level.timeLimit);
      }
    }
  });

  it("scales the time limit to the length of the stage", () => {
    for (const level of LEVELS) {
      expect(level.timeLimit, level.id).toBeGreaterThan(level.widthTiles / 6);
    }
  });
});
