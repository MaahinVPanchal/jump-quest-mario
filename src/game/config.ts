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
  walkSpeed: 190,
  runSpeed: 320,
  groundAccel: 1900,
  airAccel: 1300,
  groundFriction: 2400,
  airFriction: 500,
  turnBoost: 1.8,
} as const;

export const JUMP = {
  velocity: -760,
  runBonus: -70,
  cutMultiplier: 0.42,
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
  lerp: 0.12,
  lookAhead: 0.25,
  deadzoneWidth: 260,
  deadzoneHeight: 200,
  shakeSmall: 0.004,
  shakeBig: 0.010,
} as const;

export const RULES = {
  startingLives: 3,
  coinsPerLife: 100,
} as const;

export const COLORS = {
  sky: 0x8fd7ff,
  cloud: 0xffffff,
  hillFar: 0x7fb5a2,
  hillNear: 0x4f9b7d,
  treeline: 0x2f7a5c,
  grassTop: 0x67c463,
  grassBody: 0x8a5a3b,
  grassBodyDark: 0x6d4429,
  brick: 0xc8763f,
  brickDark: 0x8f5027,
  question: 0xf3c53b,
  questionDark: 0xb8892a,
  metal: 0x9aa4b2,
  hero: 0x2fb9c9,
  heroDark: 0x1c8494,
  heroAccent: 0xff8a3d,
  walker: 0x8ed44b,
  shell: 0xe0654a,
  flyer: 0xc48ce6,
  coin: 0xffd447,
  relic: 0xffe680,
  orb: 0x6ee87f,
  crystal: 0xff6b3d,
  flag: 0xff4d6d,
  checkpoint: 0x4fc3ff,
  pipe: 0x3fae63,
} as const;
