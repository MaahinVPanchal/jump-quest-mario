import type { BlockSpawn, EnemySpawn, ItemSpawn, LevelData } from "../types";

const WIDTH = 252;
const HEIGHT = 24;
const SURFACE = 19; // first solid row of the main ground

const tiles: number[][] = Array.from({ length: HEIGHT }, () => new Array<number>(WIDTH).fill(0));

function fill(x0: number, x1: number, y0: number, y1: number, index: number): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (tiles[y] && x >= 0 && x < WIDTH) tiles[y]![x] = index;
    }
  }
}

/** Ground segment with a grass cap and dirt body. */
function ground(x0: number, x1: number, top = SURFACE): void {
  fill(x0, x1, top, top, 1);
  fill(x0, x1, top + 1, HEIGHT - 1, 2);
}

/** Floating one-tile-tall ledge. */
function ledge(x0: number, x1: number, y: number): void {
  fill(x0, x1, y, y, 1);
}

// --- main ground segments (gaps between them are pits) ---
ground(0, 30);
ground(34, 62);
ground(66, 96);
ground(100, 133);
ground(138, 158);
ground(164, 208);

// --- section B: stepped terrain ---
ledge(41, 44, 16);
ledge(56, 59, 14);

// --- section C: vertical climb + secret high ledge ---
ledge(68, 70, 16);
ledge(73, 75, 13);
ledge(78, 81, 10);
ledge(90, 92, 15);

// --- section D ---
ledge(112, 115, 14);
ledge(124, 127, 15);

// --- section E: skilled-player high route ---
ledge(146, 148, 15);
ledge(151, 155, 11);

// --- section F ---
ledge(164, 167, 12);
ledge(169, 172, 9);
ledge(176, 178, 15);

// --- bonus room (reached only through the tunnel) ---
fill(212, 248, 12, 12, 3);
fill(212, 212, 13, HEIGHT - 1, 3);
fill(248, 248, 13, HEIGHT - 1, 3);
ground(213, 247);

function coinRow(x0: number, x1: number, y: number): ItemSpawn[] {
  const out: ItemSpawn[] = [];
  for (let x = x0; x <= x1; x++) out.push({ type: "coin", x, y });
  return out;
}

function coinArc(x0: number, y: number, count: number): ItemSpawn[] {
  const out: ItemSpawn[] = [];
  for (let i = 0; i < count; i++) {
    const lift = Math.round(Math.sin((i / (count - 1)) * Math.PI) * 3);
    out.push({ type: "coin", x: x0 + i, y: y - lift });
  }
  return out;
}

const items: ItemSpawn[] = [
  // A - coins pull the player rightwards and teach jumping
  ...coinArc(8, 18, 6),
  ...coinRow(24, 26, 18),
  // B
  ...coinRow(41, 44, 15),
  ...coinRow(57, 59, 13),
  // C - climb rewards
  ...coinRow(73, 75, 12),
  ...coinRow(84, 88, 13),
  { type: "relic", x: 80, y: 9, id: "relic-highledge" },
  // D
  ...coinRow(112, 115, 13),
  ...coinArc(122, 18, 5),
  // E
  ...coinRow(151, 155, 10),
  // F
  ...coinRow(169, 172, 8),
  { type: "relic", x: 171, y: 8, id: "relic-skyshelf" },
  ...coinRow(188, 192, 18),
  // bonus room
  ...coinRow(216, 245, 17),
  ...coinRow(217, 244, 15),
  ...coinRow(219, 242, 13),
  { type: "relic", x: 231, y: 16, id: "relic-bonusroom" },
];

