import Phaser from "phaser";
import { VIEW } from "../config";
import { GameEvent } from "../systems/events";

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

const LABEL = {
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontSize: "16px",
  color: "#ffffff",
} as const;

const VALUE = {
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontSize: "22px",
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
  private power!: Phaser.GameObjects.Text;
  private combo!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private displayedScore = 0;
  private targetScore = 0;

  constructor() {
    super({ key: "Hud", active: false });
  }

  create(): void {
    const panel = this.add.graphics();
    panel.fillStyle(0x101828, 0.55);
    panel.fillRoundedRect(16, 12, VIEW.width - 32, 62, 14);

    this.add.text(36, 22, "RIKO", LABEL).setAlpha(0.8);
    this.lives = this.add.text(36, 40, "x3", VALUE);

    this.world = this.add.text(VIEW.width / 2, 22, "WORLD 1-1", LABEL).setOrigin(0.5, 0).setAlpha(0.8);
    this.power = this.add.text(VIEW.width / 2, 42, "SMALL", VALUE).setOrigin(0.5, 0);

    this.add.text(VIEW.width - 420, 22, "SCORE", LABEL).setAlpha(0.8);
    this.score = this.add.text(VIEW.width - 420, 40, "0", VALUE);
    this.add.text(VIEW.width - 250, 22, "RELICS", LABEL).setAlpha(0.8);
    this.coins = this.add.text(VIEW.width - 250, 40, "0", VALUE);
    this.add.text(VIEW.width - 110, 22, "TIME", LABEL).setAlpha(0.8);
    this.timeText = this.add.text(VIEW.width - 110, 40, "300", VALUE);

    this.combo = this.add.text(VIEW.width / 2, 88, "", { ...VALUE, color: "#ffd447" }).setOrigin(0.5, 0);
    this.toast = this.add
      .text(VIEW.width / 2, VIEW.height - 90, "", {
        ...LABEL,
        fontSize: "20px",
        backgroundColor: "rgba(16,24,40,0.72)",
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
    this.coins.setText(`${data.coins}c / ${data.relics}R`);
    this.timeText.setText(`${data.time}`);
    this.timeText.setColor(data.time <= 30 ? "#ff8080" : "#ffffff");
    this.lives.setText(`x${data.lives}`);
    this.world.setText(`WORLD ${data.world}`);
    this.power.setText(data.power.toUpperCase());
    this.combo.setText(data.combo > 1 ? `COMBO x${data.combo}` : "");
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
      this.score.setText(`${this.displayedScore}`);
    }
  }
}
