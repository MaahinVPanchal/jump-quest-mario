import Phaser from "phaser";
import { VIEW } from "../config";
import { audio } from "../systems/audio";
import { gameState } from "../systems/state";

type Entry = { label: string; action: () => void };

export class PauseScene extends Phaser.Scene {
  private index = 0;
  private texts: Phaser.GameObjects.Text[] = [];
  private entries: Entry[] = [];
  private confirmText?: Phaser.GameObjects.Text;
  private pendingConfirm: (() => void) | null = null;

  constructor() {
    super({ key: "Pause", active: false });
  }

  create(): void {
    this.index = 0;
    this.texts = [];
    this.pendingConfirm = null;
    this.add.rectangle(0, 0, VIEW.width, VIEW.height, 0x0b1220, 0.68).setOrigin(0, 0);
    this.add
      .text(VIEW.width / 2, 150, "PAUSED", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "52px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.entries = [
      { label: "Resume", action: () => this.resume() },
      { label: "Restart from checkpoint", action: () => this.confirm("Restart from checkpoint?", () => this.restart()) },
      {
        label: `Screen shake: ${gameState.save.settings.screenShake ? "ON" : "OFF"}`,
        action: () => this.toggleShake(),
      },
      { label: `Music volume: ${Math.round(audio.settings.music * 100)}%`, action: () => this.cycleMusic() },
      { label: `SFX volume: ${Math.round(audio.settings.sfx * 100)}%`, action: () => this.cycleSfx() },
      { label: "Quit to menu", action: () => this.confirm("Quit level? Progress since the last save is lost.", () => this.quit()) },
    ];

    this.entries.forEach((entry, i) => {
      const text = this.add
        .text(VIEW.width / 2, 250 + i * 48, entry.label, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "26px",
          color: "#e2e8f0",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      text.on("pointerover", () => this.select(i));
      text.on("pointerdown", () => this.activate());
      this.texts.push(text);
    });

    this.add
      .text(VIEW.width / 2, VIEW.height - 90, "Arrows to choose · Enter to confirm · Esc to resume", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#94a3b8",
      })
      .setOrigin(0.5);

    this.select(0);
    const kb = this.input.keyboard;
    kb?.on("keydown-UP", () => this.select((this.index + this.entries.length - 1) % this.entries.length));
    kb?.on("keydown-DOWN", () => this.select((this.index + 1) % this.entries.length));
    kb?.on("keydown-ENTER", () => this.activate());
    kb?.on("keydown-SPACE", () => this.activate());
    kb?.on("keydown-ESC", () => (this.pendingConfirm ? this.cancelConfirm() : this.resume()));
  }

  private select(i: number): void {
    this.index = i;
    this.texts.forEach((t, idx) => {
      t.setColor(idx === i ? "#ffd447" : "#e2e8f0");
      t.setScale(idx === i ? 1.06 : 1);
    });
    audio.play("menu");
  }

  private activate(): void {
    if (this.pendingConfirm) {
      const fn = this.pendingConfirm;
      this.pendingConfirm = null;
      this.confirmText?.destroy();
      fn();
      return;
    }
    this.entries[this.index]?.action();
  }

  private confirm(message: string, action: () => void): void {
    this.pendingConfirm = action;
    this.confirmText?.destroy();
    this.confirmText = this.add
      .text(VIEW.width / 2, VIEW.height - 150, `${message}  [Enter = yes, Esc = no]`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        color: "#ffd447",
        backgroundColor: "rgba(0,0,0,0.45)",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5);
  }

  private cancelConfirm(): void {
    this.pendingConfirm = null;
    this.confirmText?.destroy();
  }

  private toggleShake(): void {
    gameState.save.settings.screenShake = !gameState.save.settings.screenShake;
    this.texts[2]?.setText(`Screen shake: ${gameState.save.settings.screenShake ? "ON" : "OFF"}`);
    gameState.persist();
  }

  private cycleMusic(): void {
    audio.settings.music = Math.round((audio.settings.music + 0.25) * 100) / 100 > 1 ? 0 : audio.settings.music + 0.25;
    audio.applyVolumes();
    gameState.save.settings.music = audio.settings.music;
    this.texts[3]?.setText(`Music volume: ${Math.round(audio.settings.music * 100)}%`);
  }

  private cycleSfx(): void {
    audio.settings.sfx = Math.round((audio.settings.sfx + 0.25) * 100) / 100 > 1 ? 0 : audio.settings.sfx + 0.25;
    audio.applyVolumes();
    gameState.save.settings.sfx = audio.settings.sfx;
    this.texts[4]?.setText(`SFX volume: ${Math.round(audio.settings.sfx * 100)}%`);
  }

  private resume(): void {
    this.scene.stop();
    this.scene.resume("Level");
  }

  private restart(): void {
    this.scene.stop();
    this.scene.stop("Hud");
    this.scene.start("Level");
  }

  private quit(): void {
    gameState.persist();
    this.scene.stop();
    this.scene.stop("Hud");
    this.scene.stop("Level");
    this.game.events.emit("game:exit");
  }
}
