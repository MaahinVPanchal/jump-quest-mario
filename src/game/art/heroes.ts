/**
 * Shared hero pixel-art registry.
 *
 * Every playable hero is authored on the same 16x16 chunky grid so the roster
 * stays consistent, but each one owns its head, torso, attack pose, leg build
 * and palette — nobody is a recolor of anybody else.
 *
 * Both the Phaser texture generator and the React select-screen renderer read
 * from this module, so in-game art and UI art can never drift apart.
 *
 * Palette characters (per hero, resolved through HeroPalette):
 *   K outline   1 primary    2 primary shade   3 secondary  4 secondary shade
 *   5 accent    6 boots      S skin            s skin shade
 *   W white     E eye/black  X weapon light    x weapon dark   H hair
 */

export type HeroPose =
  | "idle"
  | "idle2"
  | "walk0"
  | "walk1"
  | "walk2"
  | "walk3"
  | "jump"
  | "fall"
  | "land"
  | "hurt"
  | "skid"
  | "attack0"
  | "attack1"
  | "attack2";

export const HERO_POSES: readonly HeroPose[] = [
  "idle",
  "idle2",
  "walk0",
  "walk1",
  "walk2",
  "walk3",
  "jump",
  "fall",
  "land",
  "hurt",
  "skid",
  "attack0",
  "attack1",
  "attack2",
];

export type LegStyle = "normal" | "wide" | "short" | "gown";

export interface HeroPalette {
  K: string;
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
  "6": string;
  S: string;
  s: string;
  W: string;
  E: string;
  X: string;
  x: string;
  H: string;
}

export interface HeroArt {
  /** 8 rows: head + headgear. */
  head: readonly string[];
  /** 4 rows: torso, arms, accessory. */
  torso: readonly string[];
  /** 4 rows: torso while attacking (weapon out). */
  attack: readonly string[];
  legs: LegStyle;
  palette: HeroPalette;
}

const OUTLINE = "#101018";

/** Small helper so each hero palette stays readable at the call site. */
function pal(p: {
  primary: string;
  primaryDark: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  boots: string;
  skin?: string;
  hair?: string;
  weapon?: string;
  weaponDark?: string;
}): HeroPalette {
  return {
    K: OUTLINE,
    "1": p.primary,
    "2": p.primaryDark,
    "3": p.secondary,
    "4": p.secondaryDark,
    "5": p.accent,
    "6": p.boots,
    S: p.skin ?? "#fcbc8c",
    s: "#d08050",
    W: "#ffffff",
    E: "#101018",
    X: p.weapon ?? "#d8d8e8",
    x: p.weaponDark ?? "#606074",
    H: p.hair ?? "#3c2000",
  };
}

// ---------------------------------------------------------------- leg sets

type LegSet = Record<string, readonly string[]>;

const NORMAL_LEGS: LegSet = {
  idle: ["..K33333333K....", "..K333..333K....", "...66....666....", "..K666..K666K..."],
  walk0: ["...K3333333K....", "...K33...333K...", "...66.....K66...", "..666......666.."],
  walk1: ["..K33333333K....", "..K33333333K....", "...666..666.....", "..K666..K666K..."],
  walk2: ["....K3333333K...", "..K333...333K...", ".K66.......66...", "666.......666..."],
  walk3: ["..K33333333K....", "..K33333333K....", "...666..666.....", "..K666..K666K..."],
  jump: ["..K3333333K.....", "..K333...333K...", ".K666.....66....", "666.......6666.."],
  fall: ["..K3333333K.....", "..K33.....333K..", "..K66.....K66...", ".6666....66666.."],
  land: ["..K33333333333..", "..K3333333333K..", ".K6666....6666K.", "666666....666666"],
  hurt: ["..K3333333K.....", ".K333.....333K..", "6666.......6666.", "666.........666."],
  skid: ["..K33333333K....", ".K3333..3333K...", "6666.......666..", "666.........666."],
};

