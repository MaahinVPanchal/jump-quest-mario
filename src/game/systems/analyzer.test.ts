import { describe, expect, it } from "vitest";
import { LEVELS } from "../levels";
import { CHARACTERS } from "../data/characters";
import { analyzeLevelFor } from "./analyzer";
import { buildMovementProfile, BASELINE_PROFILE } from "./movementProfile";
import { brickTuning } from "../levels/brickDifficulty";

describe("level analyzer", () => {
  it("finds no blocked gaps for the baseline hero on any stage", () => {
    for (const level of LEVELS) {
      const report = analyzeLevelFor(level, BASELINE_PROFILE);
      expect(`${level.id}:${report.summary.blockedGaps}`).toBe(`${level.id}:0`);
    }
  });

  it("analyzes every stage for every hero without blocked gaps", () => {
    for (const character of Object.values(CHARACTERS)) {
      const profile = buildMovementProfile(character);
      for (const level of LEVELS) {
        expect(analyzeLevelFor(level, profile).summary.blockedGaps).toBe(0);
      }
    }
  });

  it("reports the secret zone and checkpoints when present", () => {
    const withSecret = LEVELS.find((l) => l.secretZone);
    expect(withSecret).toBeTruthy();
    const report = analyzeLevelFor(withSecret!);
    expect(report.secret).toBeTruthy();
    expect(report.checkpoints.length).toBeGreaterThan(0);
  });
});

describe("brick difficulty", () => {
  it("escalates brick density with the world number", () => {
    expect(brickTuning(1).clusters).toBeLessThan(brickTuning(8).clusters);
    expect(brickTuning(1).maxStack).toBeLessThan(brickTuning(8).maxStack);
  });

  it("gives later worlds more blocks per stage on average", () => {
    const avg = (world: number) => {
      const stages = LEVELS.filter((l) => l.world === world);
      return stages.reduce((n, l) => n + l.blocks.length, 0) / stages.length;
    };
    expect(avg(8)).toBeGreaterThan(avg(1));
  });
});
