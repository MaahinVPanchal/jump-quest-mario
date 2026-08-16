import Phaser from "phaser";
import { RULES, VIEW } from "../config";
import { audio } from "../systems/audio";
import { gameState } from "../systems/state";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOver", active: false });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x1a1024);
    audio.play("death");
    this.add
      .text(VIEW.width / 2, 220, "GAME OVER", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "62px",
        fontStyle: "bold",
        color: "#ff8080",
      })
      .setOrigin(0.5);
    this.add
      .text(VIEW.width / 2, 300, `Final score ${gameState.score}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        color: "#e2e8f0",
      })
      .setOrigin(0.5);

    this.button(VIEW.width / 2, 400, "Try again", () => {
      gameState.lives = RULES.startingLives;
      gameState.resetLevel(true);
      this.scene.start("Level");
    });
    this.button(VIEW.width / 2, 470, "Back to menu", () => {
      this.scene.stop();
      this.game.events.emit("game:exit");
    });
  }

  private button(x: number, y: number, label: string, action: () => void): void {
    const text = this.add
      .text(x, y, label, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        color: "#0f172a",
        backgroundColor: "#ffd447",
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    text.on("pointerdown", action);
  }
}
