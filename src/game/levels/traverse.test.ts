import { describe, expect, it } from "vitest";
import { CHARACTERS } from "../data/characters";
import { LEVELS, getLevel } from "./index";
import { WORLDS } from "./worlds";
import { buildMovementProfile } from "../systems/movementProfile";
import { traverse } from "./traverse";

const heroes = Object.values(CHARACTERS);

describe("campaign walkability", () => {
  it("has all 32 stages", () => {
    expect(LEVELS).toHaveLength(32);
  });

  for (const level of LEVELS) {
    it(`${level.id} ${level.name} is walkable from spawn to flag for every hero`, () => {
      const physics = WORLDS.find((w) => w.world === level.world)?.physics;
      for (const hero of heroes) {
        const profile = buildMovementProfile(hero, physics);
        const result = traverse(level, profile);
        expect(`${hero.name}: ${result.reason ?? "ok"}`).toBe(`${hero.name}: ok`);
      }
    });
  }

  it("keeps the 1-4 fortress open all the way to the guardian arena", () => {
    const fortress = getLevel("1-4");
    const result = traverse(fortress);
    expect(result.reachable).toBe(true);
    expect(result.farthestX).toBeGreaterThanOrEqual(fortress.goal.x - 4);
    expect(fortress.boss).toBeDefined();
  });
});
