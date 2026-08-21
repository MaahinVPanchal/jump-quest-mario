/** Central tuning table. No gameplay file should hardcode these numbers. */
export const TILE = 32;

export const VIEW = {
  width: 1280,
  height: 720,
} as const;

export const PHYSICS = {
  gravity: 2100,
  maxFallSpeed: 900,
} as const;

export const MOVE = {
  // NES-platformer feel: slow ramp-up, real momentum, slidey stops, hard skid turns.
  walkSpeed: 200,
  runSpeed: 360,
  groundAccel: 1050,
  airAccel: 900,
  groundFriction: 1150,
  airFriction: 260,
  turnBoost: 2.4,
} as const;

export const JUMP = {
  velocity: -790,
  runBonus: -90,
  cutMultiplier: 0.34,
  bufferMs: 120,
  coyoteMs: 120,
  bounceVelocity: -560,
} as const;

export const COMBAT = {
  invulnerableMs: 1400,
  hitStopMs: 60,
  maxProjectiles: 4,
  projectileSpeed: 460,
  projectileLifeMs: 2600,
  fireCooldownMs: 260,
} as const;

export const SCORE = {
  coin: 100,
  enemyBase: 100,
  powerUp: 500,
  secret: 1000,
  levelComplete: 5000,
  timeBonusPerSecond: 50,
  comboWindowMs: 2500,
  comboSteps: [1, 2, 4, 8, 16] as const,
} as const;

export const CAMERA = {
  lerp: 0.2,
  lookAhead: 0.25,
  deadzoneWidth: 140,
  deadzoneHeight: 130,
  shakeSmall: 0.004,
  shakeBig: 0.010,
} as const;

/** Gems (Golden Relics) are instant bundles: coins plus a Sky Star. */
export const GEM = {
  coins: 10,
  stars: 1,
} as const;

export const RULES = {
  startingLives: 3,
  coinsPerLife: 100,
} as const;

// 8-bit console palette: saturated primaries, hard edges, no gradients.
export const COLORS = {
  sky: 0x5c94fc,
  cloud: 0xffffff,
  hillFar: 0x3cbc3c,
  hillNear: 0x00a800,
  treeline: 0x008000,
  grassTop: 0x00a800,
  grassBody: 0xe45c10,
  grassBodyDark: 0xa03c00,
  brick: 0xe45c10,
  brickDark: 0x902800,
  question: 0xfcbc3c,
  questionDark: 0xac7c00,
  metal: 0x9aa4b2,
  hero: 0x2f9cd8,
  heroDark: 0x1c6ea8,
  heroAccent: 0xfc7460,
  walker: 0x9cd83c,
  shell: 0xfc7460,
  flyer: 0xd882fc,
  coin: 0xfcd83c,
  relic: 0xffe680,
  orb: 0x6ee87f,
  crystal: 0xff6b3d,
  flag: 0xff4d6d,
  checkpoint: 0x4fc3ff,
  pipe: 0x00c800,
} as const;
