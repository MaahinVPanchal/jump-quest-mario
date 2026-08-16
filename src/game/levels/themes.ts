/**
 * Ten hand-authored stage themes. Every theme owns its own tile palette,
 * parallax silhouettes, liquid (lava / water / void / gold), enemy mix and a
 * unique big boss, so no two stages look or play the same.
 */
export type LiquidKind = "lava" | "water" | "void" | "gold" | "plasma";
export type DecorKind =
  | "hills"
  | "volcano"
  | "reef"
  | "clouds"
  | "crates"
  | "vault"
  | "jungle"
  | "harbour"
  | "launchpad"
  | "stars";

export interface BossSpec {
  id: string;
  name: string;
  /** Extra hits above the base three, scaling with stage depth. */
  extraHits: number;
  score: number;
  /** Silhouette variant used by the boss sprite generator. */
  shape: "brute" | "ogre" | "fish" | "bird" | "block" | "ape" | "ship" | "rocket" | "alien";
  body: number;
  bodyDark: number;
  trim: number;
}

export interface StageTheme {
  id: string;
  world: number;
  name: string;
  blurb: string;
  buildSet: string;
  sky: number;
  skyLow: number;
  liquid: LiquidKind;
  decor: DecorKind;
  /** Terrain palette: [surface, surfaceDark, cap, dirt, dirtDark, stone, stoneDark]. */
  ground: [number, number, number, number, number, number, number];
  platform: number;
  pipe: [number, number, number];
  far: number;
  near: number;
  liquidColors: [number, number];
  enemies: ("walker" | "shell" | "ogre" | "piranha" | "spiker")[];
  boss: BossSpec;
}

