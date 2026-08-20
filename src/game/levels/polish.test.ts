import { describe, expect, it } from "vitest";
import { LEVELS } from "./index";
import { floorAt, solid } from "../systems/analyzer";
import { analyzeLevelFor } from "../systems/analyzer";
import { BASELINE_PROFILE } from "../systems/movementProfile";

describe("every stage is coherent end to end", () => {
  for (const level of LEVELS) {
    it(`${level.id} has no floating or unreachable content`, () => {
      for (const b of level.blocks) {
        expect(floorAt(level, b.x), `block over pit at ${b.x}`).not.toBeNull();
        expect(solid(level, b.x, b.y)).toBe(false);
      }
      for (const i of level.items) expect(floorAt(level, i.x), `item over pit at ${i.x}`).not.toBeNull();
      for (const e of level.enemies) {
        if (e.type === "flyer") continue;
        expect(floorAt(level, e.x), `enemy over pit at ${e.x}`).not.toBeNull();
      }
      for (const c of level.checkpoints ?? []) expect(floorAt(level, c.x)).not.toBeNull();
      for (let x = level.goal.x; x < level.widthTiles; x++) expect(floorAt(level, x)).not.toBeNull();

      const a = analyzeLevelFor(level, BASELINE_PROFILE);
      expect(a.summary.blockedGaps).toBe(0);
      expect(a.summary.unreachableCoins).toBe(0);
      expect(level.checkpoints?.length ?? 0).toBeGreaterThan(0);
    });
  }
});