const WIDE_LEGS: LegSet = {
  idle: [".K3333333333K...", ".K3333....333K..", ".K666......666..", "K6666K....K6666K"],
  walk0: [".K3333333333K...", ".K333......333K.", ".666........66..", "66666......6666."],
  walk1: [".K3333333333K...", ".K33333..3333K..", ".K666....K666...", "K6666K...K6666K."],
  walk2: ["..K3333333333K..", ".K333......333K.", "K666.........66.", "6666.......66666"],
  walk3: [".K3333333333K...", ".K33333..3333K..", ".K666....K666...", "K6666K...K6666K."],
  jump: [".K33333333333K..", ".K3333....333K..", "K666........66..", "6666.......6666."],
  fall: [".K3333333333K...", ".K33........33K.", "K666........666.", "66666......66666"],
  land: [".K3333333333333.", ".K33333333333K..", "K66666....66666K", "666666....666666"],
  hurt: [".K33333333K.....", "K3333......333K.", "6666.........666", "666...........66"],
  skid: [".K3333333333K...", "K33333...3333K..", "6666.........66.", "666...........66"],
};

const SHORT_LEGS: LegSet = {
  idle: ["................", "...K333333K.....", "...K33..33K.....", "...666..666....."],
  walk0: ["................", "...K333333K.....", "..K33....33.....", "..666.....66...."],
  walk1: ["................", "...K333333K.....", "...K333333K.....", "...66..666......"],
  walk2: ["................", "....K333333K....", "...33....K33....", "..66.......666.."],
  walk3: ["................", "...K333333K.....", "...K333333K.....", "...666.666......"],
  jump: ["................", "...K33333K......", "..K33...K33.....", "..666.....666..."],
  fall: ["................", "...K33333K......", "..K33.....33....", ".6666.....6666.."],
  land: ["................", "..K3333333333K..", "..K3333333333K..", ".66666....66666."],
  hurt: ["................", "..K333333K......", ".K33......33K...", "666.......666..."],
  skid: ["................", "..K3333333K.....", ".K333...333K....", "666.......666..."],
};

const GOWN_LEGS: LegSet = {
  idle: [".K1111111111K...", "K111111111111K..", "K155511115551K..", ".K66K......K66K."],
  walk0: [".K1111111111K...", "K11111111111K...", "K155511115551K..", "..K66K...K66K..."],
  walk1: ["..K11111111K....", ".K1111111111K...", "K115551155511K..", "..K666...K66K..."],
  walk2: [".K1111111111K...", "K111111111111K..", "K155511115551K..", "...K66K..K666K.."],
  walk3: ["..K11111111K....", ".K1111111111K...", "K115551155511K..", "..K666...K66K..."],
  jump: ["..K11111111K....", ".K1111111111K...", "K11155555511K...", "..K66K...K66K..."],
  fall: ["..K11111111K....", ".K1111111111K...", "K111555555111K..", ".K66K......K66K."],
  land: [".K111111111111..", "K11111111111111.", "K1555555555551K.", ".K66K......K66K."],
  hurt: ["..K11111111K....", ".K111111111K....", "K1155555511K....", "K66K.......K66K."],
  skid: [".K1111111111K...", "K11111111111K...", "K15551111551K...", "K66K.....K66K..."],
};

const LEG_SETS: Record<LegStyle, LegSet> = {
  normal: NORMAL_LEGS,
  wide: WIDE_LEGS,
  short: SHORT_LEGS,
  gown: GOWN_LEGS,
};

const blank = "................";

// ---------------------------------------------------------------- heroes

export type HeroRig =
  | "marco"
  | "gino"
  | "rosella"
  | "krogar"
  | "shroomy"
  | "riko"
  | "vex"
  | "bronn"
  | "kage";

