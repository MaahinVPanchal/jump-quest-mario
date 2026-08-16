import type { BlockSpawn, EnemySpawn, ItemSpawn, LevelData } from "../types";

const WIDTH = 216;
const HEIGHT = 24;
const SURFACE = 19;

const tiles: number[][] = Array.from({ length: HEIGHT }, () => new Array<number>(WIDTH).fill(0));

function fill(x0: number, x1: number, y0: number, y1: number, index: number): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (tiles[y] && x >= 0 && x < WIDTH) tiles[y]![x] = index;
    }
  }
}

function ground(x0: number, x1: number, top = SURFACE): void {
  fill(x0, x1, top, top, 1);
  fill(x0, x1, top + 1, HEIGHT - 1, 2);
}

function ledge(x0: number, x1: number, y: number): void {
  fill(x0, x1, y, y, 1);
}

/** Stone shelf used for the cavern sections. */
function shelf(x0: number, x1: number, y: number): void {
  fill(x0, x1, y, y, 3);
}

// --- ground segments; the pits are wider than 1-1 ---
ground(0, 26);
ground(31, 54);
ground(60, 78);
ground(85, 112);
ground(119, 140);
ground(147, 176);
ground(182, 206);

// --- stair climbs and shelves ---
ledge(20, 23, 15);
shelf(34, 37, 14);
shelf(40, 43, 11);
ledge(48, 51, 15);
shelf(62, 65, 13);
shelf(68, 71, 10);
ledge(74, 77, 14);
shelf(88, 91, 12);
ledge(94, 97, 15);
shelf(100, 104, 9);
ledge(122, 125, 14);
shelf(128, 132, 11);
ledge(136, 139, 15);
shelf(150, 154, 13);
shelf(158, 161, 9);
ledge(166, 169, 14);
shelf(186, 190, 12);
shelf(193, 196, 8);

function coinRow(x0: number, x1: number, y: number): ItemSpawn[] {
  const out: ItemSpawn[] = [];
  for (let x = x0; x <= x1; x++) out.push({ type: "coin", x, y });
  return out;
}

const items: ItemSpawn[] = [
  ...coinRow(10, 14, 17),
  ...coinRow(20, 23, 14),
  ...coinRow(34, 37, 13),
  ...coinRow(40, 43, 10),
  ...coinRow(62, 65, 12),
  ...coinRow(88, 91, 11),
  ...coinRow(100, 104, 8),
  ...coinRow(122, 125, 13),
  ...coinRow(128, 132, 10),
  ...coinRow(150, 154, 12),
  ...coinRow(186, 190, 11),
  // Sky Stars - five of them, all required before the goal opens.
  { type: "star", x: 42, y: 9, id: "star-2-1-a" },
  { type: "star", x: 70, y: 8, id: "star-2-1-b" },
  { type: "star", x: 102, y: 7, id: "star-2-1-c" },
  { type: "star", x: 130, y: 9, id: "star-2-1-d" },
  { type: "star", x: 194, y: 6, id: "star-2-1-e" },
  // Secret relics
  { type: "relic", x: 76, y: 12, id: "relic-cinder-shaft" },
  { type: "relic", x: 160, y: 7, id: "relic-emberfall" },
  { type: "relic", x: 172, y: 17, id: "relic-underledge" },
];

const blocks: BlockSpawn[] = [
  { kind: "question", x: 12, y: 15, contains: "growthOrb" },
  { kind: "brick", x: 13, y: 15 },
  { kind: "question", x: 14, y: 15, coins: 4, contains: "coin" },
  { kind: "brick", x: 36, y: 10 },
  { kind: "question", x: 37, y: 10, contains: "fireCrystal" },
  { kind: "brick", x: 38, y: 10 },
  { kind: "hidden", x: 66, y: 9, contains: "oneUp" },
  { kind: "metal", x: 92, y: 15 },
  { kind: "question", x: 93, y: 15, coins: 3, contains: "coin" },
  { kind: "brick", x: 124, y: 10 },
  { kind: "question", x: 125, y: 10, contains: "growthOrb" },
  { kind: "brick", x: 126, y: 10 },
  { kind: "question", x: 155, y: 12, contains: "fireCrystal" },
  { kind: "question", x: 66, y: 11, contains: "catBell" },
  { kind: "question", x: 108, y: 11, contains: "banana" },
  { kind: "brick", x: 156, y: 12 },
  { kind: "question", x: 188, y: 14, coins: 5, contains: "coin" },
];

