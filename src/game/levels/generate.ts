import type {
  BlockSpawn,
  EnemyKind,
  EnemySpawn,
  ItemSpawn,
  LevelData,
  MovingPlatformSpawn,
  PipeSpawn,
  Vec2,
} from "../types";

export interface WorldTheme {
  world: number;
  name: string;
  /** Backdrop colour for the world. */
  skyColor: number;
  /** Naming pool for the stages in this world. */
  places: string[];
  /** Enemy mix used when populating stages. */
  enemies: EnemyKind[];
  /** Building-set label shown in the level briefing. */
  buildSet: string;
}

export const WORLD_THEMES: WorldTheme[] = [
  {
    world: 1,
    name: "Emberleaf Meadow",
    skyColor: 0x5c94fc,
    places: ["Emberleaf Meadow", "Sunblossom Fields", "Acorn Hollow", "Thistle Rise", "Meadow Gate", "Emberleaf Keep"],
    enemies: ["walker", "walker", "shell", "flyer"],
    buildSet: "Grass brick set",
  },
  {
    world: 2,
    name: "Cinderpeak",
    skyColor: 0x2038ec,
    places: ["Cinderpeak Hollow", "Ashfall Steps", "Ember Quarry", "Sootstone Pass", "Magma Vents", "Cinderpeak Keep"],
    enemies: ["walker", "shell", "spiker", "flyer", "piranha"],
    buildSet: "Cavern stone set",
  },
  {
    world: 3,
    name: "Duneglass",
    skyColor: 0xd8a038,
    places: ["Duneglass Flats", "Scarab Steps", "Glass Pyramid", "Quicksand Run", "Sunken Bazaar", "Duneglass Tomb"],
    enemies: ["walker", "spiker", "piranha", "shell"],
    buildSet: "Sandstone pyramid set",
  },
  {
    world: 4,
    name: "Frostpane",
    skyColor: 0x3cbcfc,
    places: ["Frostpane Shelf", "Glacier Drift", "Icicle Span", "Snowveil Woods", "Frozen Falls", "Frostpane Spire"],
    enemies: ["walker", "flyer", "shell", "spiker"],
    buildSet: "Ice block set",
  },
  {
    world: 5,
    name: "Verdant Canopy",
    skyColor: 0x009438,
    places: ["Canopy Trail", "Vinecoil Deep", "Bloomspire", "Rootmaze", "Fernlight Grove", "Canopy Crown"],
    enemies: ["piranha", "walker", "flyer", "shell", "spiker"],
    buildSet: "Jungle timber set",
  },
  {
    world: 6,
    name: "Skylantern",
    skyColor: 0x6888fc,
    places: ["Skylantern Reach", "Cloudstep Way", "Lantern Bridge", "Windwake Run", "Stormshelf", "Skylantern Court"],
    enemies: ["flyer", "flyer", "walker", "shell"],
    buildSet: "Floating cloud set",
  },
  {
    world: 7,
    name: "Gearworks",
    skyColor: 0x7c7c7c,
    places: ["Gearworks Yard", "Piston Row", "Rivet Line", "Boiler Deep", "Conveyor Maze", "Gearworks Vault"],
    enemies: ["spiker", "shell", "walker", "flyer", "piranha"],
    buildSet: "Iron machine set",
  },
  {
    world: 8,
    name: "Obsidian Crown",
    skyColor: 0x201038,
    places: ["Obsidian Gate", "Ashen Bridge", "Molten Stair", "Shadow Halls", "Crown Ascent", "The Final Crown"],
    enemies: ["spiker", "piranha", "shell", "flyer", "walker"],
    buildSet: "Obsidian castle set",
  },
];

/** Deterministic RNG so every generated stage is identical between sessions. */
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0xffffffff;
  };
}

const HEIGHT = 24;
const SURFACE = 19;