export const HERO_ART: Record<HeroRig, HeroArt> = {
  /* Balanced hero: red cap, blue overalls, white gloves. */
  marco: {
    head: [
      "....KK1111K.....",
      "...K11111111K...",
      "..K1111111111K..",
      "..HHHSSSSSSSK...",
      ".HSHSSESSSSSSK..",
      ".HSHHSSSSSSSK...",
      ".HHSSHHHHHSSK...",
      "..KSSSSSSSSK....",
    ],
    torso: [
      ".K1111K33K111K..",
      "K1111335331111K.",
      "55K1333333331K55",
      ".5K1335533331K5.",
    ],
    attack: [
      ".K1111K33K111K..",
      "K1111335331111K.",
      "55K1333333331K..",
      ".5K13355331K.5X5",
    ],
    legs: "normal",
    palette: pal({
      primary: "#e83820",
      primaryDark: "#a01000",
      secondary: "#2858f8",
      secondaryDark: "#183090",
      accent: "#ffffff",
      boots: "#7c3800",
      hair: "#3c2000",
    }),
  },

  /* High jumper: taller, thinner, green cap, dark-blue overalls. */
  gino: {
    head: [
      "....K1111KK.....",
      "...K11111111K...",
      "...HHSSESSK.....",
      "..HSHSSSESSK....",
      "..HSHHSSSESSK...",
      "..HHSSSSSEEK....",
      "...KSSSSSSK.....",
      "....HHHHHH......",
    ],
    torso: [
      "...K11K33K11K...",
      "..K1133333311K..",
      "5.K1333333331K.5",
      "5K13335533331K5.",
    ],
    attack: [
      "...K11K33K11K...",
      "..K1133333311K..",
      "5.K133333333K...",
      ".K133355331K.55X",
    ],
    legs: "normal",
    palette: pal({
      primary: "#1cc830",
      primaryDark: "#00801c",
      secondary: "#1c2c78",
      secondaryDark: "#0c1440",
      accent: "#ffffff",
      boots: "#5c2c00",
      hair: "#3c2000",
    }),
  },

  /* Air glide: gown silhouette, gold crown, blonde hair. */
  rosella: {
    head: [
      "...5.5.5.5.5....",
      "..K55555555K....",
      "..HHHHHHHHHH....",
      ".HHSSSSSSSSHH...",
      ".HHSSESSSESSH...",
      ".HHSSSSSSSSSH...",
      ".HHSSSWWWSSSH...",
      ".HHHSSSSSSHHH...",
    ],
    torso: [
      "..HK1111111KH...",
      ".HK111555111KH..",
      "5K1115111511K5..",
      "5K1111111111K5..",
    ],
    attack: [
      "..HK1111111KH...",
      ".HK111555111KH..",
      "5K111511151K....",
      ".K11111111K.5X5.",
    ],
    legs: "gown",
    palette: pal({
      primary: "#fc8cd8",
      primaryDark: "#c03c98",
      secondary: "#ffffff",
      secondaryDark: "#d0d0e0",
      accent: "#fcd83c",
      boots: "#ffffff",
      hair: "#fcd83c",
      weapon: "#ff70b0",
    }),
  },

  /* Heavy tank: big body, green shell, yellow spikes, horns. */
  krogar: {
    head: [
      "..5.K1111K.5....",
      ".55K111111K55...",
      "..K11SSSS11K....",
      ".K11SEWSEWS1K...",
      ".K11SSSSSSS1K...",
      ".K1WKWKWKWK1K...",
      "..K11SSSSS1K....",
      "...K1111111K....",
    ],
    torso: [
      ".K1111111111K...",
      "K1155533355511K.",
      "K1335555555331K.",
      "K1335555555331K.",
    ],
    attack: [
      ".K1111111111K.5.",
      "K115553335551K55",
      "K13355555553K.55",
      "K13355555533K.5.",
    ],
    legs: "wide",
    palette: pal({
      primary: "#fc8018",
      primaryDark: "#a04800",
      secondary: "#1c7828",
      secondaryDark: "#004818",
      accent: "#fcec48",
      boots: "#a04800",
      skin: "#fcb040",
      hair: "#b03000",
    }),
  },

  /* Speed runner: short body, huge spotted mushroom cap, blue vest. */
  shroomy: {
    head: [
      "...KK5555KK.....",
      "..K55WWWW55K....",
      ".K5WWW55WWW5K...",
      ".K55WW5555WW5K..",
      ".KW5555WW555WK..",
      "..KSSSSSSSSK....",
      "..KSESSSSESK....",
      "...KSSSSSSK.....",
    ],
    torso: [
      "................",
      "...K33333333K...",
      "S.K311111113K.S.",
      "SK33111111133KS.",
    ],
    attack: [
      "................",
      "...K33333333K...",
      "S.K31111113K....",
      "SK33111113K..5X5",
    ],
    legs: "short",
    palette: pal({
      primary: "#ffffff",
      primaryDark: "#c8c8d8",
      secondary: "#2860f8",
      secondaryDark: "#102c90",
      accent: "#e82820",
      boots: "#f8c020",
    }),
  },

  /* Green knight: hood, brown tunic, sword and back shield. */
  riko: {
    head: [
      ".....K111K......",
      "....K11111K.....",
      "...K1111111K....",
      "...K1SSSSS1K....",
      "...K1SESSEK.....",
      "....KSSSSSK.....",
      "...K1111111K....",
      "..K11111111K.X..",
    ],
    torso: [
      ".K11333333311K.X",
      "K1333333333331KX",
      "S1333555533313SX",
      "SK13333333331KS.",
    ],
    attack: [
      ".K11333333311K..",
      "K13333333333K...",
      "S1333555331K.XXX",
      "SK13333333K..x..",
    ],
    legs: "normal",
    palette: pal({
      primary: "#18b45c",
      primaryDark: "#0c6c34",
      secondary: "#8c5424",
      secondaryDark: "#54300c",
      accent: "#fcd83c",
      boots: "#54300c",
      weapon: "#e8e8f8",
      weaponDark: "#8890a8",
    }),
  },

  /* Space warrior: sealed helmet, wide visor, backpack, blaster. */
  vex: {
    head: [
      "...KK1111KK.....",
      "..K11111111K....",
      "..K13333331K....",
      "..K13555553K....",
      "..K13555553K....",
      "..K13333331K....",
      "...K111111K.....",
      "...K3111113K....",
    ],
    torso: [
      "4K111111111K4...",
      "4K135555531K44..",
      "4K115555511K44..",
      ".K1111111111K...",
    ],
    attack: [
      "4K111111111K4...",
      "4K135555531K44..",
      "4K11555551K.XXX5",
      ".K11111111K..5..",
    ],
    legs: "normal",
    palette: pal({
      primary: "#fc8018",
      primaryDark: "#a84800",
      secondary: "#106878",
      secondaryDark: "#0a3c48",
      accent: "#5cfc48",
      boots: "#0a3c48",
      weapon: "#5cfc48",
      weaponDark: "#106878",
    }),
  },

  /* Barbarian: widest torso, blonde mane, leather straps, big axe. */
  bronn: {
    head: [
      "...HHHHHHHH.....",
      "..HHHHHHHHHH....",
      "..HHSSSSSSHH....",
      "..HSSESSESSH....",
      "..HSSSSSSSSH....",
      "..HHSSWWWSSHH...",
      "...HSSSSSSSH....",
      "...HHHHHHHH.X...",
    ],
    torso: [
      "SK1113333111KS.X",
      "S111335553311SXX",
      "S111335533111SXX",
      ".K1113333311K...",
    ],
    attack: [
      "XXK11133311KS...",
      "XX11133553311S..",
      ".X1113333311S...",
      ".K111333311K....",
    ],
    legs: "wide",
    palette: pal({
      primary: "#a86828",
      primaryDark: "#6c3c10",
      secondary: "#e8c078",
      secondaryDark: "#a8823c",
      accent: "#fcd83c",
      boots: "#54300c",
      hair: "#fcd83c",
      weapon: "#d8dcec",
      weaponDark: "#7c8298",
    }),
  },

  /* Blue ninja: covered face, red scarf, dual kunai, narrow build. */
  kage: {
    head: [
      "....K1111K......",
      "...K111111K.....",
      "...K311113K.....",
      "...KSSSSSSK.....",
      "...KSEESEEK.....",
      "...K311113K.....",
      "....K1111K......",
      "..555K11K5......",
    ],
    torso: [
      "..K11333311K....",
      ".5K11333311K....",
      "5S1133333311S.X.",
      ".K113333331K..X.",
    ],
    attack: [
      "..K11333311K....",
      ".5K11333311K....",
      "5S113333331S.XXX",
      ".K1133333K...x..",
    ],
    legs: "normal",
    palette: pal({
      primary: "#2848c8",
      primaryDark: "#101c60",
      secondary: "#101c60",
      secondaryDark: "#080c30",
      accent: "#e82820",
      boots: "#080c30",
      weapon: "#d8d8e8",
      weaponDark: "#606074",
    }),
  },
};

