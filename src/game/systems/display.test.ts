import { describe, expect, it } from "vitest";
import { resolveZoom } from "./display";

describe("pixel-perfect zoom", () => {
  it("floors to whole device pixels at DPR 1", () => {
    expect(resolveZoom(2.7, 1, true)).toBe(2);
    expect(resolveZoom(3, 1, true)).toBe(3);
  });

  it("uses whole device pixels on retina screens", () => {
    expect(resolveZoom(2.7, 2, true)).toBe(2.5);
    expect(resolveZoom(1.4, 3, true)).toBeCloseTo(4 / 3, 5);
  });

  it("never collapses below a single device pixel step", () => {
    expect(resolveZoom(0.4, 2, true)).toBe(0.5);
  });

  it("passes the raw fit through when the lock is off", () => {
    expect(resolveZoom(2.73, 2, false)).toBe(2.73);
  });

  it("guards against bad input", () => {
    expect(resolveZoom(Number.NaN, 2, true)).toBe(1);
    expect(resolveZoom(0, 1, true)).toBe(1);
  });
});
