import type { CharacterData } from "../types";

export const CHARACTERS: Record<string, CharacterData> = {
  riko: {
    id: "riko",
    name: "Riko",
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
};

export const DEFAULT_CHARACTER = CHARACTERS["riko"]!;