/**
 * Authoring resolution of every row string in this file.
 * Never change this — rows are hand-drawn at 16x16.
 */
export const HERO_SOURCE_GRID: number = 16;

/**
 * Render resolution. Bump this (e.g. 16 -> 24 -> 32) to regenerate every hero
 * at higher detail without editing a single row: the authored 16x16 grid is
 * resampled, staircases are rounded off and a shading pass adds depth.
 * Must be a multiple of 8 and >= HERO_SOURCE_GRID.
 */
export const HERO_GRID: number = 32;

/** Output pixels per grid cell in the generated hero textures (painted look). */
export const HERO_PX: number = 4;

/** Darker companion for each colour, used by the auto-shading pass. */
const SHADE_OF: Record<string, string> = { "1": "2", "3": "4", S: "s", X: "x", "5": "5", W: "2" };

function resample(rows: readonly string[], to: number): string[] {
  const from = rows.length;
  const out: string[] = [];
  for (let y = 0; y < to; y++) {
    const sy = Math.min(from - 1, Math.floor((y * from) / to));
    const src = rows[sy]!;
    let line = "";
    for (let x = 0; x < to; x++) {
      const sx = Math.min(src.length - 1, Math.floor((x * from) / to));
      line += src[sx] ?? ".";
    }
    out.push(line);
  }
  return out;
}

