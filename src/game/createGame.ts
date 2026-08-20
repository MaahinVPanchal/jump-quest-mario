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
import { display, resolveZoom } from "./systems/display";
import type { SaveData } from "./types";
import { FIRST_LEVEL_ID, getLevel } from "./levels";

export interface StartOptions {
  parent: HTMLElement;
  slot: number;
  save: SaveData;
  onExit: () => void;
  characterId?: string;
  levelId?: string;
}

export function createGame({ parent, slot, save, onExit, characterId, levelId }: StartOptions): Phaser.Game {
  gameState.bindSave(slot, save);
  gameState.characterId = characterId ?? "riko";
  gameState.levelId = getLevel(levelId ?? FIRST_LEVEL_ID).id;
  gameState.resetLevel(true);
  audio.settings.music = save.settings.music;
  audio.settings.sfx = save.settings.sfx;
  audio.settings.master = save.settings.master;
  audio.unlock();
  audio.applyVolumes();
  display.setPixelPerfect(save.settings.pixelPerfect ?? true);

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
    const zoom = resolveZoom(raw, dpr, display.pixelPerfect);
    game.scale.setZoom(zoom);
    game.scale.refresh();
    display.setZoom(Math.round(zoom * 1000) / 1000);
    const canvas = game.canvas;
    if (canvas) canvas.style.imageRendering = display.pixelPerfect ? "pixelated" : "auto";
  };
  game.events.once(Phaser.Core.Events.READY, fitPixelPerfect);
  window.addEventListener("resize", fitPixelPerfect);
  const unsubscribe = display.subscribe(() => fitPixelPerfect());
  game.events.once(Phaser.Core.Events.DESTROY, () => {
    window.removeEventListener("resize", fitPixelPerfect);
    unsubscribe();
  });

  return game;
}
