import Phaser from "phaser";
import { VIEW } from "../config";
import { GameEvent } from "../systems/events";
import { formatCoins, formatCombo, formatLives, formatScore, formatTime, formatWorld } from "../systems/hudFormat";

interface HudPayload {
  coins: number;
  score: number;
  lives: number;
  time: number;
  power: string;
  combo: number;
  world: string;
  relics: number;
}

// Arcade-era HUD: monospace caps, hard black shadow, no chrome.
const MONO = "'Courier New', 'Lucida Console', monospace";

const LABEL = {
  fontFamily: MONO,
  fontSize: "22px",
  fontStyle: "bold",
  color: "#ffffff",
} as const;

const VALUE = {
  fontFamily: MONO,
  fontSize: "24px",
  fontStyle: "bold",
  color: "#ffffff",
} as const;

/** Gameplay HUD lives in Phaser so it stays in sync with the game loop. */
export class HudScene extends Phaser.Scene {
  private score!: Phaser.GameObjects.Text;
  private coins!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private lives!: Phaser.GameObjects.Text;
  private world!: Phaser.GameObjects.Text;
  private combo!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private displayedScore = 0;
  private targetScore = 0;

  constructor() {
    super({ key: "Hud", active: false });
  }

  create(): void {
    // Five evenly spaced columns across the viewport.
    const col = (index: number, label: string): Phaser.GameObjects.Text => {
      const x = Math.round((VIEW.width / 5) * (index + 0.5));
      const l = this.add.text(x, 20, label, LABEL).setOrigin(0.5, 0);
      const v = this.add.text(x, 48, "", VALUE).setOrigin(0.5, 0);
      for (const t of [l, v]) t.setShadow(3, 3, "#000000", 0, true, true);
      return v;
    };

    this.score = col(0, "SCORE");
    this.score.setText(formatScore(0));
    this.coins = col(1, "COINS");
    this.world = col(2, "WORLD");
    this.timeText = col(3, "TIME");
    this.lives = col(4, "LIVES");

    this.combo = this.add.text(VIEW.width / 2, 84, "", { ...VALUE, color: "#fcd83c" }).setOrigin(0.5, 0);
    this.combo.setShadow(3, 3, "#000000", 0, true, true);
    this.toast = this.add
      .text(VIEW.width / 2, VIEW.height - 90, "", {
        ...LABEL,
        fontSize: "20px",
        backgroundColor: "#000000",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.game.events.on(GameEvent.HudUpdate, this.onUpdate, this);
    this.game.events.on(GameEvent.Toast, this.showToast, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(GameEvent.HudUpdate, this.onUpdate, this);
      this.game.events.off(GameEvent.Toast, this.showToast, this);
    });
  }

  private onUpdate(data: HudPayload): void {
    this.targetScore = data.score;
    this.coins.setText(formatCoins(data.coins));
    this.timeText.setText(formatTime(data.time));
    this.timeText.setColor(data.time <= 30 ? "#ff8080" : "#ffffff");
    this.lives.setText(formatLives(data.lives));
    this.world.setText(formatWorld(data.world));
    this.combo.setText(formatCombo(data.combo));
  }

  private showToast(message: string): void {
    this.toast.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 500 });
  }

  override update(_time: number, delta: number): void {
    if (this.displayedScore !== this.targetScore) {
      const step = Math.max(5, Math.ceil(Math.abs(this.targetScore - this.displayedScore) * (delta / 120)));
      this.displayedScore +=
        this.targetScore > this.displayedScore
          ? Math.min(step, this.targetScore - this.displayedScore)
          : -Math.min(step, this.displayedScore - this.targetScore);
      this.score.setText(formatScore(this.displayedScore));
    }
  }
}