export function buildLevel(world: number, level: number): LevelData {
  const theme = WORLD_THEMES[world - 1]!;
  const index = (world - 1) * 6 + (level - 1);
  const rand = rng(1337 + index * 7919);
  const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length)]!;

  const width = 180 + index * 4 + Math.floor(rand() * 20);
  const tiles: number[][] = Array.from({ length: HEIGHT }, () => new Array<number>(width).fill(0));

  const fill = (x0: number, x1: number, y0: number, y1: number, idx: number): void => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) if (tiles[y] && x >= 0 && x < width) tiles[y]![x] = idx;
  };
  const ground = (x0: number, x1: number): void => {
    fill(x0, x1, SURFACE, SURFACE, 1);
    fill(x0, x1, SURFACE + 1, HEIGHT - 1, 2);
  };

  // --- terrain: alternating slabs with pits that widen as the campaign goes on
  const segments: [number, number][] = [];
  const pitMin = 3 + Math.min(4, Math.floor(index / 10));
  let x = 0;
  while (x < width - 24) {
    const run = 16 + Math.floor(rand() * 20);
    const end = Math.min(width - 20, x + run);
    segments.push([x, end]);
    ground(x, end);
    x = end + pitMin + Math.floor(rand() * 3);
  }
  ground(width - 22, width - 1);
  segments.push([width - 22, width - 1]);

  // --- shelves and stair climbs
  const items: ItemSpawn[] = [];
  const blocks: BlockSpawn[] = [];
  const enemies: EnemySpawn[] = [];
  const platforms: MovingPlatformSpawn[] = [];
  const pipes: PipeSpawn[] = [];
  const hazards: Vec2[] = [];

  const coinRow = (x0: number, x1: number, y: number): void => {
    for (let cx = x0; cx <= x1; cx++) items.push({ type: "coin", x: cx, y });
  };

  const enemyDensity = 10 + Math.floor(index * 0.5);
  segments.forEach(([sx, ex], i) => {
    if (ex - sx < 10) return;
    const shelfY = 8 + Math.floor(rand() * 6);
    const shelfX = sx + 3 + Math.floor(rand() * 4);
    const shelfW = 3 + Math.floor(rand() * 3);
    const tileIdx = world >= 5 ? 3 : 1;
    fill(shelfX, shelfX + shelfW, shelfY, shelfY, tileIdx);
    coinRow(shelfX, shelfX + shelfW, shelfY - 1);

    if (i % 2 === 0) {
      blocks.push({ kind: "question", x: shelfX + 1, y: shelfY - 4, contains: i % 4 === 0 ? "growthOrb" : "coin", coins: 3 });
      blocks.push({ kind: "brick", x: shelfX + 2, y: shelfY - 4 });
    }
    if (i === 1) blocks.push({ kind: "question", x: sx + 6, y: SURFACE - 4, contains: "fireCrystal" });
    if (i === 2) blocks.push({ kind: "question", x: sx + 6, y: SURFACE - 4, contains: "banana" });
    if (i === 3) blocks.push({ kind: "question", x: sx + 6, y: SURFACE - 4, contains: "catBell" });
    if (i === 3) blocks.push({ kind: "hidden", x: sx + 5, y: SURFACE - 5, contains: "oneUp" });

    const count = Math.min(4, 1 + Math.floor(rand() * (1 + enemyDensity / segments.length)));
    for (let n = 0; n < count; n++) {
      const kind = pick(theme.enemies);
      const ex0 = sx + 4 + Math.floor(rand() * Math.max(1, ex - sx - 6));
      if (kind === "flyer") enemies.push({ type: "flyer", x: ex0, y: shelfY + 1, patrol: 140 + Math.floor(rand() * 60) });
      else if (kind === "piranha") {
        pipes.push({ x: ex0, y: SURFACE - 2, target: { x: Math.min(width - 24, ex0 + 24), y: SURFACE - 1 }, label: `${theme.name} tunnel` });
        enemies.push({ type: "piranha", x: ex0, y: SURFACE - 2 });
      } else
        enemies.push({
          type: kind,
          x: ex0,
          y: SURFACE - 1,
          direction: rand() > 0.5 ? 1 : -1,
          patrol: 80 + Math.floor(rand() * 80),
        });
    }

    if (i > 0 && i % 2 === 1) {
      platforms.push({
        x: sx - pitMin,
        y: SURFACE - 2 - Math.floor(rand() * 3),
        widthTiles: 2 + Math.floor(rand() * 2),
        ...(rand() > 0.5 ? { dx: 3 + rand() * 2 } : { dy: -(3 + rand() * 2) }),
        duration: 2200 + Math.floor(rand() * 1200),
      });
    }
    if (world >= 3 && i % 3 === 2) hazards.push({ x: sx + 8, y: SURFACE - 1 });
  });

  // --- stars: required from world 3 onward, more of them deeper in
  const starsRequired = world >= 3 ? Math.min(8, 3 + Math.floor(world / 2)) : world === 2 ? 5 : 0;
  for (let s = 0; s < starsRequired; s++) {
    const seg = segments[Math.floor(((s + 1) / (starsRequired + 1)) * segments.length)] ?? segments[0]!;
    items.push({ type: "star", x: Math.min(width - 4, seg[0] + 6), y: 6 + ((s * 3) % 8), id: `star-${world}-${level}-${s}` });
  }

  // --- three secret relics
  for (let r = 0; r < 3; r++) {
    const seg = segments[Math.floor(((r + 1) / 4) * segments.length)] ?? segments[0]!;
    items.push({ type: "relic", x: Math.min(width - 3, seg[0] + 10), y: 5 + r * 4, id: `relic-${world}-${level}-${r}` });
  }

  const mid = segments[Math.floor(segments.length / 2)]!;
  const third = segments[Math.floor(segments.length / 3)]!;

  return {
    id: `${world}-${level}`,
    world,
    level,
    name: theme.places[level - 1] ?? `${theme.name} ${level}`,
    timeLimit: 300 + index * 2,
    widthTiles: width,
    heightTiles: HEIGHT,
    tiles,
    spawn: { x: 3, y: SURFACE - 2 },
    goal: { x: width - 5, y: SURFACE - 1 },
    checkpoints: [
      { x: third[0] + 4, y: SURFACE - 1 },
      { x: mid[0] + 4, y: SURFACE - 1 },
    ],
    enemies,
    items,
    blocks,
    platforms,
    pipes,
    hazards,
    music: "level",
    ...(starsRequired ? { starsRequired } : {}),
    skyColor: theme.skyColor,
    buildSet: theme.buildSet,
  };
}
