import type Phaser from "phaser";
import { COLORS, TILE } from "../config";
import { CHARACTERS } from "../data/characters";

type Ctx = CanvasRenderingContext2D;

const hex = (c: number): string => `#${c.toString(16).padStart(6, "0")}`;

/** Chunky pixel size: art is drawn full size, crushed down, then blown back up. */
const PX = 2;

function make(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: Ctx) => void,
  pixelate = true,
): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  draw(ctx);

  if (pixelate) {
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.round(w / PX));
    small.height = Math.max(1, Math.round(h / PX));
    const sctx = small.getContext("2d");
    if (sctx) {
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(canvas, 0, 0, small.width, small.height);
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, w, h);
    }
  }

  scene.textures.addCanvas(key, canvas);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/** NES-era pixel painter: each char of each row is one fat pixel. */
const PALETTE: Record<string, string> = {
  R: "#d82800", // cap / shirt red
  r: "#a01000", // red shade
  H: "#883000", // brown overalls / hair / boots
  S: "#fca044", // skin
  K: "#000000",
  W: "#ffffff",
  Y: "#fcd83c",
  B: "#d84000", // goomba body
  b: "#a02800",
  G: "#00a800", // koopa shell green
  g: "#007800",
  O: "#f8b800", // koopa skin / feet
  P: "#e03c28", // piranha head
  p: "#a01810",
  N: "#00a800", // piranha stem
  V: "#7c3cfc", // spiker body
  v: "#4c18b0",
  C: "#3cbcfc", // Mira cyan
  c: "#0058f8",
};

function paint(
  ctx: Ctx,
  rows: readonly string[],
  px: number,
  ox = 0,
  oy = 0,
  override: Record<string, string> = {},
): void {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x]!;
      const fill = override[c] ?? PALETTE[c];
      if (!fill) continue;
      ctx.fillStyle = fill;
      ctx.fillRect(ox + x * px, oy + y * px, px, px);
    }
  });
}

const HERO_HEAD: readonly string[] = [
  "....RRRRR.......",
  "...RRRRRRRRRR...",
  "...HHHSSKS......",
  "..HSHSSSKSSS....",
  "..HSHHSSSKSSS...",
  "..HHSSSSSKKKK...",
  "....SSSSSSSS....",
  "...HHRRHRRH.....",
];

/** Distinct silhouettes so every hero reads as its own character in-game. */
export type HeroRig = "riko" | "princess" | "ninja" | "hunter" | "whip" | "ranger";

const HEADS: Record<HeroRig, readonly string[]> = {
  riko: HERO_HEAD,
  princess: [
    ".....Y.Y.Y......",
    "....YYYYYYY.....",
    "...HHHSSSSHH....",
    "..HHSSSSSSSHH...",
    "..HHSSKSSKSSH...",
    "..HHSSSSSSSSH...",
    "...HSSSSSSSH....",
    "...HHRRRRHH.....",
  ],
  ninja: [
    "....RRRRRRR.....",
    "...RRRRRRRRR....",
    "...RRRRRRRRR....",
    "..RRSSKSSKSSR...",
    "..RRSSSSSSSSR...",
    "..RRRRRRRRRRR...",
    "....RRRRRRR.....",
    "...HHRRRRHH.....",
  ],
  hunter: [
    "....YYYYYYY.....",
    "...YYYYYYYYY....",
    "..YYRRRRRRRYY...",
    "..YYRWWWWWRYY...",
    "..YYRRRRRRRYY...",
    "...YYYYYYYYY....",
    "....YY...YY.....",
    "...HHRRRRHH.....",
  ],
  whip: [
    "....YYYYYY......",
    "...YYYYYYYYY....",
    "...RRRRRRRRR....",
    "..YYSSKSSKSSY...",
    "..YSSSSSSSSY....",
    "...SSSSSSSS.....",
    "....SSSSSS......",
    "...HHRRRRHH.....",
  ],
  ranger: [
    ".....RRR........",
    "....RRRRRR......",
    "...RRRRRRRRR....",
    "..RRRSSKSSKR....",
    "..RRSSSSSSSR....",
    "...RSSSSSSR.....",
    "....SSSSSS......",
    "...HHRRRRHH.....",
  ],
};

