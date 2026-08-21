import type { BossKind, EnemyKind, ItemKind, WorldPhysics } from "../types";

export interface WorldDef {
  world: number;
  name: string;
  /** One-line pitch shown on the world map and loading card. */
  pitch: string;
  skyColor: number;
  /** Tile palette label used by the briefing UI. */
  buildSet: string;
  /** Physics profile applied to the whole stage (zones can override locally). */
  physics: WorldPhysics;
  /** Enemy mix used when populating stages of this world. */
  enemies: EnemyKind[];
  /** Signature power-up introduced by this world. */
  signaturePowerUp: ItemKind;
  /** Difficulty 1 (gentle) .. 8 (expert). */
  difficulty: number;
  boss: { kind: BossKind; name: string; health: number };
  /** Mechanics taught in this world, shown on the loading card. */
  teaches: string[];
}

/** Ground-truth physics baseline; worlds scale away from this. */
export const BASE_PHYSICS: WorldPhysics = {
  gravityScale: 1,
  frictionScale: 1,
  speedScale: 1,
  jumpScale: 1,
  swim: false,
  wind: 0,
};

export const WORLDS: WorldDef[] = [
  {
    world: 1,
    name: "Emberleaf Meadow",
    pitch: "Grass, bridges and gentle hills — learn to run, leap and break blocks.",
    skyColor: 0x5c94fc,
    buildSet: "Grass brick set",
    physics: { ...BASE_PHYSICS },
    enemies: ["walker", "walker", "shell"],
    signaturePowerUp: "growthOrb",
    difficulty: 1,
    boss: { kind: "guardian", name: "Meadow Guardian", health: 8 },
    teaches: ["Run and jump", "Break bricks from below", "Checkpoints"],
  },
  {
    world: 2,
    name: "Verdant Canopy",
    pitch: "A vertical forest of branches, vines and long climbs.",
    skyColor: 0x1c7a3c,
    buildSet: "Jungle timber set",
    physics: { ...BASE_PHYSICS, frictionScale: 1.1 },
    enemies: ["flyer", "walker", "spiker", "shell"],
    signaturePowerUp: "banana",
    difficulty: 2,
    boss: { kind: "beast", name: "Canopy Beast", health: 10 },
    teaches: ["Vertical climbs", "Falling branches", "Enemies above you"],
  },
  {
    world: 3,
    name: "Tidal Caverns",
    pitch: "Flooded ruins: gravity drops, movement slows, and you swim.",
    skyColor: 0x0a3c7a,
    buildSet: "Sunken ruin set",
    physics: { ...BASE_PHYSICS, gravityScale: 0.45, speedScale: 0.78, swim: true, jumpScale: 0.75 },
    enemies: ["piranha", "flyer", "walker", "shell"],
    signaturePowerUp: "aquaPearl",
    difficulty: 3,
    boss: { kind: "serpent", name: "Tide Serpent", health: 12 },
    teaches: ["Swim with JUMP", "Currents", "Surface for air"],
  },
  {
    world: 4,
    name: "Skyfall Heights",
    pitch: "Floating islands and shoving wind — one mistake means a long fall.",
    skyColor: 0x9ad8fc,
    buildSet: "Floating cloud set",
    physics: { ...BASE_PHYSICS, gravityScale: 0.9, wind: 90 },
    enemies: ["flyer", "flyer", "spiker", "walker"],
    signaturePowerUp: "wingSeed",
    difficulty: 4,
    boss: { kind: "titan", name: "Sky Titan", health: 12 },
    teaches: ["Wind drift", "Cloud bounce", "Momentum control"],
  },
  {
    world: 5,
    name: "Scorching Caldera",
    pitch: "Lava rivers, heat vents and collapsing rock.",
    skyColor: 0x501010,
    buildSet: "Magma stone set",
    physics: { ...BASE_PHYSICS, frictionScale: 1 },
    enemies: ["spiker", "shell", "piranha", "walker"],
    signaturePowerUp: "emberCore",
    difficulty: 5,
    boss: { kind: "core", name: "Magma Core", health: 14 },
    teaches: ["Lava is lethal", "Heat vents launch you", "Timed platforms"],
  },
  {
    world: 6,
    name: "Frostbyte Peaks",
    pitch: "Ice friction is a quarter of normal — you will slide.",
    skyColor: 0xbfe9ff,
    buildSet: "Glacier ice set",
    physics: { ...BASE_PHYSICS, frictionScale: 0.25, speedScale: 1.05 },
    enemies: ["shell", "walker", "flyer", "spiker"],
    signaturePowerUp: "frostCrystal",
    difficulty: 6,
    boss: { kind: "warden", name: "Frost Warden", health: 14 },
    teaches: ["Slippery stops", "Breaking ice", "Precision braking"],
  },
  {
    world: 7,
    name: "Void Station",
    pitch: "Low gravity, gravity switches and neon ruins in orbit.",
    skyColor: 0x120a2a,
    buildSet: "Neon station set",
    physics: { ...BASE_PHYSICS, gravityScale: 0.55, jumpScale: 1.1 },
    enemies: ["flyer", "spiker", "shell", "walker"],
    signaturePowerUp: "gravityOrb",
    difficulty: 7,
    boss: { kind: "machine", name: "Void Machine", health: 16 },
    teaches: ["Floaty jumps", "Gravity fields", "Long air control"],
  },
  {
    world: 8,
    name: "The Final Forge",
    pitch: "Every mechanic at once, inside a machine that wants you gone.",
    skyColor: 0x1a1020,
    buildSet: "Iron forge set",
    physics: { ...BASE_PHYSICS },
    enemies: ["spiker", "shell", "flyer", "piranha", "walker"],
    signaturePowerUp: "shieldCore",
    difficulty: 8,
    boss: { kind: "overlord", name: "Forge Overlord", health: 20 },
    teaches: ["Everything you have learned", "No safe ground", "Multi-phase boss"],
  },
];

export function getWorld(world: number): WorldDef {
  return WORLDS[world - 1] ?? WORLDS[0]!;
}