export const STAGE_THEMES: StageTheme[] = [
  {
    id: "meadow",
    world: 1,
    name: "Emberleaf Meadow",
    blurb: "Rolling grass fields and brick ground - the gentle warm-up run.",
    buildSet: "Grass brick set",
    sky: 0x5c94fc,
    skyLow: 0x9cd8fc,
    liquid: "void",
    decor: "hills",
    ground: [0xd07030, 0x9c4a00, 0xfcbc90, 0xc06018, 0x843c00, 0x00a800, 0x006000],
    platform: 0xfcbc90,
    pipe: [0x00a800, 0x005000, 0xa0f0a0],
    far: 0x00a800,
    near: 0x008038,
    liquidColors: [0x0b0b12, 0x000000],
    enemies: ["walker", "walker", "shell", "ogre"],
    boss: { id: "meadow", name: "Thornhide Bull", extraHits: 0, score: 2000, shape: "brute", body: 0x00a800, bodyDark: 0x005000, trim: 0xfcd83c },
  },
  {
    id: "lava",
    world: 2,
    name: "Fiery Forge",
    blurb: "Molten rivers, ash rain and collapsing forge stone.",
    buildSet: "Scorched forge set",
    sky: 0x681010,
    skyLow: 0xd84418,
    liquid: "lava",
    decor: "volcano",
    ground: [0x6c2810, 0x3c1008, 0xfc7018, 0x50200c, 0x2c0c04, 0x8c3418, 0x481408],
    platform: 0xfc9838,
    pipe: [0xd84418, 0x681010, 0xfcd83c],
    far: 0x902818,
    near: 0x501008,
    liquidColors: [0xfc5818, 0xd83000],
    enemies: ["walker", "spiker", "piranha", "shell", "ogre"],
    boss: { id: "lava", name: "Magmaw Titan", extraHits: 1, score: 2600, shape: "brute", body: 0xfc5818, bodyDark: 0x8c1c00, trim: 0xfcd83c },
  },
  {
    id: "water",
    world: 3,
    name: "Aquatic Arches",
    blurb: "Tidal shelves, coral pillars and drifting current platforms.",
    buildSet: "Coral reef set",
    sky: 0x3cbcfc,
    skyLow: 0xa8e8fc,
    liquid: "water",
    decor: "reef",
    ground: [0x3c8c7c, 0x1c5450, 0x8cf0d8, 0x2c6c68, 0x14403c, 0x58a8c8, 0x24607c],
    platform: 0xa8e8fc,
    pipe: [0x18b45c, 0x005c30, 0x8cf0d8],
    far: 0x2c7c9c,
    near: 0x1c5470,
    liquidColors: [0x2088cc, 0x105c9c],
    enemies: ["ogre", "piranha", "walker", "shell"],
    boss: { id: "water", name: "Deepcoil Maw", extraHits: 1, score: 2800, shape: "fish", body: 0x2088cc, bodyDark: 0x0c3c68, trim: 0xfcfcfc },
  },
  {
    id: "sky",
    world: 4,
    name: "Skylantern Reach",
    blurb: "Cloud decks and lantern bridges high above the storm line.",
    buildSet: "Cloud lantern set",
    sky: 0x6888fc,
    skyLow: 0xd8e8fc,
    liquid: "void",
    decor: "clouds",
    ground: [0xf0f4fc, 0xa8b4dc, 0xffffff, 0xd8e0f4, 0x9098c8, 0xfcd83c, 0xc08c10],
    platform: 0xffffff,
    pipe: [0x8890fc, 0x30389c, 0xd8e0fc],
    far: 0xa8b8fc,
    near: 0x7c8cf0,
    liquidColors: [0x101830, 0x000000],
    enemies: ["ogre", "ogre", "shell", "walker"],
    boss: { id: "sky", name: "Galewing Roc", extraHits: 1, score: 2900, shape: "bird", body: 0xf0f4fc, bodyDark: 0x6870c8, trim: 0xfc8018 },
  },
  {
    id: "box",
    world: 5,
    name: "Crate Yard",
    blurb: "A stacked shipping yard built entirely from crates and pallets.",
    buildSet: "Timber crate set",
    sky: 0xd8a038,
    skyLow: 0xfce8a8,
    liquid: "void",
    decor: "crates",
    ground: [0xc08040, 0x845020, 0xfcd090, 0xa06c30, 0x6c4418, 0x8c6030, 0x4c3010],
    platform: 0xfcd090,
    pipe: [0xa06c30, 0x543008, 0xfcd090],
    far: 0xa07840,
    near: 0x745020,
    liquidColors: [0x1c1408, 0x000000],
    enemies: ["walker", "shell", "spiker", "ogre"],
    boss: { id: "box", name: "Crateclaw Stacker", extraHits: 2, score: 3000, shape: "block", body: 0xc08040, bodyDark: 0x6c4418, trim: 0xfc3830 },
  },
  {
    id: "gold",
    world: 6,
    name: "Bullion Vault",
    blurb: "Mint tunnels flooded with liquid gold and alarm turrets.",
    buildSet: "Bullion vault set",
    sky: 0x584018,
    skyLow: 0xfcd83c,
    liquid: "gold",
    decor: "vault",
    ground: [0xfcd83c, 0xa07c10, 0xfff4b0, 0xc09818, 0x7c5c08, 0x9c9c9c, 0x545454],
    platform: 0xfff4b0,
    pipe: [0xfcd83c, 0x7c5c08, 0xfff4b0],
    far: 0x8c6c18,
    near: 0x5c4410,
    liquidColors: [0xfcc814, 0xc08c10],
    enemies: ["spiker", "shell", "walker", "ogre"],
    boss: { id: "gold", name: "Bullion Golem", extraHits: 2, score: 3200, shape: "block", body: 0xfcd83c, bodyDark: 0x8c6408, trim: 0xfcfcfc },
  },
  {
    id: "jungle",
    world: 7,
    name: "Vinecoil Jungle",
    blurb: "Barrel bridges, swinging vines and a very territorial ape.",
    buildSet: "Jungle timber set",
    sky: 0x1c7c38,
    skyLow: 0x8cd85c,
    liquid: "void",
    decor: "jungle",
    ground: [0x38a038, 0x1c5c18, 0x8cf05c, 0x8c5c20, 0x4c3010, 0x6c8c30, 0x2c4c14],
    platform: 0x8c5c20,
    pipe: [0x38a038, 0x1c5c18, 0x8cf05c],
    far: 0x1c8c38,
    near: 0x0c5c24,
    liquidColors: [0x0c1c08, 0x000000],
    enemies: ["piranha", "walker", "ogre", "shell", "spiker"],
    boss: { id: "jungle", name: "Kongoro the Barrel King", extraHits: 2, score: 3400, shape: "ape", body: 0x8c5c20, bodyDark: 0x4c3010, trim: 0xfcd83c },
  },
  {
    id: "boat",
    world: 8,
    name: "Stormdeck Armada",
    blurb: "Deck-to-deck jumps across a rolling pirate armada.",
    buildSet: "Ship timber set",
    sky: 0x2c4c7c,
    skyLow: 0x8ca8d8,
    liquid: "water",
    decor: "harbour",
    ground: [0x8c6030, 0x4c3010, 0xd8a860, 0x6c4418, 0x3c2408, 0x546c8c, 0x2c3c54],
    platform: 0xd8a860,
    pipe: [0x546c8c, 0x24344c, 0xa8c0dc],
    far: 0x3c5c8c,
    near: 0x223c60,
    liquidColors: [0x1c5c9c, 0x0c3468],
    enemies: ["shell", "ogre", "walker", "piranha", "spiker"],
    boss: { id: "boat", name: "Dread Captain Brine", extraHits: 3, score: 3600, shape: "ship", body: 0x8c6030, bodyDark: 0x3c2408, trim: 0xe82820 },
  },
  {
    id: "rocket",
    world: 9,
    name: "Rocket Foundry",
    blurb: "Launch gantries, thruster vents and a countdown that never stops.",
    buildSet: "Iron gantry set",
    sky: 0x3c3c54,
    skyLow: 0x9c9cb4,
    liquid: "plasma",
    decor: "launchpad",
    ground: [0x9c9cac, 0x545464, 0xd8d8e4, 0x74747c, 0x3c3c44, 0xfc8018, 0x8c4408],
    platform: 0xd8d8e4,
    pipe: [0x9c9cac, 0x3c3c44, 0x60d8fc],
    far: 0x5c5c74,
    near: 0x3c3c50,
    liquidColors: [0x60d8fc, 0x1c78bc],
    enemies: ["spiker", "shell", "ogre", "walker"],
    boss: { id: "rocket", name: "Booster Mk. IX", extraHits: 3, score: 3800, shape: "rocket", body: 0xd8d8e4, bodyDark: 0x545464, trim: 0xfc3830 },
  },
  {
    id: "space",
    world: 10,
    name: "Cosmic Conduit",
    blurb: "Zero-gravity station arcs orbiting a dying star. Final stand.",
    buildSet: "Stellar station set",
    sky: 0x100c28,
    skyLow: 0x281c50,
    liquid: "plasma",
    decor: "stars",
    ground: [0x5c5c8c, 0x2c2c54, 0xa8a8f0, 0x40406c, 0x1c1c3c, 0x8c3cfc, 0x481c8c],
    platform: 0xa8a8f0,
    pipe: [0x8c3cfc, 0x3c1078, 0xd8b0fc],
    far: 0x2c2050,
    near: 0x1c1438,
    liquidColors: [0x8c3cfc, 0x3c1078],
    enemies: ["ogre", "spiker", "piranha", "shell", "walker"],
    boss: { id: "space", name: "Grimtusk Warlord", extraHits: 5, score: 5400, shape: "ogre", body: 0x3ca03c, bodyDark: 0x1c601c, trim: 0xd8b83c },
  },
];

export const themeByWorld = (world: number): StageTheme =>
  STAGE_THEMES[Math.min(STAGE_THEMES.length, Math.max(1, world)) - 1]!;

export const themeById = (id: string): StageTheme =>
  STAGE_THEMES.find((t) => t.id === id) ?? STAGE_THEMES[0]!;

/** Texture key helpers so scene + generator never disagree on naming. */
export const themeKey = (id: string, part: string): string => `th_${id}_${part}`;
export const bossKey = (id: string, frame: number): string => `boss_${id}_${frame}`;
