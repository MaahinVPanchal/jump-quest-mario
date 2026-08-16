import type { CharacterData } from "../types";

export const CHARACTERS: Record<string, CharacterData> = {
  riko: {
    id: "riko",
    name: "Riko",
    spritePrefix: "hero",
    blurb: "Balanced runner. Skid turns, coyote time and a variable-height jump.",
    speed: 6,
    acceleration: 7,
    jumpForce: 7,
    maxHealth: 1,
    attackDamage: 1,
    projectileSpeed: 6,
    canDoubleJump: false,
    canDash: false,
    specialAbility: "emberFlare",
  },
  mira: {
    id: "mira",
    name: "Mira",
    spritePrefix: "mira",
    blurb: "Glider scout. Lighter and faster, and she can double jump in mid-air.",
    speed: 7,
    acceleration: 8,
    jumpForce: 7,
    maxHealth: 1,
    attackDamage: 1,
    projectileSpeed: 7,
    canDoubleJump: true,
    canDash: false,
    specialAbility: "featherLift",
    unlockedBy: "1-1",
  },
};

export const DEFAULT_CHARACTER = CHARACTERS["riko"]!;
