/** The ten signature X-abilities. One per hero — never shared, never recoloured. */
export type AbilityKind =
  | "emberBurst"
  | "bounceShot"
  | "electricArc"
  | "knifeThrow"
  | "shield"
  | "ninjaStar"
  | "fireBurst"
  | "frostShard"
  | "windBlast"
  | "groundSmash";

/** Passives, one per hero. */
export type PassiveKind =
  | "emberResolve"
  | "quickRecovery"
  | "overcharge"
  | "comboEdge"
  | "armor"
  | "airStep"
  | "heat"
  | "iceWalk"
  | "glide"
  | "heavyForce";

/** Visual rig used for the hero silhouette (sprite + UI art). */
export type HeroRig =
  | "runner"
  | "tech"
  | "rogue"
  | "armored"
  | "ninja"
  | "flame"
  | "explorer"
  | "winged"
  | "heavy";

export interface HeroMovement {
  speedMul: number;
  accelMul: number;
  airControlMul: number;
  jumpMul: number;
  /** Hold jump while falling to glide (Aero). */
  glide?: boolean;
  /** Dash distance in px, 0 / absent = no dash. */
  dashDistance?: number;
  /** 0 = full knockback, 1 = immovable. */
  knockbackResist?: number;
  /** Keeps traction on ice (Frost). */
  iceGrip?: boolean;
}

export interface CharacterData {
  id: string;
  name: string;
  /** Texture key prefix for this character's sprite set. */
  spritePrefix: string;
  /** Visual silhouette used by both the Phaser sprites and the React art. */
  rig: HeroRig;
  /** Role label shown on the select screen. */
  role: string;
  /** 1-5 stars. */
  difficulty: number;
  blurb: string;
  abilityName: string;
  abilityDesc: string;
  passiveName: string;
  passiveDesc: string;
  ability: AbilityKind;
  passive: PassiveKind;
  /** How this hero interacts with blocks / barriers. */
  blockPower: string;
  strengths: string[];
  weaknesses: string[];
  /** Display bars, 0-10. */
  stats: { speed: number; jump: number; power: number; defense: number };
  speed: number;
  acceleration: number;
  jumpForce: number;
  maxHealth: number;
  attackDamage: number;
  projectileSpeed: number;
  canDoubleJump: boolean;
  canDash: boolean;
  move: HeroMovement;
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

/** Projectiles that exist in flight: hero abilities plus the two form throws. */
export type ThrowKind = AbilityKind | "banana" | "claw";


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

/** Primary gameplay goal of a stage, beyond simply reaching the flag. */
export type ObjectiveType =
  | "TIME_LIMIT"
  | "COIN_TARGET"
  | "DEFEAT_ALL"
  | "NO_WATER"
  | "FIND_SECRET";

export interface LevelObjective {
  type: ObjectiveType;
  /** Coins / enemies to reach, when the type is counted. */
  target?: number;
  /** Seconds allowed, for TIME_LIMIT. */
  timeLimit?: number;
  description: string;
  /** Mandatory objectives block level completion; the rest only affect the grade. */
  mandatory: boolean;
}

export interface LevelObjectives {
  primary: LevelObjective;
  secondary?: LevelObjective[];
}

/** Rectangular tile region that flips the FIND_SECRET objective when entered. */
export interface SecretZone {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

export interface LevelGoal {
  type: "GOAL_FLAG";
  /** Tile position of the pole base. */
  position: Vec2;
  /** Pixels from the pole that count as touching the flag. */
  activationRadius: number;
}

/** Live objective state, mirrored into the HUD and the results screen. */
export interface ObjectiveProgress {
  type: ObjectiveType;
  label: string;
  value: string;
  current: number;
  target: number;
  complete: boolean;
  failed: boolean;
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
  /** Primary + secondary goals of the stage. */
  objectives?: LevelObjectives;
  /** Hidden region that satisfies FIND_SECRET. */
  secretZone?: SecretZone;
  /** Semantic goal descriptor used for validation and completion. */
  goalMeta?: LevelGoal;
  /** Enemies that count towards DEFEAT_ALL (indices into `enemies`). */
  requiredEnemies?: number[];
}

export interface LevelResult {
  levelId: string;
  score: number;
  coins: number;
  relics: number;
  relicIds: string[];
  enemies: number;
  enemiesRequired?: number;
  timeLeft: number;
  timeTaken: number;
  damageTaken: number;
  stars: number;
  /** Snapshot of every objective as it stood when the flag was touched. */
  objectives?: ObjectiveProgress[];
  primaryComplete?: boolean;
  secretFound?: boolean;
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
  /** Stage to resume after refresh; advanced immediately when a stage is cleared. */
  currentLevelId: string;
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
