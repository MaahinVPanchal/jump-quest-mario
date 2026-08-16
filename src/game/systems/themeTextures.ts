import type Phaser from "phaser";
import { TILE } from "../config";
import { STAGE_THEMES, bossKey, themeKey, type StageTheme } from "../levels/themes";
import { hex, make, type Ctx } from "./textures";

/**
 * Draws the full art set for every stage theme: terrain tiles, platforms,
 * pipes, liquid surface, three parallax layers and a two-frame boss sprite.
 * Everything is generated procedurally, so the build still ships zero art files.
 */
export function buildThemeTextures(scene: Phaser.Scene): void {
  for (const theme of STAGE_THEMES) {
    buildTerrain(scene, theme);
    buildLiquid(scene, theme);
    buildBackdrop(scene, theme);
    buildBoss(scene, theme);
  }
}

// ------------------------------------------------------------------ terrain

function buildTerrain(scene: Phaser.Scene, t: StageTheme): void {
  const [surface, surfaceDark, cap, dirt, dirtDark, stone, stoneDark] = t.ground;

  const bricks = (ctx: Ctx, base: number, shade: number, top: boolean): void => {
    ctx.fillStyle = hex(shade);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(base);
    for (let row = 0; row < 2; row++) {
      const off = row % 2 === 0 ? 0 : 8;
      for (let x = -16; x < TILE; x += 16) ctx.fillRect(x + off + 2, row * 16 + 2, 14, 12);
    }
    if (top) {
      ctx.fillStyle = hex(cap);
      for (let x = -16; x < TILE; x += 16) ctx.fillRect(x + 2, 2, 14, 3);
    }
  };

  const crate = (ctx: Ctx, base: number, shade: number): void => {
    ctx.fillStyle = hex(shade);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(base);
    ctx.fillRect(3, 3, TILE - 6, TILE - 6);
    ctx.fillStyle = hex(shade);
    ctx.fillRect(3, TILE / 2 - 2, TILE - 6, 4);
    ctx.fillRect(TILE / 2 - 2, 3, 4, TILE - 6);
  };

  const panel = (ctx: Ctx, base: number, shade: number, trim: number): void => {
    ctx.fillStyle = hex(shade);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(base);
    ctx.fillRect(2, 2, TILE - 4, TILE - 4);
    ctx.fillStyle = hex(trim);
    ctx.fillRect(4, 4, 6, 6);
    ctx.fillRect(TILE - 10, TILE - 10, 6, 6);
  };

  const top = (ctx: Ctx): void => {
    if (t.decor === "crates" || t.decor === "harbour") crate(ctx, surface, surfaceDark);
    else if (t.decor === "launchpad" || t.decor === "stars") panel(ctx, surface, surfaceDark, cap);
    else bricks(ctx, surface, surfaceDark, true);
  };
  const body = (ctx: Ctx): void => {
    if (t.decor === "crates" || t.decor === "harbour") crate(ctx, dirt, dirtDark);
    else if (t.decor === "launchpad" || t.decor === "stars") panel(ctx, dirt, dirtDark, surfaceDark);
    else bricks(ctx, dirt, dirtDark, false);
  };

  make(scene, themeKey(t.id, "top"), TILE, TILE, top);
  make(scene, themeKey(t.id, "dirt"), TILE, TILE, body);
  make(scene, themeKey(t.id, "stone"), TILE, TILE, (ctx) => {
    ctx.fillStyle = hex(stoneDark);
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = hex(stone);
    ctx.fillRect(2, 2, TILE - 4, TILE - 4);
    ctx.fillStyle = hex(cap);
    ctx.fillRect(2, 2, TILE - 4, 4);
  });
  make(scene, themeKey(t.id, "platform"), TILE, 16, (ctx) => {
    ctx.fillStyle = hex(t.ground[1]);
    ctx.fillRect(0, 0, TILE, 16);
    ctx.fillStyle = hex(t.platform);
    ctx.fillRect(0, 0, TILE, 6);
    ctx.fillStyle = hex(t.ground[5]);
    for (let x = 2; x < TILE; x += 10) ctx.fillRect(x, 8, 6, 5);
  });
  make(scene, themeKey(t.id, "pipe"), 64, 64, (ctx) => {
    const [base, dark, light] = t.pipe;
    ctx.fillStyle = hex(dark);
    ctx.fillRect(0, 0, 64, 16);
    ctx.fillStyle = hex(base);
    ctx.fillRect(2, 2, 60, 12);
    ctx.fillStyle = hex(light);
    ctx.fillRect(6, 4, 8, 8);
    ctx.fillStyle = hex(dark);
    ctx.fillRect(6, 16, 52, 48);
    ctx.fillStyle = hex(base);
    ctx.fillRect(8, 16, 48, 48);
    ctx.fillStyle = hex(light);
    ctx.fillRect(12, 16, 8, 48);
  });
}

