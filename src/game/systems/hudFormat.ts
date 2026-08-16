/**
 * Pure HUD formatters. Kept out of the scene so they can be unit tested for
 * every score / coin / time / lives range without booting Phaser.
 */

const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
};

/** 6-digit zero padded score, clamped to 000000..999999. */
export function formatScore(score: number): string {
  return `${clampInt(score, 0, 999999)}`.padStart(6, "0");
}

/** Coin counter, always "xNN" (2+ digits). */
export function formatCoins(coins: number): string {
  return `x${`${clampInt(coins, 0, 99)}`.padStart(2, "0")}`;
}

/** Countdown timer, always 3+ digits. */
export function formatTime(time: number): string {
  return `${clampInt(time, 0, 999)}`.padStart(3, "0");
}

/** Lives counter, always "xNN". */
export function formatLives(lives: number): string {
  return `x${`${clampInt(lives, 0, 99)}`.padStart(2, "0")}`;
}

/** World label in caps, e.g. "1-1". */
export function formatWorld(world: string): string {
  return `${world ?? ""}`.toUpperCase();
}

export function formatCombo(combo: number): string {
  return combo > 1 ? `COMBO x${Math.trunc(combo)}` : "";
}

/** Star counter, always "N/M" with the collected count clamped to the target. */
export function formatStars(stars: number, required: number): string {
  const target = clampInt(required, 0, 99);
  return `${clampInt(stars, 0, target)}/${`${target}`}`;
}