const blocks: BlockSpawn[] = [
  // first interaction
  { kind: "question", x: 14, y: 15, contains: "coin" },
  { kind: "question", x: 18, y: 15, coins: 4, contains: "coin" },
  // power-up introduction
  { kind: "question", x: 38, y: 15, contains: "growthOrb" },
  { kind: "brick", x: 45, y: 15 },
  { kind: "brick", x: 46, y: 15 },
  { kind: "brick", x: 47, y: 15 },
  { kind: "question", x: 46, y: 11, coins: 3, contains: "coin" },
  { kind: "metal", x: 48, y: 15 },
  // hidden chain -> extra life
  { kind: "hidden", x: 84, y: 15, contains: "coin" },
  { kind: "hidden", x: 86, y: 15, contains: "oneUp" },
  { kind: "hidden", x: 88, y: 15, contains: "coin" },
  // after the checkpoint
  { kind: "brick", x: 116, y: 15 },
  { kind: "brick", x: 117, y: 15 },
  { kind: "question", x: 118, y: 15, contains: "fireCrystal" },
  { kind: "brick", x: 119, y: 15 },
  { kind: "brick", x: 143, y: 14 },
  { kind: "question", x: 144, y: 14, coins: 2, contains: "coin" },
  { kind: "brick", x: 145, y: 14 },
  // final approach
  { kind: "question", x: 184, y: 14, contains: "growthOrb" },
  { kind: "brick", x: 185, y: 14 },
];

const enemies: EnemySpawn[] = [
  { type: "walker", x: 20, y: 18, direction: -1, patrol: 128 },
  { type: "walker", x: 27, y: 18, direction: -1, patrol: 96 },
  { type: "walker", x: 52, y: 18, direction: -1, patrol: 160 },
  { type: "flyer", x: 58, y: 11, patrol: 160 },
  { type: "shell", x: 44, y: 15, direction: -1, patrol: 64 },
  { type: "flyer", x: 46, y: 9, patrol: 120 },
  { type: "walker", x: 92, y: 14, direction: 1, patrol: 64 },
  { type: "walker", x: 94, y: 18, direction: -1, patrol: 128 },
  { type: "walker", x: 79, y: 9, direction: 1, patrol: 48 },
  { type: "flyer", x: 86, y: 10, patrol: 140 },
  { type: "shell", x: 108, y: 18, direction: -1, patrol: 192 },
  { type: "flyer", x: 121, y: 12, patrol: 200 },
  { type: "walker", x: 128, y: 18, direction: -1, patrol: 128 },
  { type: "walker", x: 114, y: 13, direction: 1, patrol: 64 },
  { type: "walker", x: 126, y: 14, direction: -1, patrol: 64 },
  { type: "shell", x: 150, y: 18, direction: -1, patrol: 160 },
  { type: "flyer", x: 156, y: 11, patrol: 120 },
  { type: "walker", x: 153, y: 10, direction: -1, patrol: 64 },
  { type: "shell", x: 166, y: 11, direction: 1, patrol: 64 },
  { type: "flyer", x: 171, y: 6, patrol: 120 },
  { type: "piranha", x: 130, y: 17 },
  { type: "piranha", x: 245, y: 17 },
  { type: "walker", x: 180, y: 18, direction: -1, patrol: 96 },
  { type: "walker", x: 184, y: 18, direction: 1, patrol: 96 },
  { type: "shell", x: 190, y: 18, direction: -1, patrol: 128 },
  { type: "flyer", x: 187, y: 12, patrol: 140 },
  { type: "walker", x: 196, y: 18, direction: -1, patrol: 96 },
  { type: "walker", x: 204, y: 18, direction: -1, patrol: 64 },
  { type: "walker", x: 224, y: 18, direction: 1, patrol: 96 },
  { type: "walker", x: 238, y: 18, direction: -1, patrol: 96 },
];

export const LEVEL_1: LevelData = {
  id: "1-1",
  world: 1,
  level: 1,
  name: "Emberleaf Meadow",
  timeLimit: 300,
  widthTiles: WIDTH,
  heightTiles: HEIGHT,
  tiles,
  spawn: { x: 3, y: 17 },
  goal: { x: 200, y: 18 },
  checkpoints: [{ x: 102, y: 18 }],
  enemies,
  items,
  blocks,
  platforms: [
    { x: 134, y: 17, widthTiles: 3, dx: 3.5, duration: 2600 },
    { x: 141, y: 16, widthTiles: 2, dy: -4, duration: 2200 },
    { x: 159, y: 16, widthTiles: 3, dx: 4.5, duration: 3000 },
  ],
  pipes: [
    { x: 130, y: 17, target: { x: 215, y: 18 }, label: "Bonus tunnel" },
    { x: 245, y: 17, target: { x: 139, y: 17 }, label: "Return" },
  ],
  hazards: [
    { x: 106, y: 18 },
    { x: 174, y: 18 },
  ],
  music: "level",
  next: "2-1",
};
