import { RULES, SCORE } from "../config";
import type { LevelResult, SaveData } from "../types";
import { applyResult, emptySave, saveSlot } from "./save";

export interface CheckpointState {
  x: number;
  y: number;
  power: "small" | "big" | "fire";
  coins: number;
  score: number;
  timeLeft: number;
}

/** Single source of truth for the active run. */
export class GameState {
  slot = 1;
  save: SaveData = emptySave();
  characterId = "riko";
  lives = RULES.startingLives;
  coins = 0;
  score = 0;
  levelCoins = 0;
  enemiesDefeated = 0;
  damageTaken = 0;
  relicIds: string[] = [];
  collectedIds = new Set<string>();
  checkpoint: CheckpointState | null = null;
  comboCount = 0;
  comboExpires = 0;
  lastResult: LevelResult | null = null;

  bindSave(slot: number, save: SaveData): void {
    this.slot = slot;
    this.save = save;
    this.lives = Math.max(1, save.lives);
    this.coins = 0;
  }

  resetLevel(hard: boolean): void {
    this.levelCoins = 0;
    this.enemiesDefeated = 0;
    this.damageTaken = 0;
    this.relicIds = [];
    this.comboCount = 0;
    if (hard) {
      this.checkpoint = null;
      this.collectedIds.clear();
      this.score = 0;
      this.coins = 0;
    }
  }

  addScore(points: number): number {
    this.score += points;
    return this.score;
  }

  /** Chained pickups/defeats escalate the multiplier, then decay. */
  bumpCombo(now: number): number {
    if (now > this.comboExpires) this.comboCount = 0;
    this.comboCount = Math.min(this.comboCount + 1, SCORE.comboSteps.length - 1);
    this.comboExpires = now + SCORE.comboWindowMs;
    return SCORE.comboSteps[this.comboCount] ?? 1;
  }

  comboMultiplier(now: number): number {
    if (now > this.comboExpires) return 1;
    return SCORE.comboSteps[this.comboCount] ?? 1;
  }

  addCoin(): void {
    this.coins += 1;
    this.levelCoins += 1;
    if (this.coins > 0 && this.coins % RULES.coinsPerLife === 0) this.lives += 1;
  }

  rankFor(timeLeft: number, timeLimit: number): LevelResult["rank"] {
    const fast = timeLeft > timeLimit * 0.55;
    if (fast && this.relicIds.length >= 3 && this.damageTaken === 0) return "S";
    if (this.relicIds.length >= 2 && this.damageTaken <= 1) return "A";
    if (this.levelCoins >= 20) return "B";
    return "C";
  }

  persist(result?: LevelResult): void {
    let next: SaveData = { ...this.save, lives: this.lives, playTimeMs: this.save.playTimeMs };
    if (result) next = applyResult(next, result);
    this.save = next;
    saveSlot(this.slot, next);
  }
}

export const gameState = new GameState();
