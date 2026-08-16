export interface CharacterData {
  id: string;
  name: string;
  speed: number;
  acceleration: number;
  jumpForce: number;
  maxHealth: number;
  attackDamage: number;
  projectileSpeed: number;
  canDoubleJump: boolean;
  canDash: boolean;
  specialAbility: string;
}

export type EnemyKind = "walker" | "shell" | "flyer" | "piranha";

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

export type ItemKind =
  | "coin"
  | "relic"
  | "growthOrb"
  | "fireCrystal"
  | "oneUp";

export type BlockKind = "question" | "brick" | "hidden" | "metal";

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