export function rigForCharacter(c: {
  archetype?: string;
  specialAbility?: string;
  canDoubleJump?: boolean;
}): HeroRig {
  const tag = `${c.archetype ?? ""} ${c.specialAbility ?? ""}`;
  if (/Princess|Doll|Dancer|Royal|Crown/i.test(tag)) return "princess";
  if (/Ninja|Shadow|Shade|Stealth|Ghost|Night/i.test(tag)) return "ninja";
  if (/Hunter|Armour|Armor|Beam|Cannon|Iron|Guard|Blaster/i.test(tag)) return "hunter";
  if (/Whip|Ranger|Vine|Lash|Hammer|Brawl/i.test(tag)) return "whip";
  if (/Blade|Scout|Sword|Slash|Claw|Explorer/i.test(tag)) return "ranger";
  return "riko";
}

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
  | "skid";

/** Torso + leg variants keep the classic four-frame run cycle readable. */
function heroPixels(pose: HeroPose, rig: HeroRig = "riko"): readonly string[] {
  const torso =
    pose === "jump" || pose === "fall"
      ? [
          "S.HHHRRHRRHHH.SS",
          "SSHHHRRRRRRHHHSS",
          "SSHHRYRRRRYRHH.S",
          "..HRRRRRRRRRRH..",
        ]
      : pose === "land"
        ? [
            "................",
            "SSHHHRRRRRRHHHSS",
            "SSHHRYRRRRYRHHSS",
            "SSHRRRRRRRRRRHSS",
          ]
        : [
          "..HHHRRHRRHHH...",
          ".HHHHRRRRRRHHHH.",
          "SSHHRYRRRRYRHHSS",
          "SSHRRRRRRRRRRHSS",
        ];
  const legs =
    pose === "walk0"
      ? ["...RRRRRRRRR....", "...RRRR..RRRR...", "...HHH....HHHH..", "..HHHH....HHHHH."]
      : pose === "walk2"
        ? ["....RRRRRRRRR...", "..RRRR...RRRR...", ".HHHH.....HHH...", "HHHHH....HHHH..."]
        : pose === "walk1" || pose === "walk3"
          ? ["..RRRRRRRRRRR...", "..RRRRRRRRRR....", "...HHHH..HHH....", "..HHHH...HHHH..."]
          : pose === "jump"
          ? ["..RRRRRRRRRR....", "..RRRR...RRRR...", ".HHHH.....HHH...", "HHHH.....HHHHH.."]
          : pose === "fall"
            ? ["..RRRRRRRRRR....", "..RRR.....RRRR..", "..HHH.....HHH...", ".HHHH....HHHHH.."]
            : pose === "land"
              ? ["..RRRRRRRRRRRR..", "..RRRRRRRRRRRR..", ".HHHHH....HHHHH.", "HHHHHH....HHHHHH"]
              : pose === "hurt"
              ? ["..RRRRRRRRRR....", ".RRRR.....RRRR..", "HHHH.......HHHH.", "HHH.........HHH."]
              : pose === "skid"
                ? ["..RRRRRRRRR.....", ".RRRRR..RRRR....", "HHHH.......HHH..", "HHH.........HHH."]
                : ["..RRRRRRRRRRRR..", "..RRRR....RRRR..", "..HHH......HHH..", ".HHHH......HHHH."];
  const head = HEADS[rig];
  // idle2 is the breathing frame: the head settles one pixel row lower.
  const rows = pose === "idle2" ? [".".repeat(16), ...head.slice(0, head.length - 1)] : head;
  return [...rows, ...torso, ...legs];
}