// ------------------------------------------------------------------- liquid

function buildLiquid(scene: Phaser.Scene, t: StageTheme): void {
  const [top, deep] = t.liquidColors;
  make(scene, themeKey(t.id, "liquid"), 128, 64, (ctx) => {
    ctx.fillStyle = hex(deep);
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = hex(top);
    ctx.fillRect(0, 0, 128, 14);
    // Crest ripple so the surface reads as flowing, not as a flat band.
    for (let x = 0; x < 128; x += 16) ctx.fillRect(x, 14, 8, 6);
    if (t.liquid === "lava" || t.liquid === "gold" || t.liquid === "plasma") {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      for (let x = 4; x < 128; x += 24) ctx.fillRect(x, 4, 10, 4);
    } else if (t.liquid === "water") {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      for (let x = 8; x < 128; x += 32) ctx.fillRect(x, 24, 12, 3);
    }
  });
}

// ----------------------------------------------------------------- backdrop

function buildBackdrop(scene: Phaser.Scene, t: StageTheme): void {
  const W = 640;
  const mound = (ctx: Ctx, x: number, base: number, s: number, color: number, capColor: number | null): void => {
    ctx.fillStyle = hex(color);
    const w = 28 * s;
    ctx.fillRect(x - w * 1.5, base - 14 * s, w * 3, 14 * s);
    ctx.fillRect(x - w, base - 26 * s, w * 2, 12 * s);
    ctx.fillRect(x - w * 0.5, base - 36 * s, w, 10 * s);
    if (capColor !== null) {
      ctx.fillStyle = hex(capColor);
      ctx.fillRect(x - w * 0.5, base - 36 * s, w * 0.5, 4 * s);
    }
  };

  make(scene, themeKey(t.id, "far"), W, 260, (ctx) => {
    switch (t.decor) {
      case "volcano":
        for (let i = 0; i < 3; i++) {
          const x = i * 220 + 110;
          ctx.fillStyle = hex(t.far);
          ctx.beginPath();
          ctx.moveTo(x - 110, 260);
          ctx.lineTo(x, 60);
          ctx.lineTo(x + 110, 260);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = hex(t.liquidColors[0]);
          ctx.fillRect(x - 12, 60, 24, 90);
        }
        break;
      case "stars":
        ctx.fillStyle = hex(t.far);
        ctx.fillRect(0, 180, W, 80);
        for (let i = 0; i < 90; i++) {
          ctx.fillStyle = i % 5 === 0 ? "#fcd83c" : "#ffffff";
          ctx.fillRect((i * 97) % W, (i * 53) % 200, 3, 3);
        }
        ctx.fillStyle = hex(t.near);
        ctx.beginPath();
        ctx.arc(520, 70, 46, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "launchpad":
        ctx.fillStyle = hex(t.far);
        ctx.fillRect(0, 150, W, 110);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = hex(t.near);
          ctx.fillRect(60 + i * 150, 60, 26, 190);
          ctx.fillStyle = hex(t.ground[5]);
          ctx.fillRect(52 + i * 150, 54, 42, 12);
        }
        break;
      case "harbour":
        ctx.fillStyle = hex(t.far);
        for (let i = 0; i < 3; i++) {
          const x = 90 + i * 210;
          ctx.fillRect(x - 70, 190, 140, 44);
          ctx.fillRect(x - 6, 80, 12, 110);
          ctx.fillStyle = hex(t.ground[2]);
          ctx.fillRect(x, 90, 60, 60);
          ctx.fillStyle = hex(t.far);
        }
        break;
      case "clouds":
        for (let i = 0; i < 5; i++) mound(ctx, i * 150 + 60, 260, 1.7, t.far, 0xffffff);
        break;
      case "reef":
        for (let i = 0; i < 5; i++) mound(ctx, i * 150 + 60, 260, 1.6, t.far, t.ground[2]);
        break;
      case "vault":
        ctx.fillStyle = hex(t.far);
        ctx.fillRect(0, 120, W, 140);
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = hex(t.ground[0]);
          ctx.fillRect(20 + i * 78, 150, 54, 26);
          ctx.fillStyle = hex(t.ground[1]);
          ctx.fillRect(20 + i * 78, 176, 54, 8);
        }
        break;
      default:
        for (let i = 0; i < 4; i++) mound(ctx, i * 180 + 80, 260, 1.7, t.far, t.ground[2]);
    }
  });

  make(scene, themeKey(t.id, "near"), W, 220, (ctx) => {
    switch (t.decor) {
      case "crates":
        for (let i = 0; i < 10; i++) {
          const h = 40 + ((i * 37) % 70);
          ctx.fillStyle = hex(t.near);
          ctx.fillRect(i * 66, 220 - h, 60, h);
          ctx.fillStyle = hex(t.ground[2]);
          ctx.fillRect(i * 66 + 4, 224 - h, 52, 5);
        }
        break;
      case "jungle":
        for (let i = 0; i < 7; i++) {
          const x = i * 96 + 40;
          ctx.fillStyle = hex(t.ground[3]);
          ctx.fillRect(x - 8, 90, 16, 130);
          mound(ctx, x, 110, 1.2, t.near, t.ground[2]);
        }
        break;
      case "launchpad":
      case "stars":
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = hex(t.near);
          ctx.fillRect(i * 84, 140, 72, 80);
          ctx.fillStyle = hex(t.ground[5]);
          ctx.fillRect(i * 84 + 10, 150, 20, 20);
        }
        break;
      case "harbour":
        for (let i = 0; i < 6; i++) {
          const x = i * 116 + 30;
          ctx.fillStyle = hex(t.near);
          ctx.fillRect(x, 160, 90, 40);
          ctx.fillRect(x + 40, 70, 8, 90);
          ctx.fillStyle = hex(t.ground[2]);
          ctx.fillRect(x + 48, 80, 42, 40);
        }
        break;
      default:
        for (let i = 0; i < 5; i++) mound(ctx, i * 140 + 60, 220, 1.2, t.near, t.ground[2]);
    }
  });

  make(scene, themeKey(t.id, "decor"), W, 180, (ctx) => {
    switch (t.decor) {
      case "volcano":
        for (let i = 0; i < 9; i++) {
          ctx.fillStyle = hex(t.liquidColors[0]);
          ctx.fillRect(i * 72 + 20, 150 - ((i * 23) % 40), 8, 30);
        }
        break;
      case "reef":
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = hex(i % 2 ? 0xfc70a8 : 0xfc9838);
          const x = i * 64 + 24;
          ctx.fillRect(x, 120, 8, 60);
          ctx.fillRect(x - 12, 132, 8, 48);
          ctx.fillRect(x + 12, 138, 8, 42);
        }
        break;
      case "clouds":
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = "#ffffff";
          mound(ctx, i * 118 + 40, 180, 0.9, 0xffffff, null);
        }
        break;
      case "vault":
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = hex(0xfcd83c);
          ctx.fillRect(i * 54 + 16, 150, 34, 22);
          ctx.fillStyle = hex(0xc09818);
          ctx.fillRect(i * 54 + 16, 168, 34, 6);
        }
        break;
      case "jungle":
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = hex(0x1c7c24);
          ctx.fillRect(i * 56 + 12, 0, 8, 70 + ((i * 31) % 60));
        }
        break;
      default:
        for (let i = 0; i < 8; i++) mound(ctx, i * 82 + 40, 180, 0.85, t.near, t.ground[2]);
    }
  });
}

