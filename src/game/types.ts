export interface CharacterData {
  id: string;
  name: string;
  /** Texture key prefix for this character's sprite set. */
  spritePrefix: string;
  /** Short archetype label shown on the select screen. */
  archetype?: string;
  /** Signature move name, shown in caps on the select screen. */
  special?: string;
  blurb: string;
  speed: number;
  acceleration: number;
  jumpForce: number;
  maxHealth: number;
  attackDamage: number;
  projectileSpeed: number;
  canDoubleJump: boolean;
  canDash: boolean;
  specialAbility: string;
  /** Signature projectile thrown while powered up. */
  throwable?: ThrowKind;
  /** Level id that must be cleared before this character is playable. */
  unlockedBy?: string;
  /** Palette overrides applied to the shared pixel rig. */
  tint?: Record<string, string>;
}

export type EnemyKind = "walker" | "shell" | "flyer" | "piranha" | "spiker";

export interface EnemyData {
  id: EnemyKind;
  name: string;
  health: number;
  speed: number;
  damage: number;
  patrolRange: number;
  stompable: boolean;
  canFly: boolean;
  score: number;
  weakness: string[];
}

export type ThrowKind =
  | "ember"
  | "banana"
  | "claw"
  | "hammer"
  | "egg"
  | "star"
  | "pellet"
  | "beam"
  | "bubble"
  | "shell"
  | "shadow"
  | "vine"
  | "ice";

export type ItemKind =
  | "coin"
  | "relic"
  | "star"
  | "growthOrb"
  | "fireCrystal"
  | "banana"
  | "catBell"
  | "oneUp"
  // World signature power-ups
  | "aquaPearl"
  | "wingSeed"
  | "emberCore"
  | "frostCrystal"
  | "gravityOrb"
  | "shieldCore"
  | "rushSpark"
  | "starFragment";

export type BlockKind =
  | "question"
  | "brick"
  | "hidden"
  | "metal"
  | "bounce"
  | "falling"
  | "ice";

/** Local environment override applied while the hero overlaps the zone. */
export type ZoneKind = "water" | "wind" | "ice" | "lowgrav" | "current" | "lava";

export interface ZoneSpawn {
  kind: ZoneKind;
  /** Tile coordinates / size. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Strength for wind / current zones (px/s^2, signed). */
  force?: number;
}

/** Per-world movement profile; zones can override parts of it locally. */
export interface WorldPhysics {
  gravityScale: number;
  frictionScale: number;
  speedScale: number;
  jumpScale: number;
  swim: boolean;
  /** Constant horizontal push in px/s^2. */
  wind: number;
}

export type BossKind =
  | "guardian"
  | "beast"
  | "serpent"
  | "titan"
  | "core"
  | "warden"
  | "machine"
  | "overlord";

export interface BossDefinition {
  kind: BossKind;
  name: string;
  health: number;
  /** Tile position of the arena anchor. */
  x: number;
  y: number;
}


export interface Vec2 {
  x: number;
  y: number;
}

export interface BlockSpawn extends Vec2 {
  kind: BlockKind;
  /** Item released when hit (question / hidden blocks). */
  contains?: ItemKind;
  /** Number of coins for multi-coin question blocks. */
  coins?: number;
}

export interface EnemySpawn extends Vec2 {
  type: EnemyKind;
  direction?: -1 | 1;
  patrol?: number;
}

export interface ItemSpawn extends Vec2 {
  type: ItemKind;
  id?: string;
}

export interface MovingPlatformSpawn extends Vec2 {
  widthTiles: number;
  dx?: number;
  dy?: number;
  duration: number;
}

export interface PipeSpawn extends Vec2 {
  /** Destination in tile coordinates. */
  target: Vec2;
  label: string;
}

export interface LevelData {
  id: string;
  world: number;
  level: number;
  name: string;
  timeLimit: number;
  /** Tile columns / rows. */
  widthTiles: number;
  heightTiles: number;
  /** Solid terrain, indexed [row][col]; 0 = empty. */
  tiles: number[][];
  spawn: Vec2;
  goal: Vec2;
  checkpoints: Vec2[];
  enemies: EnemySpawn[];
  items: ItemSpawn[];
  blocks: BlockSpawn[];
  platforms: MovingPlatformSpawn[];
  pipes: PipeSpawn[];
  hazards: Vec2[];
  music: string;
  /** Sky Stars that must be collected before the goal opens (level 2+). */
  starsRequired?: number;
  /** Optional palette theme for the backdrop. */
  skyColor?: number;
  /** Next level in the campaign. */
  next?: string;
  /** Building-set label used by the level briefing UI. */
  buildSet?: string;
  /** One-line gameplay identity, e.g. "vertical climb". */
  identity?: string;
  /** Optional stage objective shown on the loading card. */
  objective?: string;
  /** Environment override zones (water, wind, ice, lava, gravity). */
  zones?: ZoneSpawn[];
  /** Movement profile for the stage. */
  physics?: WorldPhysics;
  /** Boss encounter, present on every world's final stage. */
  boss?: BossDefinition;
}

export interface LevelResult {
  levelId: string;
  score: number;
  coins: number;
  relics: number;
  relicIds: string[];
  enemies: number;
  timeLeft: number;
  timeTaken: number;
  damageTaken: number;
  stars: number;
  rank: "S" | "A" | "B" | "C";
}

export interface SaveData {
  save_version: number;
  name: string;
  createdAt: number;
  lastPlayed: number;
  playTimeMs: number;
  coins: number;
  lives: number;
  completedLevels: string[];
  bestScores: Record<string, number>;
  bestTimes: Record<string, number>;
  /** Sky Stars collected per level id. */
  levelStars: Record<string, number>;
  /** Every star id ever collected, so progress survives a refresh. */
  starIds: string[];
  relics: string[];
  unlockedCharacters: string[];
  settings: {
    master: number;
    music: number;
    sfx: number;
    screenShake: boolean;
    /** Lock rendering to integer-zoom pixel-perfect scaling. */
    pixelPerfect: boolean;
  };
}
