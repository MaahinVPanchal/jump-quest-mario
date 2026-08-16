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
    backgroundColor: "#5c94fc",
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true,
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

  // Pixel-perfect presentation: snap the canvas to whole device pixels so tiles
  // and sprites never land on half pixels at any zoom or DPR.
  const fitPixelPerfect = (): void => {
    const dpr = window.devicePixelRatio || 1;
    const raw = Math.min(parent.clientWidth / VIEW.width, parent.clientHeight / VIEW.height);
    if (!Number.isFinite(raw) || raw <= 0) return;
    const devicePx = Math.floor(raw * dpr);
    const zoom = devicePx >= dpr ? devicePx / dpr : raw;
    game.scale.setZoom(zoom);
    game.scale.refresh();
    const canvas = game.canvas;
    if (canvas) canvas.style.imageRendering = "pixelated";
  };
  game.events.once(Phaser.Core.Events.READY, fitPixelPerfect);
  window.addEventListener("resize", fitPixelPerfect);
  game.events.once(Phaser.Core.Events.DESTROY, () => window.removeEventListener("resize", fitPixelPerfect));

  return game;
}