/** Round off the hard staircases the resample leaves behind. */
function deJaggy(rows: string[]): string[] {
  const g = rows.map((r) => r.split(""));
  const h = g.length;
  const w = g[0]!.length;
  const at = (x: number, y: number): string => (y < 0 || y >= h || x < 0 || x >= w ? "." : g[y]![x]!);
  const out = g.map((r) => [...r]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (at(x, y) !== ".") continue;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
      ] as const) {
        const side = at(x + dx, y);
        if (side === "." ) continue;
        for (const dyy of [-1, 1]) {
          if (at(x, y + dyy) === side && at(x + dx, y + dyy) === side) {
            out[y]![x] = side;
          }
        }
      }
    }
  }
  return out.map((r) => r.join(""));
}

/** Add a one-pixel darker rim under every solid run, for chunky volume. */
function shade(rows: string[]): string[] {
  const g = rows.map((r) => r.split(""));
  const h = g.length;
  const w = g[0]!.length;
  const out = g.map((r) => [...r]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = g[y]![x]!;
      const dark = SHADE_OF[c];
      if (!dark || dark === c) continue;
      const below = y + 1 < h ? g[y + 1]![x]! : ".";
      const right = x + 1 < w ? g[y]![x + 1]! : ".";
      if ((below === "." || below === "K") && (right === "." || right === "K" || right === c)) {
        out[y]![x] = dark;
      }
    }
  }
  return out.map((r) => r.join(""));
}

/** Compose the full pose grid, resampled to HERO_GRID. */
export function heroPose(rig: HeroRig, pose: HeroPose): readonly string[] {
  const art = HERO_ART[rig];
  const legSet = LEG_SETS[art.legs];
  const legKey = pose.startsWith("attack") ? "idle" : pose === "idle2" ? "idle" : pose;
  const legs = legSet[legKey] ?? legSet["idle"]!;
  const torso = pose.startsWith("attack") ? art.attack : art.torso;
  const head = pose === "idle2" ? [blank, ...art.head.slice(0, art.head.length - 1)] : art.head;
  const rows = [...head, ...torso, ...legs].map((r) =>
    r.length >= HERO_SOURCE_GRID
      ? r.slice(0, HERO_SOURCE_GRID)
      : r + ".".repeat(HERO_SOURCE_GRID - r.length),
  );
  if (HERO_GRID === HERO_SOURCE_GRID) return rows;
  return shade(deJaggy(resample(rows, HERO_GRID)));
}
