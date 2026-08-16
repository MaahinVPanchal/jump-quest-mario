import type Phaser from "phaser";
import { COLORS, TILE } from "../config";

type Ctx = CanvasRenderingContext2D;

const hex = (c: number): string => `#${c.toString(16).padStart(6, "0")}`;

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  draw(ctx);
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

function heroBody(ctx: Ctx, opts: { legOffset: number; arm: number; squash?: number; hurt?: boolean }): void {
  const { legOffset, arm } = opts;
  const s = opts.squash ?? 1;
  ctx.save();
  ctx.translate(16, 44);
  ctx.scale(1 / s, s);
  ctx.translate(-16, -44);

  // legs
  ctx.fillStyle = hex(0x2b2f3a);
  roundRect(ctx, 9 + legOffset, 34, 6, 10, 3);
  roundRect(ctx, 17 - legOffset, 34, 6, 10, 3);
  // boots
  ctx.fillStyle = hex(COLORS.heroAccent);
  roundRect(ctx, 8 + legOffset, 40, 8, 5, 2);
  roundRect(ctx, 16 - legOffset, 40, 8, 5, 2);
  // torso
  ctx.fillStyle = hex(opts.hurt ? 0xff8f9b : COLORS.hero);
  roundRect(ctx, 8, 20, 16, 17, 6);
  // scarf
  ctx.fillStyle = hex(COLORS.heroAccent);
  roundRect(ctx, 7, 18, 18, 6, 3);
  ctx.beginPath();
  ctx.moveTo(23, 20);
  ctx.lineTo(31, 22 - arm);
  ctx.lineTo(24, 27);
  ctx.closePath();
  ctx.fill();
  // arms
  ctx.fillStyle = hex(opts.hurt ? 0xff8f9b : COLORS.heroDark);
  roundRect(ctx, 4, 23 - arm, 6, 11, 3);
  roundRect(ctx, 22, 23 + arm, 6, 11, 3);
  // gloves
  ctx.fillStyle = hex(0xfdf6e3);
  roundRect(ctx, 3, 32 - arm, 7, 6, 3);
  roundRect(ctx, 22, 32 + arm, 7, 6, 3);
  // head
  ctx.fillStyle = hex(0xffe0bd);
  roundRect(ctx, 6, 2, 20, 19, 8);
  // goggles
  ctx.fillStyle = hex(COLORS.heroDark);
  roundRect(ctx, 5, 3, 22, 6, 3);
  ctx.fillStyle = hex(0x9be7ff);
  roundRect(ctx, 8, 3, 6, 5, 2);
  roundRect(ctx, 18, 3, 6, 5, 2);
  // eyes
  ctx.fillStyle = hex(0x232733);
  roundRect(ctx, 11, 11, 3, 5, 1.5);
  roundRect(ctx, 19, 11, 3, 5, 1.5);
  // smile
  ctx.strokeStyle = hex(0xc98a63);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(16, 16, 4, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

/** All artwork is drawn procedurally here - the build ships no external art. */
export function buildTextures(scene: Phaser.Scene): void {
  // ---- terrain ----
  make(scene, "tile_top", TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(COLORS.grassBody);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(COLORS.grassTop);
    ctx.fillRect(0, 0, TILE, 11);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(0, 0, TILE, 3);
    ctx.fillStyle = hex(COLORS.grassBodyDark);
    ctx.fillRect(4, 18, 5, 4);
    ctx.fillRect(20, 24, 6, 4);
  });
  make(scene, "tile_dirt", TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(COLORS.grassBody);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(COLORS.grassBodyDark);
    ctx.fillRect(3, 6, 6, 4);
    ctx.fillRect(18, 14, 7, 4);
    ctx.fillRect(9, 23, 5, 4);
  });
  make(scene, "tile_stone", TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(0x7d8796);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(0x99a3b1);
    ctx.fillRect(1, 1, TILE - 2, 6);
    ctx.fillStyle = hex(0x5f6875);
    ctx.fillRect(2, 20, 12, 6);
  });
  make(scene, "tile_platform", TILE, 16, (ctx) => {
    ctx.fillStyle = hex(0xb1793f);
    ctx.fillRect(0, 0, TILE, 16);
    ctx.fillStyle = hex(0xd79a58);
    ctx.fillRect(0, 0, TILE, 5);
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
    ctx.fillStyle = hex(COLORS.questionDark);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(COLORS.question);
    ctx.fillRect(2, 2, TILE - 4, TILE - 4);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(2, 2, TILE - 4, 4);
    ctx.fillStyle = hex(0x6b4a12);
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 16, 18);
  });
  make(scene, "block_empty", TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(0x8a6a37);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(0xa98545);
    ctx.fillRect(3, 3, TILE - 6, TILE - 6);
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

  // ---- hero ----
  make(scene, "hero_idle", 32, 48, (ctx) => heroBody(ctx, { legOffset: 0, arm: 0 }));
  make(scene, "hero_walk_0", 32, 48, (ctx) => heroBody(ctx, { legOffset: 3, arm: 2 }));
  make(scene, "hero_walk_1", 32, 48, (ctx) => heroBody(ctx, { legOffset: -3, arm: -2 }));
  make(scene, "hero_jump", 32, 48, (ctx) => heroBody(ctx, { legOffset: 2, arm: 4, squash: 1.08 }));
  make(scene, "hero_fall", 32, 48, (ctx) => heroBody(ctx, { legOffset: -2, arm: -4, squash: 0.94 }));
  make(scene, "hero_hurt", 32, 48, (ctx) => heroBody(ctx, { legOffset: 4, arm: -3, hurt: true }));

  // ---- enemies ----
  const walker = (ctx: Ctx, step: number): void => {
    ctx.fillStyle = hex(0x35622a);
    roundRect(ctx, 5 + step, 24, 7, 6, 3);
    roundRect(ctx, 18 - step, 24, 7, 6, 3);
    ctx.fillStyle = hex(COLORS.walker);
    roundRect(ctx, 3, 8, 26, 18, 9);
    ctx.fillStyle = hex(0xb7ea7c);
    roundRect(ctx, 7, 11, 18, 6, 3);
    // leaf sprout
    ctx.fillStyle = hex(0x3f8f36);
    ctx.beginPath();
    ctx.ellipse(16, 6, 7, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0x1d2430);
    ctx.beginPath();
    ctx.arc(11, 17, 2.6, 0, Math.PI * 2);
    ctx.arc(21, 17, 2.6, 0, Math.PI * 2);
    ctx.fill();
  };
  make(scene, "walker_0", 32, 32, (ctx) => walker(ctx, 2));
  make(scene, "walker_1", 32, 32, (ctx) => walker(ctx, -2));
  make(scene, "walker_flat", 32, 32, (ctx) => {
    ctx.fillStyle = hex(COLORS.walker);
    roundRect(ctx, 3, 22, 26, 9, 4);
  });

  const shell = (ctx: Ctx, step: number): void => {
    ctx.fillStyle = hex(0x8a3a2a);
    roundRect(ctx, 6 + step, 26, 7, 5, 2);
    roundRect(ctx, 19 - step, 26, 7, 5, 2);
    ctx.fillStyle = hex(COLORS.shell);
    roundRect(ctx, 2, 10, 28, 18, 9);
    ctx.fillStyle = hex(0xf6a58c);
    for (let i = 0; i < 3; i++) roundRect(ctx, 6 + i * 8, 14, 6, 9, 3);
    ctx.fillStyle = hex(0xffd7a1);
    roundRect(ctx, 21, 2, 10, 10, 5);
    ctx.fillStyle = hex(0x1d2430);
    ctx.beginPath();
    ctx.arc(27, 6, 1.9, 0, Math.PI * 2);
    ctx.fill();
  };
  make(scene, "shell_0", 32, 32, (ctx) => shell(ctx, 2));
  make(scene, "shell_1", 32, 32, (ctx) => shell(ctx, -2));
  make(scene, "shell_hidden", 32, 32, (ctx) => {
    ctx.fillStyle = hex(0xb04a34);
    roundRect(ctx, 2, 8, 28, 22, 10);
    ctx.fillStyle = hex(COLORS.shell);
    roundRect(ctx, 5, 11, 22, 16, 8);
    ctx.fillStyle = hex(0xf6a58c);
    ctx.beginPath();
    ctx.arc(16, 19, 5, 0, Math.PI * 2);
    ctx.fill();
  });

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
  make(scene, "particle", 8, 8, (ctx) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 8, 8);
  });

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
    ctx.fillStyle = hex(0x2c7c48);
    ctx.fillRect(4, 14, 56, 50);
    ctx.fillStyle = hex(COLORS.pipe);
    ctx.fillRect(8, 14, 48, 50);
    ctx.fillStyle = hex(0x2c7c48);
    ctx.fillRect(0, 0, 64, 16);
    ctx.fillStyle = hex(0x66d18a);
    ctx.fillRect(4, 2, 56, 6);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(40, 16, 10, 48);
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
  make(scene, "bg_clouds", 640, 260, (ctx) => {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const puff = (x: number, y: number, s: number): void => {
      ctx.beginPath();
      ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
      ctx.arc(x + 24 * s, y + 6 * s, 17 * s, 0, Math.PI * 2);
      ctx.arc(x - 24 * s, y + 8 * s, 15 * s, 0, Math.PI * 2);
      ctx.fill();
    };
    puff(90, 70, 1);
    puff(320, 40, 0.75);
    puff(520, 100, 1.15);
    puff(210, 170, 0.6);
  });
  make(scene, "bg_hills_far", 640, 260, (ctx) => {
    ctx.fillStyle = hex(COLORS.hillFar);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(i * 150 + 40, 260, 120, Math.PI, 0);
      ctx.fill();
    }
  });
  make(scene, "bg_hills_near", 640, 220, (ctx) => {
    ctx.fillStyle = hex(COLORS.hillNear);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(i * 120 + 30, 220, 92, Math.PI, 0);
      ctx.fill();
    }
  });
  make(scene, "bg_trees", 640, 180, (ctx) => {
    for (let i = 0; i < 9; i++) {
      const x = i * 72 + 24;
      const h = 70 + ((i * 37) % 40);
      ctx.fillStyle = hex(0x5b3a22);
      ctx.fillRect(x - 5, 180 - h * 0.45, 10, h * 0.45);
      ctx.fillStyle = hex(COLORS.treeline);
      ctx.beginPath();
      ctx.arc(x, 180 - h * 0.55, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.arc(x - 8, 180 - h * 0.62, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
