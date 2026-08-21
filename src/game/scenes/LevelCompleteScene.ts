import Phaser from "phaser";
import { VIEW } from "../config";
import { audio } from "../systems/audio";
import { gameState } from "../systems/state";
import { getLevel, nextLevelId } from "../levels";

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: "LevelComplete", active: false });
  }

  create(): void {
    const result = gameState.lastResult;
    this.cameras.main.setBackgroundColor(0x0f2027);
    this.add
      .text(VIEW.width / 2, 96, "LEVEL COMPLETE!", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "54px",
        fontStyle: "bold",
        color: "#ffd447",
      })
      .setOrigin(0.5);

    const objectiveRows: [string, string][] = (result?.objectives ?? []).map((o) => [
      `Objective - ${o.label}`,
      o.complete ? `${o.value}  CLEAR` : `${o.value}  MISSED`,
    ]);

    const rows: [string, string][] = result
      ? [
          ...objectiveRows,
          ["Time taken", `${result.timeTaken}s`],
          ["Time bonus", `${result.timeLeft * 50}`],
          ["Coins", `${result.coins}`],
          ["Sky Stars", `${result.stars}`],
          ["Golden Relics", `${result.relics} / 3`],
          ["Enemies defeated", `${result.enemies}`],
          ["Damage taken", `${result.damageTaken}`],
          ["Score", `${result.score}`],
        ]
      : [["Score", `${gameState.score}`]];

    const step = rows.length > 8 ? Math.max(24, Math.floor(330 / rows.length)) : 42;
    rows.forEach(([label, value], i) => {
      const y = 180 + i * step;
      this.add.text(VIEW.width / 2 - 240, y, label, {
        fontFamily: "system-ui, sans-serif",
        fontSize: step < 34 ? "18px" : "24px",
        color: "#cbd5e1",
      });
      this.add
        .text(VIEW.width / 2 + 240, y, value, {
          fontFamily: "system-ui, sans-serif",
          fontSize: step < 34 ? "18px" : "24px",
          fontStyle: "bold",
          color: "#ffffff",
        })
        .setOrigin(1, 0);
    });

    const rank = result?.rank ?? "C";
    this.add
      .text(VIEW.width / 2, 540, `RANK  ${rank}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "46px",
        fontStyle: "bold",
        color: rank === "S" ? "#ffd447" : "#7dd3fc",
      })
      .setOrigin(0.5);

    const next = result ? nextLevelId(result.levelId) : null;
    if (next) {
      const nextLevel = getLevel(next);
      this.button(VIEW.width / 2 - 300, 630, `Next: ${nextLevel.world}-${nextLevel.level}`, () => {
        gameState.levelId = next;
        gameState.save = { ...gameState.save, currentLevelId: next };
        gameState.persist();
        gameState.resetLevel(true);
        this.scene.start("Level");
      });
    }
    this.button(VIEW.width / 2, 630, "Replay level", () => {
      gameState.resetLevel(true);
      this.scene.start("Level");
    });
    this.button(VIEW.width / 2 + 300, 630, "Back to menu", () => {
      this.scene.stop();
      this.game.events.emit("game:exit");
    });

    audio.play("goal");
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
    text.on("pointerover", () => text.setScale(1.05));
    text.on("pointerout", () => text.setScale(1));
    text.on("pointerdown", action);
  }
}