// --------------------------------------------------------------------- boss

/**
 * Each boss shares a chunky 48x48 grid but gets a distinct silhouette so the
 * stage-ending fight reads differently in every world.
 */
function buildBoss(scene: Phaser.Scene, t: StageTheme): void {
  const b = t.boss;
  const draw = (ctx: Ctx, frame: number): void => {
    const bob = frame === 0 ? 0 : 2;
    const body = hex(b.body);
    const dark = hex(b.bodyDark);
    const trim = hex(b.trim);
    ctx.save();
    ctx.translate(0, bob);

    const block = (x: number, y: number, w: number, h: number, c: string): void => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };

    // Shared torso mass.
    block(10, 20, 44, 34, dark);
    block(13, 23, 38, 28, body);

    switch (b.shape) {
      case "brute":
        block(16, 4, 32, 18, dark);
        block(19, 7, 26, 13, body);
        block(12, 0, 8, 10, trim); // horns
        block(44, 0, 8, 10, trim);
        block(18, 44, 10, 14, dark);
        block(36, 44, 10, 14, dark);
        break;
      case "fish":
        block(14, 8, 36, 18, dark);
        block(17, 11, 30, 12, body);
        block(0, 26, 14, 18, trim); // tail fin
        block(50, 22, 14, 10, trim);
        for (let i = 0; i < 5; i++) block(18 + i * 7, 34, 5, 8, trim); // teeth
        break;
      case "bird":
        block(20, 4, 24, 18, dark);
        block(23, 7, 18, 12, body);
        block(0, 24, 14, 24, trim); // wings
        block(50, 24, 14, 24, trim);
        block(28, 20, 8, 8, trim); // beak
        break;
      case "block":
        block(6, 6, 52, 50, dark);
        block(10, 10, 44, 42, body);
        block(10, 10, 44, 6, trim);
        block(18, 20, 10, 10, "#ffffff");
        block(36, 20, 10, 10, "#ffffff");
        break;
      case "ape":
        block(16, 2, 32, 22, dark);
        block(19, 6, 26, 15, body);
        block(10, 4, 8, 10, dark);
        block(46, 4, 8, 10, dark);
        block(2, 26, 12, 26, body); // long arms
        block(50, 26, 12, 26, body);
        block(22, 28, 20, 16, trim); // chest
        break;
      case "ship":
        block(4, 26, 56, 22, dark);
        block(8, 30, 48, 14, body);
        block(28, 2, 6, 26, dark); // mast
        block(34, 6, 20, 16, trim); // sail
        block(18, 12, 12, 12, body); // captain
        block(20, 14, 8, 4, "#ffffff");
        break;
      case "rocket":
        block(22, 0, 20, 14, trim); // nose cone
        block(16, 12, 32, 34, body);
        block(16, 12, 32, 6, dark);
        block(6, 34, 12, 20, dark); // fins
        block(46, 34, 12, 20, dark);
        block(24, 48, 16, 12, hex(0xfc8018)); // thrust
        break;
      case "alien":
        block(12, 2, 40, 26, dark);
        block(15, 5, 34, 20, body);
        block(20, 12, 9, 9, "#ffffff");
        block(36, 12, 9, 9, "#ffffff");
        block(22, 15, 5, 5, "#000000");
        block(38, 15, 5, 5, "#000000");
        for (let i = 0; i < 4; i++) block(8 + i * 14, 48 - (i % 2) * 4, 8, 14, trim); // tentacles
        break;
    }
    ctx.restore();
  };
  make(scene, bossKey(t.id, 0), 64, 64, (ctx) => draw(ctx, 0), false);
  make(scene, bossKey(t.id, 1), 64, 64, (ctx) => draw(ctx, 1), false);
}
