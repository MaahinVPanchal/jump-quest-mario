import { describe, expect, it } from "vitest";
import { CHARACTERS } from "../data/characters";
import { LEVELS } from "../levels";
import { campaignClearance, heroClearance } from "./clearance";

describe("campaign clearance", () => {
  it("gives every hero a double jump", () => {
    for (const c of Object.values(CHARACTERS)) expect(`${c.id}:${c.canDoubleJump}`).toBe(`${c.id}:true`);
  });

  it("lets all ten heroes clear every stage in the road map", () => {
    for (const report of campaignClearance()) {
      expect(`${report.name} blocked: ${report.blockedStages.join(",")}`).toBe(`${report.name} blocked: `);
      expect(report.clearedStages).toBe(LEVELS.length);
    }
  });

  it("reports goal reachability and hidden bricks per stage", () => {
    const report = heroClearance(Object.values(CHARACTERS)[0]!);
    expect(report.stages).toHaveLength(LEVELS.length);
    for (const stage of report.stages) expect(stage.goalReachable).toBe(true);
    expect(report.stages.reduce((n, s) => n + s.hiddenBricks, 0)).toBeGreaterThan(0);
  });
});
