import Phaser from "phaser";
import { CHARACTERS } from "../data/characters";
import { VIEW } from "../config";

/**
 * Development-only rendering sanity check (F9).
 *
 * Draws every major asset at once over a checkerboard so missing, blurry,
 * mis-tinted, mis-scaled or mis-layered art is immediately obvious. It never
 * touches gameplay state — the level scene is paused underneath and resumes
 * unchanged when the overlay closes.
 */
const PANELS: { title: string; keys: [string, string][] }[] = [
  {
    title: "CHARACTERS",
    keys: Object.values(CHARACTERS).map((c) => [`${c.spritePrefix}_idle`, c.name] as [string, string]),
  },
  {
    title: "PROJECTILES",
    keys: [
      ["shot_fireball", "Fireball"],
      ["shot_greenbolt", "Green"],
      ["shot_heart", "Heart"],
      ["shot_flame", "Flame"],
      ["shot_pellet", "Pellet"],
      ["shot_slash", "Slash"],
      ["shot_plasma", "Plasma"],
      ["shot_axe", "Axe"],
      ["shot_kunai", "Kunai"],
    ],
  },
  {
    title: "POWERUPS",
    keys: [
      ["item_orb", "Growth"],
      ["item_crystal", "Fire"],
      ["relic", "Relic"],
      ["item_oneup", "1UP"],
      ["item_banana", "Banana"],
      ["item_bell", "Bell"],
    ],
  },
  {
    title: "ENVIRONMENT",
    keys: [
      ["tile_top", "Ground"],
      ["block_brick", "Brick"],
      ["block_question", "Question"],
      ["pipe", "Pipe"],
      ["tile_platform", "Platform"],
      ["coin_0", "Coin"],
      ["goal_flag", "Flag"],
      ["checkpoint_on", "Check"],
    ],
  },
  {
    title: "ENEMIES / UI",
    keys: [
      ["walker_0", "Walker"],
      ["shell_0", "Shell"],
      ["ogre_0", "Ogre"],
      ["piranha_0", "Piranha"],
      ["spiker_0", "Spiker"],
      ["particle", "Particle"],
    ],
  },
  {
    title: "EFFECTS / POSES",
    keys: [
      ["marco_walk_1", "Run"],
      ["marco_jump", "Jump"],
      ["marco_attack_1", "Attack"],
      ["kage_attack_1", "Kunai"],
      ["krogar_idle", "Heavy"],
      ["shroomy_idle", "Small"],
    ],
  },
];

const LAYERS = [
  "LAYER 0  Background",
  "LAYER 1  Environment",
  "LAYER 2  Pickups",
  "LAYER 3  Characters",
  "LAYER 4  Projectiles",
  "LAYER 5  Particles",
  "LAYER 6  UI",
];

export class SanityScene extends Phaser.Scene {
  constructor() {
    super("Sanity");
  }

  create(): void {
    const w = VIEW.width;
    const h = VIEW.height;
    this.add.rectangle(0, 0, w, h, 0x101018, 0.96).setOrigin(0);

    this.add
      .text(16, 12, "RENDERING SANITY CHECK  ·  F9 to close", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fcec48",
      })
      .setDepth(10);

    const cols = 3;
    const panelW = (w - 220) / cols;
    const panelH = 200;

    PANELS.forEach((panel, i) => {
      const px = 16 + (i % cols) * panelW;
      const py = 46 + Math.floor(i / cols) * (panelH + 12);
      this.add.rectangle(px, py, panelW - 10, panelH, 0x000000, 0.6).setOrigin(0).setStrokeStyle(2, 0x5cfc48);
      this.add.text(px + 8, py + 6, panel.title, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#5cfc48",
      });

      panel.keys.forEach((entry, k) => {
        const [key, label] = entry;
        const cellW = (panelW - 20) / 5;
        const cx = px + 10 + (k % 5) * cellW + cellW / 2;
        const cy = py + 34 + Math.floor(k / 5) * 78;
        this.checker(cx - cellW / 2 + 3, cy, cellW - 6, 46);
        if (this.textures.exists(key)) {
          const img = this.add.image(cx, cy + 44, key).setOrigin(0.5, 1);
          const scale = Math.min(1.4, 42 / Math.max(img.width, img.height));
          img.setScale(Math.max(1, Math.round(scale)));
        } else {
          this.add
            .text(cx, cy + 20, "MISSING", { fontFamily: "monospace", fontSize: "10px", color: "#e82820" })
            .setOrigin(0.5);
        }
        this.add
          .text(cx, cy + 50, label, { fontFamily: "monospace", fontSize: "10px", color: "#ffffff" })
          .setOrigin(0.5, 0);
      });
    });

    // Layer-order column: a swatch drawn at each depth, top-most last.
    const lx = w - 196;
    this.add.rectangle(lx, 46, 180, 232, 0x000000, 0.6).setOrigin(0).setStrokeStyle(2, 0xfc8cd8);
    this.add.text(lx + 8, 52, "DEPTH ORDER", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#fc8cd8",
    });
    LAYERS.forEach((label, i) => {
      const y = 76 + i * 22;
      this.add.rectangle(lx + 12, y, 14, 14, [0x5c94fc, 0x8c5424, 0xfcd83c, 0x18b45c, 0xfc8018, 0xffffff, 0xe82820][i]!)
        .setOrigin(0)
        .setDepth(i);
      this.add
        .text(lx + 32, y, label, { fontFamily: "monospace", fontSize: "11px", color: "#ffffff" })
        .setDepth(i);
    });

    this.input.keyboard?.on("keydown-F9", () => this.close());
    this.input.keyboard?.on("keydown-ESC", () => this.close());
  }

  /** Checkerboard behind each sprite so transparency and outlines are visible. */
  private checker(x: number, y: number, w: number, h: number): void {
    const s = 8;
    for (let cy = 0; cy < h; cy += s) {
      for (let cx = 0; cx < w; cx += s) {
        const on = ((cx / s) + (cy / s)) % 2 === 0;
        this.add
          .rectangle(x + cx, y + cy, Math.min(s, w - cx), Math.min(s, h - cy), on ? 0x484858 : 0x2c2c38)
          .setOrigin(0);
      }
    }
  }

  private close(): void {
    this.scene.stop();
    this.scene.resume("Level");
  }
}
