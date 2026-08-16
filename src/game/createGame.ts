import Phaser from "phaser";
import { PHYSICS, VIEW } from "./config";
import { BootScene } from "./scenes/BootScene";
import { LevelScene } from "./scenes/LevelScene";
import { HudScene } from "./scenes/HudScene";
import { PauseScene } from "./scenes/PauseScene";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { audio } from "./systems/audio";
import { gameState } from "./systems/state";
import type { SaveData } from "./types";

export interface StartOptions {
  parent: HTMLElement;
  slot: number;
  save: SaveData;
  onExit: () => void;
}

export function createGame({ parent, slot, save, onExit }: StartOptions): Phaser.Game {
  gameState.bindSave(slot, save);
  gameState.resetLevel(true);
  audio.settings.music = save.settings.music;
  audio.settings.sfx = save.settings.sfx;
  audio.settings.master = save.settings.master;
  audio.unlock();
  audio.applyVolumes();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VIEW.width,
    height: VIEW.height,
    backgroundColor: "#8fd7ff",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: PHYSICS.gravity }, debug: false },
    },
    input: { gamepad: true },
    scene: [BootScene, LevelScene, HudScene, PauseScene, LevelCompleteScene, GameOverScene],
  });

  game.events.on("game:exit", () => {
    audio.stopMusic();
    onExit();
  });

  return game;
}