/** All artwork is drawn procedurally here - the build ships no external art. */
export function buildTextures(scene: Phaser.Scene): void {
  // ---- terrain ----
  // Ground is a bricked slab, like the classic overworld floor.
  const groundBricks = (ctx: Ctx, top: boolean): void => {
    ctx.fillStyle = hex(COLORS.grassBodyDark);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(COLORS.grassBody);
    const rows = 2;
    for (let row = 0; row < rows; row++) {
      const off = row % 2 === 0 ? 0 : 8;
      for (let x = -16; x < TILE; x += 16) {
        ctx.fillRect(x + off + 2, row * 16 + 2, 14, 12);
      }
    }
    if (top) {
      ctx.fillStyle = hex(0xfcbc90);
      for (let x = -16; x < TILE; x += 16) ctx.fillRect(x + 2, 2, 14, 3);
    }
  };
  make(scene, "tile_top", TILE, TILE, (ctx) => groundBricks(ctx, true));
  make(scene, "tile_dirt", TILE, TILE, (ctx) => groundBricks(ctx, false));
  make(scene, "tile_stone", TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(0x9c4a00);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(0xd07030);
    ctx.fillRect(2, 2, TILE - 4, TILE - 4);
    ctx.fillStyle = hex(0xfcbc90);
    ctx.fillRect(2, 2, TILE - 4, 4);
  });
  make(scene, "tile_platform", TILE, 16, (ctx) => {
    ctx.fillStyle = hex(0x902800);
    ctx.fillRect(0, 0, TILE, 16);
    ctx.fillStyle = hex(COLORS.brick);
    ctx.fillRect(2, 2, 12, 12);
    ctx.fillRect(18, 2, 12, 12);
  });

  // ---- blocks ----
  make(scene, "block_brick", TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(COLORS.brickDark);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(COLORS.brick);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 === 0 ? 0 : 8;
      for (let x = -8; x < TILE; x += 16) ctx.fillRect(x + off + 1, row * 8 + 1, 14, 6);
    }
  });
  make(scene, "block_question", TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(0x000000);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(COLORS.questionDark);
    ctx.fillRect(2, 2, TILE - 4, TILE - 4);
    ctx.fillStyle = hex(COLORS.question);
    ctx.fillRect(4, 4, TILE - 8, TILE - 8);
    ctx.fillStyle = hex(0xffffff);
    for (const [x, y] of [[5, 5], [24, 5], [5, 24], [24, 24]] as const) ctx.fillRect(x, y, 3, 3);
    ctx.fillStyle = hex(0x000000);
    ctx.font = "bold 22px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 16, 18);
  });
  make(scene, "block_empty", TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(0x000000);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(0x7c4c00);
    ctx.fillRect(2, 2, TILE - 4, TILE - 4);
    ctx.fillStyle = hex(0xac7c00);
    ctx.fillRect(4, 4, TILE - 8, TILE - 8);
  });
  make(scene, "block_metal", TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(0x6f7887);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(COLORS.metal);
    ctx.fillRect(2, 2, TILE - 4, TILE - 4);
    ctx.fillStyle = hex(0x5a6270);
    for (const [x, y] of [[5, 5], [23, 5], [5, 23], [23, 23]] as const) {
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // ---- heroes ----
  // Every playable character shares the same original rig; the roster entry
  // supplies a palette override so each hero reads distinctly at 8-bit scale.
  const POSES: HeroPose[] = [
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
  ];
  const poseKey = (pose: HeroPose): string =>
    pose.startsWith("walk") ? `walk_${pose.slice(4)}` : pose;
  for (const character of Object.values(CHARACTERS)) {
    const rig = rigForCharacter(character);
    for (const pose of POSES) {
      make(
        scene,
        `${character.spritePrefix}_${poseKey(pose)}`,
        32,
        48,
        (ctx) => paint(ctx, heroPixels(pose, rig), 2, 0, 16, character.tint),
        false,
      );
    }
  }

  // Spiked roller: never stompable, spikes ring the whole shell.
  const spikerBody = (swap: boolean): readonly string[] => [
    "....K..K..K..K..",
    "...KKK.KK.KKK...",
    "..KKVVVVVVVVKK..",
    ".KVVVVVVVVVVVVK.",
    "KVVWWVVVVVVWWVVK",
    "KVVWKVVVVVVKWVVK",
    "KVVVVVVVVVVVVVVK",
    "KVvvvvvvvvvvvvVK",
    "KVvvvvvvvvvvvvVK",
    ".KVvvvvvvvvvvVK.",
    "..KKvvvvvvvvKK..",
    "...KKK.KK.KKK...",
    "....K..K..K..K..",
    swap ? "..OO........OO.." : "...OO......OO...",
    swap ? "..OO........OO.." : "...OO......OO...",
    "................",
  ];
  make(scene, "spiker_0", 32, 32, (ctx) => paint(ctx, spikerBody(false), 2), false);
  make(scene, "spiker_1", 32, 32, (ctx) => paint(ctx, spikerBody(true), 2), false);

  // ---- enemies ----
  // Mushroom-shaped stomper: brown dome, white eyes with hard pupils, two dark feet.
  const walkerBody: readonly string[] = [
    ".....KKKKKK.....",
    "...KKBBBBBBKK...",
    "..KBBBBBBBBBBK..",
    "..KBBBBBBBBBBK..",
    ".KBWWKBBBBKWWBK.",
    ".KBWKKBBBBKKWBK.",
    ".KBWKKBBBBKKWBK.",
    ".KBBBBBBBBBBBBK.",
    "KBBBBBBBBBBBBBBK",
    "KBbbbbbbbbbbbbBK",
    "KBbbbbbbbbbbbbBK",
    "KWWWWWKKKKWWWWWK",
  ];
  const walkerFeet = (swap: boolean): readonly string[] =>
    swap
      ? [".KKKKK.....KKKK.", "KKKKK.......KKK.", "................", "................"]
      : [".KKKK.....KKKKK.", ".KKK.......KKKKK", "................", "................"];
  make(scene, "walker_0", 32, 32, (ctx) => paint(ctx, [...walkerBody, ...walkerFeet(false)], 2), false);
  make(scene, "walker_1", 32, 32, (ctx) => paint(ctx, [...walkerBody, ...walkerFeet(true)], 2), false);
  make(
    scene,
    "walker_flat",
    32,
    32,
    (ctx) =>
      paint(
        ctx,
        [
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "................",
          "..KKKKKKKKKKKK..",
          ".KBBBBBBBBBBBBK.",
          "KWWWWWKKKKWWWWWK",
          "KKKKKKKKKKKKKKKK",
          "................",
          "................",
        ],
        2,
      ),
    false,
  );

  // Shelled patroller: yellow head, green domed shell, alternating boots.
  const koopaTop: readonly string[] = [
    "....KKKK........",
    "...KOOOOK.......",
    "...KOWKOK.......",
    "...KOOOOK.......",
    "....KOOKKK......",
    "...KKOOOOKK.....",
    "..KKGGGGGGKKK...",
    ".KGGgGGgGGgGGK..",
    "KGgGGgGGgGGgGGK.",
    "KGGgGGgGGgGGgGK.",
    "KYYYYYYYYYYYYYK.",
    ".KKKKKKKKKKKKK..",
  ];
  const koopaFeet = (swap: boolean): readonly string[] =>
    swap
      ? ["..KOOK....KOOK..", "..KOOOK...KOOK..", "................", "................"]
      : ["..KOOK....KOOK..", "..KOOK...KOOOK..", "................", "................"];
  make(scene, "shell_0", 32, 32, (ctx) => paint(ctx, [...koopaTop, ...koopaFeet(false)], 2), false);
  make(scene, "shell_1", 32, 32, (ctx) => paint(ctx, [...koopaTop, ...koopaFeet(true)], 2), false);
  make(
    scene,
    "shell_hidden",
    32,
    32,
    (ctx) =>
      paint(
        ctx,
        [
          "................",
          "................",
          "................",
          "................",
          "....KKKKKKK.....",
          "..KKGGGGGGGKK...",
          ".KGGgGGgGGgGGK..",
          "KGgGGgGGgGGgGGK.",
          "KGGgGGgGGgGGgGK.",
          "KGgGGgGGgGGgGGK.",
          "KYYYYYYYYYYYYYK.",
          ".KKKKKKKKKKKKK..",
          "................",
          "................",
          "................",
          "................",
        ],
        2,
      ),
    false,
  );

  // Pipe-dwelling biter: toothy head on a green stem, 16x24 grid.
  const piranhaHead = (open: boolean): readonly string[] => [
    "....PPPPPPPP....",
    "..PPWWPPPPWWPP..",
    "..PPPPPPPPPPPP..",
    ".PPPPPPPPPPPPPP.",
    open ? ".PWPWPWPWPWPWWP." : ".PPPPPPPPPPPPPP.",
    open ? ".WKKKKKKKKKKKKW." : ".PWPWPWPWPWPWWP.",
    open ? ".WKKKKKKKKKKKKW." : ".PWPWPWPWPWPWWP.",
    open ? ".PWPWPWPWPWPWWP." : ".PPPPPPPPPPPPPP.",
    ".PPPPPPPPPPPPPP.",
    "..PPPPPPPPPPPP..",
    "..PPWWPPPPWWPP..",
    "....PPPPPPPP....",
  ];
  const piranhaStem: readonly string[] = [
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
    ".....NNNNNN.....",
  ];
  make(scene, "piranha_0", 32, 48, (ctx) => paint(ctx, [...piranhaHead(true), ...piranhaStem], 2), false);
  make(scene, "piranha_1", 32, 48, (ctx) => paint(ctx, [...piranhaHead(false), ...piranhaStem], 2), false);

  const flyer = (ctx: Ctx, up: boolean): void => {
    ctx.fillStyle = hex(0xe4c2ff);
    ctx.beginPath();
    ctx.ellipse(6, up ? 10 : 20, 8, 5, up ? -0.6 : 0.6, 0, Math.PI * 2);
    ctx.ellipse(26, up ? 10 : 20, 8, 5, up ? 0.6 : -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(COLORS.flyer);
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0xfdf6ff);
    ctx.beginPath();
    ctx.arc(12, 14, 3, 0, Math.PI * 2);
    ctx.arc(20, 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0x1d2430);
    ctx.beginPath();
    ctx.arc(12.6, 14, 1.5, 0, Math.PI * 2);
    ctx.arc(20.6, 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
  };
  make(scene, "flyer_0", 32, 32, (ctx) => flyer(ctx, true));
  make(scene, "flyer_1", 32, 32, (ctx) => flyer(ctx, false));

  // ---- items ----
  for (let i = 0; i < 4; i++) {
    const w = [20, 12, 5, 12][i]!;
    make(scene, `coin_${i}`, 24, 24, (ctx) => {
      ctx.fillStyle = hex(0xc59b1d);
      ctx.beginPath();
      ctx.ellipse(12, 12, w / 2, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hex(COLORS.coin);
      ctx.beginPath();
      ctx.ellipse(12, 12, Math.max(1.5, w / 2 - 2), 9, 0, 0, Math.PI * 2);
      ctx.fill();
      if (w > 8) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(10, 5, 2, 14);
      }
    });
  }
  make(scene, "relic", 34, 34, (ctx) => {
    ctx.fillStyle = hex(0xd9a419);
    ctx.beginPath();
    ctx.arc(17, 17, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(COLORS.relic);
    ctx.beginPath();
    ctx.arc(17, 17, 12.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0xb8860b);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const b = a + Math.PI / 5;
      ctx.lineTo(17 + Math.cos(a) * 9, 17 + Math.sin(a) * 9);
      ctx.lineTo(17 + Math.cos(b) * 4, 17 + Math.sin(b) * 4);
    }
    ctx.closePath();
    ctx.fill();
  });
  make(scene, "item_orb", 28, 28, (ctx) => {
    ctx.fillStyle = hex(0x2f7a43);
    ctx.beginPath();
    ctx.arc(14, 14, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(COLORS.orb);
    ctx.beginPath();
    ctx.arc(14, 14, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(10, 10, 3.4, 0, Math.PI * 2);
    ctx.fill();
  });
  make(scene, "item_crystal", 28, 28, (ctx) => {
    ctx.fillStyle = hex(0xa02f14);
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(28, 14);
    ctx.lineTo(14, 28);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hex(COLORS.crystal);
    ctx.beginPath();
    ctx.moveTo(14, 4);
    ctx.lineTo(24, 14);
    ctx.lineTo(14, 24);
    ctx.lineTo(4, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hex(0xffd08a);
    ctx.beginPath();
    ctx.moveTo(14, 8);
    ctx.lineTo(19, 14);
    ctx.lineTo(14, 17);
    ctx.closePath();
    ctx.fill();
  });
  make(scene, "item_oneup", 28, 28, (ctx) => {
    ctx.fillStyle = hex(0x1f8f5f);
    roundRect(ctx, 0, 0, 28, 28, 8);
    ctx.fillStyle = hex(0xd6ffe9);
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1UP", 14, 15);
  });
  make(scene, "fireball", 16, 16, (ctx) => {
    ctx.fillStyle = hex(0xffd27a);
    ctx.beginPath();
    ctx.arc(8, 8, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(COLORS.crystal);
    ctx.beginPath();
    ctx.arc(8, 8, 4.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Banana power-up: turns the hero into the monkey form.
  make(scene, "item_banana", 28, 28, (ctx) => {
    ctx.fillStyle = hex(0x2a1a06);
    ctx.beginPath();
    ctx.arc(14, 15, 13, 0.15 * Math.PI, 0.95 * Math.PI);
    ctx.arc(14, 11, 11, 0.95 * Math.PI, 0.15 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hex(0xfcd83c);
    ctx.beginPath();
    ctx.arc(14, 14, 11, 0.15 * Math.PI, 0.95 * Math.PI);
    ctx.arc(14, 11, 9, 0.95 * Math.PI, 0.15 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hex(0x8a5a00);
    ctx.fillRect(3, 6, 4, 4);
    ctx.fillRect(21, 6, 4, 4);
  });

  // Cat bell power-up: unlocks the clawed cat form.
  make(scene, "item_bell", 28, 28, (ctx) => {
    ctx.fillStyle = hex(0x2a1a06);
    ctx.fillRect(4, 4, 20, 20);
    ctx.fillStyle = hex(0xfcd83c);
    ctx.fillRect(6, 8, 16, 14);
    ctx.fillStyle = hex(0xfff3a8);
    ctx.fillRect(8, 10, 5, 5);
    ctx.fillStyle = hex(0x2a1a06);
    ctx.fillRect(11, 17, 6, 6);
    ctx.fillRect(12, 2, 4, 5);
  });

  // Alternate throwables — one signature shot per hero / form.
  const shot = (key: string, core: number, rim: number, square = false) =>
    make(scene, key, 16, 16, (ctx) => {
      ctx.fillStyle = hex(rim);
      if (square) ctx.fillRect(1, 1, 14, 14);
      else {
        ctx.beginPath();
        ctx.arc(8, 8, 7.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = hex(core);
      if (square) ctx.fillRect(3, 3, 10, 10);
      else {
        ctx.beginPath();
        ctx.arc(8, 8, 4.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  shot("shot_banana", 0xfcd83c, 0x8a5a00);
  shot("shot_claw", 0xfcfcfc, 0x00b8f8);
  shot("shot_hammer", 0xa8a8a8, 0x502000, true);
  shot("shot_egg", 0xfcfcfc, 0x00a844);
  shot("shot_star", 0xfcfcfc, 0xfcd83c);
  shot("shot_pellet", 0xfcd83c, 0xa44400);
  shot("shot_beam", 0x00b8f8, 0xfcfcfc, true);
  shot("shot_bubble", 0xb8f8f8, 0x0058f8);
  shot("shot_shell", 0x00a844, 0x006810, true);
  shot("shot_shadow", 0x7c3cfc, 0x181818);
  shot("shot_vine", 0xa8f800, 0x006810, true);
  shot("shot_ice", 0xb8f8f8, 0x3cbcfc, true);
  make(scene, "particle", 8, 8, (ctx) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 8, 8);
  });

  // Sky Star: the level-2 objective pickup.
  make(
    scene,
    "star",
    32,
    32,
    (ctx) =>
      paint(
        ctx,
        [
          ".......YY.......",
          "......YYYY......",
          "......YYYY......",
          ".....YYYYYY.....",
          "YYYYYYYYYYYYYYYY",
          "YYYYYYYYYYYYYYYY",
          ".YYYYYYYYYYYYYY.",
          "..YYYYYYYYYYYY..",
          "..YYYKYYYYKYYY..",
          "..YYYYYYYYYYYY..",
          ".YYYYY....YYYYY.",
          ".YYYY......YYYY.",
          "YYYY........YYYY",
          "YYY..........YYY",
          ".Y............Y.",
          "................",
        ],
        2,
      ),
    false,
  );

  // ---- level furniture ----
  make(scene, "checkpoint", 24, 72, (ctx) => {
    ctx.fillStyle = hex(0x6b7280);
    ctx.fillRect(9, 6, 6, 66);
    ctx.fillStyle = hex(0x9aa4b2);
    ctx.beginPath();
    ctx.arc(12, 6, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  make(scene, "checkpoint_on", 24, 72, (ctx) => {
    ctx.fillStyle = hex(0x6b7280);
    ctx.fillRect(9, 6, 6, 66);
    ctx.fillStyle = hex(COLORS.checkpoint);
    ctx.beginPath();
    ctx.arc(12, 6, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0xdff4ff);
    ctx.beginPath();
    ctx.moveTo(15, 10);
    ctx.lineTo(15, 30);
    ctx.lineTo(38, 20);
    ctx.closePath();
    ctx.fill();
  });
  make(scene, "goal_pole", 16, 320, (ctx) => {
    ctx.fillStyle = hex(0xcbd5e1);
    ctx.fillRect(5, 8, 6, 312);
    ctx.fillStyle = hex(COLORS.flag);
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  make(scene, "goal_flag", 44, 32, (ctx) => {
    ctx.fillStyle = hex(COLORS.flag);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(44, 10);
    ctx.lineTo(0, 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.arc(13, 12, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  make(scene, "pipe", 64, 64, (ctx) => {
    // Rim
    ctx.fillStyle = hex(0x005000);
    ctx.fillRect(0, 0, 64, 16);
    ctx.fillStyle = hex(COLORS.pipe);
    ctx.fillRect(2, 2, 60, 12);
    ctx.fillStyle = hex(0xa0f0a0);
    ctx.fillRect(6, 4, 8, 8);
    // Shaft
    ctx.fillStyle = hex(0x005000);
    ctx.fillRect(6, 16, 52, 48);
    ctx.fillStyle = hex(COLORS.pipe);
    ctx.fillRect(8, 16, 48, 48);
    ctx.fillStyle = hex(0xa0f0a0);
    ctx.fillRect(12, 16, 8, 48);
    ctx.fillStyle = hex(0x007800);
    ctx.fillRect(44, 16, 10, 48);
  });
  make(scene, "spike", TILE, 16, (ctx) => {
    ctx.fillStyle = hex(0x9aa4b2);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, 16);
      ctx.lineTo(i * 8 + 4, 0);
      ctx.lineTo(i * 8 + 8, 16);
      ctx.closePath();
      ctx.fill();
    }
  });

  // ---- parallax ----
  // Stepped, flat-shaded scenery in the console-era style.
  const lumps = (ctx: Ctx, x: number, y: number, s: number, color: string, cap: string | null): void => {
    ctx.fillStyle = color;
    const w = 28 * s;
    ctx.fillRect(x - w * 1.5, y - 14 * s, w * 3, 14 * s);
    ctx.fillRect(x - w, y - 26 * s, w * 2, 12 * s);
    ctx.fillRect(x - w * 0.5, y - 36 * s, w, 10 * s);
    if (cap) {
      ctx.fillStyle = cap;
      ctx.fillRect(x - w * 0.5, y - 36 * s, w * 0.5, 4 * s);
      ctx.fillRect(x - w, y - 22 * s, w * 0.4, 4 * s);
    }
  };

  make(scene, "bg_clouds", 640, 260, (ctx) => {
    const cloud = (x: number, y: number, s: number): void => {
      lumps(ctx, x, y, s, "#ffffff", null);
      ctx.fillStyle = hex(0xb8d8ff);
      ctx.fillRect(x - 42 * s, y - 6 * s, 84 * s, 6 * s);
    };
    cloud(110, 90, 1);
    cloud(340, 56, 0.8);
    cloud(540, 120, 1.1);
    cloud(230, 200, 0.7);
  });
  make(scene, "bg_hills_far", 640, 260, (ctx) => {
    ctx.fillStyle = hex(COLORS.hillFar);
    for (let i = 0; i < 4; i++) lumps(ctx, i * 180 + 80, 260, 1.6, hex(COLORS.hillFar), hex(0x006000));
  });
  make(scene, "bg_hills_near", 640, 220, (ctx) => {
    for (let i = 0; i < 5; i++) lumps(ctx, i * 140 + 60, 220, 1.15, hex(COLORS.hillNear), hex(0x006000));
  });
  make(scene, "bg_trees", 640, 180, (ctx) => {
    // Low bush hedge, flat green, hard silhouette.
    for (let i = 0; i < 8; i++) {
      lumps(ctx, i * 82 + 40, 180, 0.8 + ((i * 13) % 5) / 10, hex(COLORS.treeline), hex(0x00c000));
    }
  });
}