const enemies: EnemySpawn[] = [
  { type: "walker", x: 16, y: 18, direction: -1, patrol: 112 },
  { type: "spiker", x: 24, y: 18, direction: -1, patrol: 128 },
  { type: "shell", x: 36, y: 13, direction: 1, patrol: 64 },
  { type: "flyer", x: 44, y: 11, patrol: 160 },
  { type: "spiker", x: 50, y: 18, direction: -1, patrol: 144 },
  { type: "walker", x: 64, y: 12, direction: 1, patrol: 64 },
  { type: "flyer", x: 70, y: 9, patrol: 140 },
  { type: "spiker", x: 74, y: 18, direction: 1, patrol: 96 },
  { type: "piranha", x: 82, y: 17 },
  { type: "shell", x: 96, y: 18, direction: -1, patrol: 160 },
  { type: "walker", x: 104, y: 8, direction: -1, patrol: 64 },
  { type: "flyer", x: 108, y: 12, patrol: 180 },
  { type: "spiker", x: 124, y: 18, direction: -1, patrol: 128 },
  { type: "walker", x: 132, y: 10, direction: 1, patrol: 64 },
  { type: "shell", x: 137, y: 18, direction: -1, patrol: 128 },
  { type: "flyer", x: 143, y: 11, patrol: 160 },
  { type: "spiker", x: 152, y: 12, direction: 1, patrol: 80 },
  { type: "walker", x: 160, y: 8, direction: -1, patrol: 64 },
  { type: "piranha", x: 178, y: 17 },
  { type: "shell", x: 168, y: 13, direction: -1, patrol: 96 },
  { type: "spiker", x: 188, y: 18, direction: -1, patrol: 128 },
  { type: "walker", x: 196, y: 7, direction: 1, patrol: 48 },
  { type: "flyer", x: 198, y: 12, patrol: 160 },
  { type: "walker", x: 202, y: 18, direction: -1, patrol: 96 },
];

export const LEVEL_2: LevelData = {
  id: "2-1",
  world: 2,
  level: 1,
  name: "Cinderpeak Hollow",
  timeLimit: 340,
  widthTiles: WIDTH,
  heightTiles: HEIGHT,
  tiles,
  spawn: { x: 3, y: 17 },
  goal: { x: 203, y: 18 },
  checkpoints: [{ x: 87, y: 18 }, { x: 149, y: 18 }],
  enemies,
  items,
  blocks,
  platforms: [
    { x: 55, y: 17, widthTiles: 3, dx: 4, duration: 2600 },
    { x: 80, y: 16, widthTiles: 2, dy: -5, duration: 2400 },
    { x: 114, y: 16, widthTiles: 3, dx: 4.5, duration: 3000 },
    { x: 142, y: 15, widthTiles: 2, dy: -4, duration: 2200 },
    { x: 178, y: 17, widthTiles: 3, dx: 3.5, duration: 2600 },
  ],
  pipes: [
    { x: 82, y: 17, target: { x: 119, y: 18 }, label: "Cinder tunnel" },
  ],
  hazards: [
    { x: 46, y: 18 },
    { x: 90, y: 18 },
    { x: 134, y: 18 },
    { x: 170, y: 18 },
  ],
  music: "level",
  starsRequired: 5,
  skyColor: 0x2038ec,
};
