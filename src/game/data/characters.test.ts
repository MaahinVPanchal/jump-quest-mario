import { describe, expect, it } from "vitest";
import { CHARACTERS, ROSTER } from "./characters";

const EXPECTED = ["riko", "miko", "volt", "blade", "aegis", "shin", "cinder", "frost", "aero", "titan"];

describe("roster", () => {
  it("has exactly the ten playable heroes", () => {
    expect(ROSTER).toHaveLength(10);
    expect(Object.keys(CHARACTERS).sort()).toEqual([...EXPECTED].sort());
  });

  it("gives every hero a unique ability, passive and silhouette", () => {
    expect(new Set(ROSTER.map((c) => c.ability)).size).toBe(10);
    expect(new Set(ROSTER.map((c) => c.passive)).size).toBe(10);
    expect(new Set(ROSTER.map((c) => c.rig)).size).toBeGreaterThanOrEqual(9);
    expect(new Set(ROSTER.map((c) => c.spritePrefix)).size).toBe(10);
  });

  it("gives every hero a real tradeoff", () => {
    for (const c of ROSTER) {
      expect(c.strengths.length).toBeGreaterThan(0);
      expect(c.weaknesses.length).toBeGreaterThan(0);
      const total = c.stats.speed + c.stats.jump + c.stats.power + c.stats.defense;
      expect(total).toBeLessThanOrEqual(28);
      expect(total).toBeGreaterThanOrEqual(20);
    }
  });
});
