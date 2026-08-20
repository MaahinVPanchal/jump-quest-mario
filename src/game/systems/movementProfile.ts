import { JUMP, MOVE, PHYSICS, TILE } from "../config";
import type { CharacterData, WorldPhysics } from "../types";

/**
 * Derived movement capabilities of a hero inside a given world profile.
 * Everything here is computed from the same constants the runtime uses, so a
 * level that validates against this envelope is genuinely playable.
 */
export interface MovementProfile {
  /** Peak horizontal speed, px/s. */
  runSpeed: number;
  /** Initial jump velocity (negative, px/s). */
  jumpVelocity: number;
  gravity: number;
  /** Highest reachable point above the takeoff surface, px. */
  maxJumpHeight: number;
  /** Total hang time of a full jump, seconds. */
  airTime: number;
  /** Longest flat gap clearable at full run, px. */
  maxJumpDistance: number;
  /** Same values in tiles, rounded down — what level geometry is checked against. */
  maxJumpHeightTiles: number;
  maxJumpDistanceTiles: number;
  /** Conservative values used when placing required geometry. */
  safeJumpHeightTiles: number;
  safeJumpDistanceTiles: number;
  canDoubleJump: boolean;
}

/** Never build required geometry at more than this share of the true envelope. */
export const SAFETY_MARGIN = 0.72;

export function buildMovementProfile(
  character?: Pick<CharacterData, "speed" | "jumpForce" | "canDoubleJump"> | undefined,
  world?: WorldPhysics | undefined,
): MovementProfile {
  const speedScale = (world?.speedScale ?? 1) * (character ? 0.85 + character.speed * 0.03 : 1);
  const jumpScale = (world?.jumpScale ?? 1) * (character ? 0.9 + character.jumpForce * 0.02 : 1);
  const gravity = PHYSICS.gravity * (world?.gravityScale ?? 1);
  const runSpeed = MOVE.runSpeed * speedScale;
  const jumpVelocity = (JUMP.velocity + JUMP.runBonus) * jumpScale;

  const v = Math.abs(jumpVelocity);
  const maxJumpHeight = (v * v) / (2 * gravity);
  const airTime = (2 * v) / gravity;
  const maxJumpDistance = runSpeed * airTime;

  const doubleJump = character?.canDoubleJump ?? false;
  const heightTiles = Math.floor((maxJumpHeight * (doubleJump ? 1.7 : 1)) / TILE);
  const distTiles = Math.floor((maxJumpDistance * (doubleJump ? 1.25 : 1)) / TILE);

  return {
    runSpeed,
    jumpVelocity,
    gravity,
    maxJumpHeight,
    airTime,
    maxJumpDistance,
    maxJumpHeightTiles: heightTiles,
    maxJumpDistanceTiles: distTiles,
    safeJumpHeightTiles: Math.max(1, Math.floor(heightTiles * SAFETY_MARGIN)),
    safeJumpDistanceTiles: Math.max(2, Math.floor(distTiles * SAFETY_MARGIN)),
    canDoubleJump: doubleJump,
  };
}

/**
 * Baseline envelope: the weakest hero the campaign must stay playable for.
 * Levels are validated against this so every character can clear them.
 */
export const BASELINE_PROFILE: MovementProfile = buildMovementProfile(
  { speed: 5, jumpForce: 6, canDoubleJump: false },
  undefined,
);
